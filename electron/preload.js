const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
  request: (data) => ipcRenderer.invoke("request", data),
  db: (data) => ipcRenderer.invoke("db", data),
  hdm: (data) => ipcRenderer.invoke("hdm", data),
  tPrinter: (data) => ipcRenderer.invoke("tPrinter", data),
  auth: (data) => ipcRenderer.invoke("yandex-login", data),
});

// contextBridge.exposeInMainWorld('electronAPI', {
//   request: (id, data) => ipcRenderer.send(id, data),
//   response: (id, cb) => ipcRenderer.on(id, (_, d) => cb(d)),
// });

// ipcMain.on('send-to-backend', async (event, payload) => {
//   try {
//     const response = await sendToTaxDevice(Buffer.from(payload));
//     event.sender.send('backend-response', response.toString('hex')); // or .toString('utf-8')
//   } catch (err) {
//     event.sender.send('backend-response', `Error: ${err.message}`);
//   }
// });