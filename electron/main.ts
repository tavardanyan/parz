// @ts-nocheck

// electron/main.ts
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import url from 'node:url';
import { SupabaseClient } from './supabase.js';
import { HDMClient } from './hdm.js';
import { Thermal, ReceiptSections } from './thermal.js';
import { CryptoUtil } from './CryptoUtil.js';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new SupabaseClient();

const HDM = new HDMClient({
  ip: "192.168.0.222",
  port: 1025,
  password: "JcYZf4Th"
})

// 🪟 Create Electron window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      // webSecurity: false,
      contextIsolation: true,
      preload: app.isPackaged
          ? path.join(process.resourcesPath, "preload.js")   // prod
          : path.join(__dirname, "../electron/preload.js")   // dev
    },
  });

  // mainWindow.loadURL('http://localhost:5173');
  
  if (app.isPackaged) {
    // ✅ point directly to dist-renderer under Resources
    mainWindow.loadURL(
      url.format({
        pathname: path.join(process.resourcesPath, "../Resources/dist-renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  } else {
    mainWindow.loadURL("http://localhost:5173"); // dev server
    mainWindow.webContents.openDevTools(); // optional
  }
};


// 🧠 App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Quit only on non-macOS
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 📬 Handle IPC from renderer
ipcMain.on('send-to-backend', async (event, payload) => {
  try {
    console.log('Received payload from renderer:', payload);
    event.sender.send('backend-response', payload.toString('utf-8'));
  } catch (err) {
    console.error('Backend error:', err);
    event.sender.send('backend-response', `Error: ${err.message}`);
  }
});

ipcMain.handle("request", async (_event, data: any) => {
  const secret = 'mySuperSecretKey123!';
  const cryptoUtil = new CryptoUtil(secret);
  const decrypted = cryptoUtil.decrypt(data);
  console.log('Decrypted:', decrypted);
  const result = {
    request: data,
    result: decrypted,
    errors: [],
  }

  return result; // can be Buffer or Uint8Array
});

ipcMain.handle("db", async (_event, data: any) => {
  console.log("📥 DB request:", JSON.stringify(data, null, '\t'));
  const result = {
    request: data,
    result: await db[data.action](...data.params),
    errors: [],
  }

  return result; // can be Buffer or Uint8Array
});

ipcMain.handle("hdm", async (_event, data: any) => {
  console.log("📥 HDM request:", JSON.stringify(data, null, '\t'));
  const result = {
    request: data,
    result: {},
    errors: [],
  }
  try {
    console.log('Getting operator list...');
    const operators = await HDM.getOperatorList();
    console.log('Operators:', operators);

    console.log('Logging in to HDM...');
    try {
      await HDM.login({ cashier: 3, pin: 3 });
    } catch (error) {
      console.log('Failed to login with cashier 3, trying cashier 2...', error);
      await HDM.login({ cashier: 2, pin: 2 });
    }
    console.log('Login successful!');

  } catch (error) {
    console.log('HDM initialization error:', error);
    result.errors.push(error?.message || String(error));
    return result;
  }

  try {
    result.result = await HDM.printReceipt(data ?? {
      items: [
        {
          productCode: '398',
          productName: 'Թխվածքաբլիթ կարագով',
          price: 200,
          qty: 1,
          dep: 1,
          discount: 190,
          discountType: 2,
          adgCode: '1602',
          unit: 'Հատ'
        }
      ],
      mode: 2,
      paidAmount: 0,
      paidAmountCard: 10,
    });
    console.log('Receipt printed successfully:', result.result);
  } catch (error) {
    console.log('Receipt printing error:', error);
    result.errors.push(error?.message || String(error));
  }

  return result;
});

ipcMain.handle("tPrinter", async (_event, data: any) => {
  console.log("📥 tPrinter request:");
  const result = {
    request: data,
    result: null,
    errors: [],
  }
  if (data && data.items && data.items.length) {
    const tPrinter = new Thermal({
      size: 72,
      ip: '192.168.1.114'
    });
    
    tPrinter.setInfo(ReceiptSections.company, {
      taxId: '08290572',
      address: 'Միասնիկյան 32/2, Դիլիջան',
      phone: '+374 44 621112',
      name: 'Մեգի ՍՊԸ',
      brandName: 'Piccola',
      logo: {
        show: false
      }
    });

    tPrinter.setInfo(ReceiptSections.cashier, {
      name: 'Անահիտ Ա.',
      id: '1234'
    });
    
    tPrinter.setInfo(ReceiptSections.customer, {
      name: 'Անուն Ազգանուն',
      id: '5678'
    });

    tPrinter.setInfo(ReceiptSections.receipt, {
      date: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date()),
      number: data.id
    });
    
    tPrinter.setInfo(ReceiptSections.billing, {
      discount: 0,
      delivery: 0,
      cardAmount: data.paidAmountCard,
      cashAmount: data.paidAmount,
      subTotal: data.paidAmountCard || data.paidAmount,
      total: data.paidAmountCard || data.paidAmount,
      paymentStatus: 'Վճարված'
    });

    tPrinter.addProducts(data.items);
    if (data.status === 'paid') {
      console.log(await HDM.getOperatorList());
      const res = await HDM.printReceipt({
        items: [
          {
            productCode: '398',
            productName: 'Թխվածքաբլիթ կարագով',
            price: 200,
            qty: 1,
            dep: 1,
            discount: 190,
            discountType: 2,
            adgCode: '1602',
            unit: 'Հատ'
          }
        ],
        mode: 2,
        paidAmount: 0,
        paidAmountCard: 10,
      });
      console.log('HDM receipt result: ', res)
      await tPrinter.print();
    } 

    if (data.status === 'pending') {
      await tPrinter.prePrint();
    }


  }

  return result; // can be Buffer or Uint8Array
});

// ipcMain.handle("yandex-login", async () => {
//   const vendorWindow = new BrowserWindow({
//     width: 1200,
//     height: 900,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//     },
//   });

//   // 🔍 Access session of this window
//   const filter = { urls: ["<all_urls>"] };

//   vendorWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
//     console.log("➡️ Request:", details.method, details.url);
//     callback({});
//   });

//   vendorWindow.webContents.session.webRequest.onCompleted(filter, (details) => {
//     if (details.url === 'https://vendor.yandex.ru/4.0/restapp-front/eats-restapp-orders/v2/active') {
//       console.log("✅ Response:", details);
//     }
//   });

//   vendorWindow.webContents.session.webRequest.onErrorOccurred(filter, (details) => {
//     console.log("❌ Error:", details.url, details.error);
//   });
//   vendorWindow.webContents.openDevTools()
//   vendorWindow.loadURL("https://vendor.yandex.ru");

//   return "Vendor window opened. Check logs for requests.";
// });


ipcMain.handle("yandex-login", async () => {
  const vendorWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Open vendor portal
  vendorWindow.webContents.openDevTools()
  vendorWindow.loadURL("https://vendor.yandex.ru");

  // Attach Chrome DevTools Protocol debugger
  try {
    vendorWindow.webContents.debugger.attach("1.3");
    console.log("🔗 Debugger attached to webContents");
  } catch (err) {
    console.error("❌ Failed to attach debugger:", err);
    return "Failed to attach debugger";
  }

  // Listen for network responses
  vendorWindow.webContents.debugger.on("message", async (_event, method, params) => {
    if (method === "Network.responseReceived") {
      const { requestId, response } = params;
      if (!response.url.includes("eats-restapp-orders")) return; // filter only relevant URLs

      try {
        // Get response body
        const body = await vendorWindow.webContents.debugger.sendCommand("Network.getResponseBody", {
          requestId,
        });

        console.log("🌍 URL:", response.url);
        console.log("📦 Body:", body.body.slice(0, 500)); // log first 500 chars only
        // vendorWindow.hide();
      } catch (err) {
        // some responses (like images, streams) may not have a body
        console.warn("⚠️ Could not read body for", response.url, err.message);
      }
    }
  });

  // Enable network tracking
  await vendorWindow.webContents.debugger.sendCommand("Network.enable");

  return "Vendor window opened and network logging started";
});
