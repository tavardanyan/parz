import ThermalPrinterPkg from 'node-thermal-printer';
import { createCanvas, loadImage, type CanvasRenderingContext2D } from 'canvas';
import bwipjs from 'bwip-js';

const { printer: ThermalPrinter, types } = ThermalPrinterPkg;

type ThermalPrinterType = InstanceType<typeof ThermalPrinter>;

interface CompanyInfo {
  taxId: string | null,
  address: string | null,
  phone: string | null,
  name: string | null,
  brandName: string | null,
  logo: {
    url?: string,
    show: boolean
  }
}

interface CashierInfo {
  name: string | null,
  id: string | null
}

interface CustomerInfo {
  name: string | null,
  id: string | null
}

interface ReceiptInfo {
  date: Date,
  number: string | null,
}

interface BillingInfo {
  discount: number | null,
  delivery: number | null,
  cardAmount: number | null,
  cashAmount: number | null,
  subTotal: number | null,
  total: number | null
  paymentStatus: string | null,
}

interface SectionsInfo {
  company: CompanyInfo
  cashier: CashierInfo
  customer: CustomerInfo
  receipt: ReceiptInfo
  billing: BillingInfo
}

interface Product {
  name: string,
  description: string | null,
  qty: number,
  price: number
}

type Languages = 'hy' | 'en' | 'ru'
type Sizes = 58 | 80 | 72

const ReceiptSections = {
  company: 'company',
  cashier: 'cashier',
  customer: 'customer',
  receipt: 'receipt',
  billing: 'billing',
  configs: 'configs'
} as const;

const empty: SectionsInfo = {
  receipt: {
    date: new Date(),
    number: null,
  },
  customer: {
    name: null,
    id: null
  },
  cashier: {
    name: null,
    id: null
  },
  company: {
    taxId: null,
    address: null,
    phone: null,
    name: null,
    brandName: null,
    logo: {
      show: false
    }
  },
  billing: {
    discount: null,
    delivery: null,
    cardAmount: null,
    cashAmount: null,
    subTotal: null,
    total: null,
    paymentStatus: null,
  }
}

const localization = {
  hy: {
    configs: {
      products: 'Ապրանքներ',
    },
    company: {
      taxId: 'ՀՎՀՀ',
      address: 'Հասցե',
      phone: 'Հեռ',
      name: 'Անվանում',
    },
    cashier: {
      name: 'Աշխատակից',
      id: 'ID'
    },
    customer: {
      name: 'Հաճախորդ',
      id: 'ID'
    },
    receipt: {
      number: 'Կտրոն',
      date: 'Ամսաթիվ',
    },
    billing: {
      discount: 'Զեղչ',
      delivery: 'Առաքում',
      cardAmount: 'անկանխիկ',
      cashAmount: 'կանխիկ',
      subTotal: 'Մինչև զեղչը',
      total: 'Ընդամենը',
      paymentStatus: 'Կարգավիճակ'
    }
  }
}

class Thermal {
  private X: number = 10;
  private Y: number = 10;

  private margin: number = 10;
  private lineHeight = 28
  private headerLineHeight = 32;
  private productLineHeight = 28 * 2 + 15; // product line + description + spacing

  private headerHeight = 6 * (this.headerLineHeight) + 50;

  private width: number;
  private height: number;
  private ip: string;
  private printer: ThermalPrinterType;

  private info: SectionsInfo = empty;

  private products: Product[] = [];

  private canvas: ReturnType<typeof createCanvas>;
  private ctx: CanvasRenderingContext2D;

  private language: Languages = 'hy';
  private font: {
    hy: string,
    en: string,
    ru: string
  } = {
    hy: '24px Noto Sans Armenian',
    en: '24px Arial',
    ru: '24px Arial'
  };

  public setup: Record<keyof typeof ReceiptSections, boolean> = {
    company: false,
    cashier: false,
    customer: false,
    receipt: false,
    billing: false,
    configs: true
  }

  constructor(options: {
    size: Sizes,
    ip: string,
    language?: Languages
  }) {
    this.width = options.size * 8;
    this.ip = options.ip;
    this.printer = new ThermalPrinter({
      type: types.EPSON,
      interface: `tcp://${this.ip}`
    });
    this.language = options.language || 'hy';
  }

  private localize (section: keyof typeof ReceiptSections, key: string) {
    return localization[this.language][section][key];
  }

  setInfo(section: keyof typeof ReceiptSections, info) {
    this.setup[section] = true;
    this.info[section] = { ...this.info[section], ...info };
  }

  addProducts(products: Product[]) {
    this.products = [...this.products, ...products];
  }

  public drawProducts() {
    this.space();
    this.divider(`${this.localize(ReceiptSections.configs, 'products')} (${this.products.length})`);
    let index = 1;
  
    for (const p of this.products) {
      const amount = p.qty * p.price;
  
      // ---- First line: product name + qty x price ----
      this.ctx.font = "bold 22px Arial";
      this.ctx.fillStyle = "black";
      this.ctx.textAlign = "left";
  
      // Numeration + product name
      this.ctx.fillText(
        `${index}. ${p.name}`,
        this.margin,
        this.Y + this.lineHeight
      );
  
      // Qty x Price (right side)
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `${p.qty} x ${p.price}`,
        this.width - this.margin,
        this.Y + this.lineHeight
      );
  
      this.Y += this.lineHeight;
  
      // ---- Second line: description + amount ----
      this.ctx.font = "20px Arial";
      this.ctx.textAlign = "left";
      this.ctx.fillText(p.description ?? '', this.margin + 30, this.Y + this.lineHeight);
  
      this.ctx.font = "bold 24px Arial";
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `${amount}`,
        this.width - this.margin,
        this.Y + this.lineHeight
      );
  
      this.Y += this.lineHeight + 5;
  
      // ---- Dashed separator ----
      this.ctx.setLineDash([4, 4]); // 4px dash, 4px gap
      this.ctx.beginPath();
      this.ctx.moveTo(this.margin, this.Y);
      this.ctx.lineTo(this.width - this.margin, this.Y);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // reset solid line
  
      this.Y += 10; // spacing after line
      index++;
    }
  
    this.ctx.textAlign = "left"; // reset
  }

  private divider(title?: string) {
    const lineY = this.Y + this.lineHeight;
  
    // ---- Draw line ----
    this.ctx.beginPath();
    this.ctx.moveTo(this.margin, lineY);
    this.ctx.lineTo(this.width - this.margin, lineY);
    this.ctx.stroke();
  
    // ---- Draw title if provided ----
    if (title) {
      this.ctx.font = "bold 24px Arial";
      this.ctx.fillStyle = "black";
      this.ctx.textAlign = "left";
  
      this.ctx.fillText(title, this.margin, lineY - 8); // 8px above line
    }
  
    this.Y = lineY + 10; // move cursor down after divider
    this.ctx.textAlign = "left"; // reset
  }
  

  private cleanUp(force: boolean = false) {
    this.X = 10;
    this.Y = 10;

    this.ctx.clearRect(0,0,this.width, this.height)
    this.ctx.restore();

    this.height = 0;

    this.setup = {
      company: !force,
      cashier: !force,
      customer: false,
      receipt: false,
      billing: false,
      configs: true
    }

    if (force) {
      this.info = empty;
    } else {
      this.info.customer = empty.customer;
      this.info.receipt = empty.receipt;
      this.info.billing = empty.billing
    }

    this.products = [];
    
  }

  reset() {
    this.cleanUp(true);
  }

  async print() {
    this.checkData();

    this.createCanvasContext();
    this.setupContext();

    this.space(3);
    this.drawBrandTitle(this.info.company.brandName || 'BRAND NAME');
    this.drawHeader();
    this.space(1);
    this.drawProducts();
    this.drawBillingSection();

    await this.drawReceiptBarcode();
    await this.printReceipt()

    this.cleanUp();
  }

  private checkData() {
    if (!this.setup.company) {
      throw new Error('Company info is not set');
    }
    if (!this.setup.cashier) {
      throw new Error('Cashier info is not set');
    }
    if (!this.setup.customer) {
      throw new Error('Customer info is not set');
    }
    if (!this.setup.receipt) {
      throw new Error('Receipt info is not set');
    }
    if (this.products.length === 0) {
      throw new Error('No products to print');
    }
  }

  private calculateHeight() {
    this.height = this.headerHeight + (this.products.length * this.productLineHeight) + 950;
  }

  private createCanvasContext() {
    this.calculateHeight();
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
  }

  setupContext() {
    this.ctx.font = this.font[this.language];
  }

  private space (lines: number = 1) {
    this.Y += lines * this.lineHeight;
  }

  private fillText (text: string) {
    this.ctx.fillText(text, this.X, this.Y);
    this.space();
  }

  private fillTextCols (left: string, right: string) {
    this.ctx.textAlign = 'left';
    this.ctx.fillText(left, this.X, this.Y);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(right, this.width - (this.margin * 2), this.Y);
    this.space();
  }

  private fillTextColsFromObject (sectionName, obj, key) {
    this.fillTextCols(this.localize(sectionName, key), obj[key])
  }

  private drawHeader() {
    this.space(2);
    this.fillTextColsFromObject(ReceiptSections.company, this.info.company, 'taxId');
    this.fillTextColsFromObject(ReceiptSections.company, this.info.company, 'name');
    this.fillTextColsFromObject(ReceiptSections.company, this.info.company, 'address');
    this.fillTextColsFromObject(ReceiptSections.company, this.info.company, 'phone');
    this.space()
    this.fillTextColsFromObject(ReceiptSections.receipt, this.info.receipt, 'number');
    this.fillTextColsFromObject(ReceiptSections.receipt, this.info.receipt, 'date');
    this.space()
    this.fillTextColsFromObject(ReceiptSections.cashier, this.info.cashier, 'name');
    this.fillTextColsFromObject(ReceiptSections.customer, this.info.customer, 'name');
    
  }

  private drawBillingInfo(
    items: { 
      label: string; 
      value: string | number; 
      bold?: boolean; 
      fontSize?: number; 
    }[]
  ) {
    const padding = 20;
  
    items.forEach(({ label, value, bold, fontSize }, i) => {
      if (items.length - 2 === i) {
        this.space();
      }
      const size = fontSize ?? 20; // default 14px
      this.ctx.font = `${bold ? "bold" : ""} ${size}px Arial`;
      this.ctx.fillStyle = "black";
  
      // Label (left side)
      this.ctx.textAlign = "right";
      this.ctx.fillText(label, this.width / 2 + 150, this.Y);
  
      // Value (right side)
      this.ctx.textAlign = "right";
      this.ctx.fillText(String(value), this.width - padding, this.Y);
  
      this.Y += size + 4; // add spacing based on font size
      if (items.length - 2 === i) {
        this.space();
      }
    });
  
    this.ctx.textAlign = "left"; // reset
    this.space(3);
  }

  private drawBillingSection() {
    this.space(2);
    const billingItems: { 
      label: string; 
      value: string | number; 
      bold?: boolean; 
      fontSize?: number; 
    }[] = [];

    if (this.info.billing.subTotal !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'subTotal'),
        value: this.info.billing.subTotal,
        fontSize: 22
      });
    }
    if (this.info.billing.discount !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'discount'),
        value: this.info.billing.discount,
        fontSize: 22
      });
    }
    if (this.info.billing.delivery !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'delivery'),
        value: this.info.billing.delivery,
        fontSize: 22
      });
    }
    if (this.info.billing.cardAmount !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'cardAmount'),
        value: this.info.billing.cardAmount,
        fontSize: 22
      });
    }
    if (this.info.billing.cashAmount !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'cashAmount'),
        value: this.info.billing.cashAmount,
        fontSize: 22
      });
    }
    if (this.info.billing.total !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'total'),
        value: this.info.billing.total,
        bold: true,
        fontSize: 30
      });
    }
    if (this.info.billing.paymentStatus !== null) {
      billingItems.push({
        label: this.localize(ReceiptSections.billing, 'paymentStatus'),
        value: this.info.billing.paymentStatus,
        bold: true,
        fontSize: 20
      });
    }

    this.drawBillingInfo(billingItems);
  }

  private drawBrandTitle(text: string) {
    const rectHeight = 120; // height of the box
    const padding = 6;     // gap between outer and inner rect

    // Outer rectangle (stroke)
    this.ctx.strokeRect(this.margin, this.Y, this.width - this.margin * 2, rectHeight);

    // Inner rectangle (filled)
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(
      this.margin + padding,
      this.Y + padding,
      this.width - (this.margin + padding) * 2,
      rectHeight - padding * 2
    );

    // Text (white, centered)
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = "bold 68px Arial"; // Or use Armenian font if needed

    this.ctx.fillText(
      text,
      this.width / 2,
      this.Y + rectHeight / 2
    );

    // Move cursor down
    this.Y += rectHeight + this.lineHeight;
    this.ctx.textAlign = "left"; // reset alignment
    this.ctx.textBaseline = "alphabetic"; // reset baseline
    this.ctx.fillStyle = "black"; // reset color
    this.ctx.font = this.font[this.language]; // reset font
  }

  private async drawReceiptBarcode(value: string = '', text: string = '') {
    if(value + text === '') {
      value = text = `Y-${Math.floor(Date.now() / 1000)}-0001-001-00${this.info.receipt.number || '0000'}`;
    }
    // Generate barcode as PNG buffer
    const png = await bwipjs.toBuffer({
      bcid: "pdf417",       // Barcode type
      text: value,          // Data
      scale: 3,             // Scaling factor
      height: 10,           // Bar height
      includetext: false,   // We’ll draw text manually
    });

    // Load barcode into canvas
    const img = await loadImage(png);
    const barcodeHeight = img.height;
    const barcodeWidth = img.width;

    // Center the barcode
    const x = (this.width - barcodeWidth) / 2;
    this.ctx.drawImage(img, x, this.Y);

    // Move Y down
    this.Y += barcodeHeight + 5;

    // Draw text below barcode
    this.ctx.fillStyle = "black";
    // this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, this.width / 2, this.Y + 16);

    // Move Y further for next drawing
    this.Y += 30;
    this.ctx.textAlign = "left"; // reset
  }


  private async printReceipt() {
    const buffer = this.canvas.toBuffer('image/png');
    try {
      await this.printer.printImageBuffer(buffer);
      this.printer.cut();
      await this.printer.execute();
      console.log('✅ Receipt printed successfully!');
    } catch (err) {
      console.error('❌ Printing failed:', err);
    }
  }
}

const tPrinter = new Thermal({
  size: 72,
  ip: '192.168.1.114'
});

tPrinter.setInfo(ReceiptSections.company, {
  taxId: '01234567',
  address: 'Թումանյան 1, Երևան',
  phone: '+374 10 123456',
  name: 'Իմ Ընկերությունը ՍՊԸ',
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
  name: 'Մանե Մ.',
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
  number: '0001'
});

tPrinter.setInfo(ReceiptSections.billing, {
  discount: 200,
  delivery: 500,
  cardAmount: 1000,
  cashAmount: 300,
  subTotal: 1500,
  total: 1300,
  paymentStatus: 'Վճարված'
});

tPrinter.addProducts([
  {
    name: 'Ապրանք 1',
    description: 'Նկարագրություն 1',
    qty: 2,
    price: 500
  },
  {
    name: 'Ապրանք 2',
    description: 'Նկարագրություն 2',
    qty: 1,
    price: 500
  }
]);

await tPrinter.print();


setTimeout(() => tPrinter.print(), 50_000);
