import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import Barcode from 'bwip-js';
import ThermalPrinterPkg from 'node-thermal-printer';
import { readFileSync } from 'fs';

const { printer: ThermalPrinter, types } = ThermalPrinterPkg;

const printerIp = '192.168.1.114';
const printer = new ThermalPrinter({
  type: types.EPSON,
  interface: `tcp://${printerIp}`
});

const receipt = {
  taxId: '012345678',
  address: 'Երևան, Մաշտոցի 10',
  phone: '+374 91 123456',
  date: new Date(),
  cashier: 'Միքայել',
  receiptNumber: 'R-00123',
  customer: 'Գագիկ',
  products: [
    { name: 'Ապրանք A', qty: 2, price: 100, description: 'Մանրամասն A' },
    { name: 'Ապրանք B', qty: 1, price: 250, description: 'Մանրամասն B' },
  ],
  discount: 50,
  delivery: 20,
  paymentMethod: 'Կանխիկ',
  paymentStatus: 'Վճարված',
  instagram: 'https://instagram.com/murano_cake'
};

async function createReceiptCanvas() {
  const width = 580;       // full 72mm width
  const margin = 5;
  let y = 20;
  const lineHeight = 28;

  // Estimate height
  const height = 1400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'black';

  function moveY(delta = 4) {
    y += lineHeight + delta;
  }

  // === LOGO ===
  try {
    const logo = await loadImage('logo.png'); // logo must be in project folder
    const logoMaxWidth = width - margin * 2;
    const scale = logo.width > logoMaxWidth ? logoMaxWidth / logo.width : 1;
    const logoWidth = logo.width * scale - 200;
    const logoHeight = logo.height * scale - (logo.height / logo.width * 200);
    const logoX = (width - logoWidth) / 2;

    ctx.drawImage(logo, logoX, y, logoWidth, logoHeight);
    y += logoHeight + 20; // add spacing under logo
  } catch (err) {
    console.warn('⚠️ Logo not found, skipping...');
  }

  // === HEADER ===
  const colX = width / 2 - 100;
  ctx.font = '24px Noto Sans Armenian';
  moveY(50);
  ctx.textAlign = 'left';
  ctx.fillText(`ՀՎՀՀ: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(receipt.taxId, width - margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText('Հասցե: ', 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(receipt.address, width-margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText(`Հեռ: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${receipt.phone}`, width-margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText(`Աշխատակից: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${receipt.cashier}`, width-margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText(`Օրվա համարը: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${receipt.receiptNumber}`, width-margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText(`Ամսաթիվ: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${receipt.date.toLocaleString()}`, width-margin, y);
  moveY();
  ctx.textAlign = 'left';
  ctx.fillText(`Հաճախորդ: `, 0, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${receipt.customer}`, width-margin, y);
  moveY(10);

  // Divider
  ctx.beginPath();
  ctx.moveTo(margin, y);
  moveY(20);
  ctx.stroke(); y += 10;

  ctx.stroke(); y += 10;

  // === PRODUCTS ===
  ctx.textAlign = 'left';
  ctx.font = '22px Noto Sans Armenian';
  for (const p of receipt.products) {
    ctx.fillText(`${p.name}`, margin, y);
    ctx.fillText(`${p.qty} x ${p.price} = ${p.qty * p.price}`, width - margin - 160, y);
    y += lineHeight;
    ctx.fillText(`${p.description}`, margin, y);
    y += lineHeight;
  }
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  ctx.lineTo(margin+1, y);
  moveY()
  ctx.stroke(); y += 10;
  ctx.lineTo(margin, y);

  // Totals
  let subtotal = receipt.products.reduce((a, b) => a + b.qty * b.price, 0);
  ctx.fillText(`Զեղչ: ${receipt.discount}`, margin, y); y += lineHeight;
  ctx.fillText(`Առաքում: ${receipt.delivery}`, margin, y); y += lineHeight;
  ctx.fillText(`Ընդամենը: ${subtotal - receipt.discount + receipt.delivery}`, margin, y); y += lineHeight;
  ctx.fillText(`Վճարման եղանակ: ${receipt.paymentMethod}`, margin, y); y += lineHeight;
  ctx.fillText(`Վճարման վիճակ: ${receipt.paymentStatus}`, margin, y); y += lineHeight;

  // Divider
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke(); y += 10;

  // === QR CODE ===
  const qrSize = width - margin * 2;
  const qrCanvas = createCanvas(qrSize, qrSize);
  await QRCode.toCanvas(qrCanvas, receipt.instagram, { width: qrSize });
  ctx.drawImage(qrCanvas, margin, y);
  y += qrSize + 10;

  // === BARCODE ===
  const barcodeBuffer = await Barcode.toBuffer({
    bcid: 'code128',
    text: receipt.receiptNumber,
    scale: 4,
    height: 80,
    includetext: true
  });
  const barcodeImg = await loadImage(barcodeBuffer);
  const barcodeX = (width - barcodeImg.width) / 2;
  ctx.drawImage(barcodeImg, barcodeX, y);
  y += barcodeImg.height + 10;

  return canvas;
}

async function printReceipt() {
  const canvas = await createReceiptCanvas();
  const buffer = canvas.toBuffer('image/png');

  try {
    await printer.printImageBuffer(buffer);
    printer.cut();
    await printer.execute();
    console.log('✅ Receipt printed successfully!');
  } catch (err) {
    console.error('❌ Printing failed:', err);
  }
}

printReceipt();
