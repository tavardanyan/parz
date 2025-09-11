// @ts-nocheck

// hdm-client.mjs  – Node ≥16 (ESM)
import net from 'node:net';
import { once } from 'node:events';
import {
  createHash,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';

/* ─── protocol constants ─── */
const PROTO_VERSION = 0x05;
const INDICATOR     = Buffer.from('ՀԴՄ', 'utf8');   // 6 bytes
const HDR_REQ       = 12;
const HDR_RES       = 11;

/* ─── crypto helpers ─── */
const keyA = pass =>
  createHash('sha256').update(pass, 'utf8').digest().subarray(0, 24);

const enc3des = (buf, key) => {
  const c = createCipheriv('des-ede3', key, null);
  return Buffer.concat([c.update(buf), c.final()]);
};
const dec3des = (buf, key) => {
  const d = createDecipheriv('des-ede3', key, null);
  return Buffer.concat([d.update(buf), d.final()]);
};

/* ─── header builder ─── */
const mkHeader = (fn, bodyLen) => {
  const h = Buffer.alloc(HDR_REQ);
  INDICATOR.copy(h);
  h[6] = 0;
  h[7] = PROTO_VERSION;
  h[8] = fn;
  h[9] = 0;
  h.writeUInt16BE(bodyLen, 10);
  return h;
};

/* ─── HDM client ─── */
export class HDMClient {
  constructor({ ip, port = 9100, password }) {
    this._ip   = ip;
    this._port = port;
    this._pwd  = password;
    this._keyA = keyA(password);
    this._keyB = null;
    this._seq  = 1;
    this._sock = null;
    this._stash = Buffer.alloc(0);
  }

  /* connection */
  async _ensureSock() {
    if (this._sock && !this._sock.destroyed) return;
    this._sock = net.createConnection({ host: this._ip, port: this._port });
    await once(this._sock, 'connect');
  }
  async close() {
    this._sock?.end(); this._sock?.destroy();
    this._sock = null; this._stash = Buffer.alloc(0);
    this._keyB = null; this._seq  = 1;
  }

  /* exact read */
  async _read(len, ms = 15000) {
    let buf = this._stash;
    for (let c; (c = this._sock.read()) !== null;) {
      buf = Buffer.concat([buf, c]);
      if (buf.length >= len) break;
    }
    if (buf.length < len) {
      const abort = AbortSignal.timeout(ms);
      while (buf.length < len) {
        const [chunk] = await Promise.race([
          once(this._sock, 'data', { signal: abort }),
          once(abort, 'abort').then(() => {
            throw new Error(`timeout waiting ${len}B`);
          }),
        ]);
        buf = Buffer.concat([buf, chunk]);
      }
    }
    this._stash = buf.subarray(len);
    return buf.subarray(0, len);
  }

  /* core tx/rx */
  async _tx(fn, body, useB = false) {
    await this._ensureSock();
    const key  = useB ? this._keyB : this._keyA;
    const enc  = enc3des(Buffer.from(JSON.stringify(body), 'utf8'), key);
    this._sock.write(Buffer.concat([mkHeader(fn, enc.length), enc]));

    const h    = await this._read(HDR_RES);
    const code = h[2];
    const len  = h.readUInt16BE(7);

    let obj = {};
    if (len) {
      const plain = dec3des(await this._read(len), key).toString('utf8');
      obj = plain ? JSON.parse(plain) : {};
    }
    if (code !== 0x10 && code !== 0x02)
      throw new Error(`device error 0x${code.toString(16)}`);
    return obj;
  }

  /* helpers for reqs needing seq + keyB */
  _sessionCall(fn, data = {}) {
    if (!this._keyB) throw new Error('login() first');
    return this._tx(fn, { seq: this._seq++, ...data }, true);
  }

  /* ─── command wrappers (codes 1‑15) ─── */

  /* 1 */ getOperatorList() {
    return this._tx(0x01, { password: this._pwd });        // keyA
  }

  /* 2 */ login({ cashier, pin }) {
    return this._tx(0x02, { password: this._pwd, cashier, pin })
      .then(r => { this._keyB = Buffer.from(r.key, 'base64'); return r; });
  }

  /* 3 */ logout() {             // end session
    return this._sessionCall(0x03);
  }

  /* 4 */ printReceipt(data) {
    return this._sessionCall(0x04, data);
  }

  /* 5 */ printLastCopy() {
    return this._sessionCall(0x05);
  }

  /* 6 */ printReturn(data) {
    return this._sessionCall(0x06, data);
  }

  /* 7 */ setHeaderFooter(cfg) {
    return this._sessionCall(0x07, cfg);
  }

  /* 8 */ setLogo(cfg) {
    return this._sessionCall(0x08, cfg);
  }

  /* 9 */ printReport(cfg) {
    return this._sessionCall(0x09, cfg);
  }

  /* 10 */ getReceiptInfo(seq) {
    return this._sessionCall(0x0a, { seq });
  }

  /* 11 */ cashInOut(data) {
    return this._sessionCall(0x0b, data);
  }

  /* 12 */ getDateTime() {
    return this._sessionCall(0x0c);
  }

  /* 13 */ printTemplate(data) {
    return this._sessionCall(0x0d, data);
  }

  /* 14 */ syncDevice(data = {}) {
    return this._sessionCall(0x0e, data);
  }

  /* 15 */ getPaySystems() {
    return this._sessionCall(0x0f);
  }
}
