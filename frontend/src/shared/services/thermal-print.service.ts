/**
 * Thermal Print Service — ESC/POS via Web Bluetooth
 *
 * Supports 58mm & 80mm thermal printers that expose a Bluetooth GATT service.
 * Common printers: Xprinter, EPPOS, MiniPOS, Bluetooth POS-58.
 *
 * Usage:
 *   import { thermalPrint } from '@/shared/services/thermal-print.service';
 *   await thermalPrint.connect();
 *   await thermalPrint.printReceipt(receiptData);
 *   thermalPrint.disconnect();
 *
 * Note: Web Bluetooth requires HTTPS (or localhost) and user gesture to pair.
 */

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;
const COMMANDS = {
  INIT: [ESC, 0x40], // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT: [GS, 0x21, 0x10],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  CUT: [GS, 0x56, 0x00], // Full cut
  FEED_3: [ESC, 0x64, 0x03], // Feed 3 lines
  FEED_2: [ESC, 0x64, 0x02], // Feed 2 lines
  LINE: [0x0a], // Line feed
};

// Standard Bluetooth Serial Port service UUID
const SERIAL_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const SERIAL_CHAR_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs (some printers use these)
const ALT_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const ALT_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

export interface ReceiptData {
  shopName: string;
  trxNumber: string;
  date: string;
  cashierName: string;
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>;
  subtotal: number;
  discount?: number;
  total: number;
  paid: number;
  change: number;
  method: string;
  customerName?: string;
}

export interface BrilinkReceiptData {
  shopName: string;
  shopAddress?: string;
  refNumber: string;
  date: string;
  cashierName: string;
  category: string; // "Tarik Tunai", "Transfer BRI", "Transfer Antar Bank", dll
  metodeAdmin?: string; // "Admin Dalam" | "Admin Luar" | "Potong Saldo" — hanya Tarik Tunai
  customerName: string;
  customerPhone?: string;
  destination?: string; // no rek / no hp tujuan (kosong untuk Tarik Tunai)
  bankName?: string; // nama bank tujuan (untuk transfer)
  amount: number; // nominal
  systemFee?: number; // biaya sistem (EDC)
  adminFee?: number; // biaya admin (profit agen)
  fee: number; // total fee
  total: number; // uang yang diterima dari nasabah
  status: string; // Sukses, Void, Pending
}

class ThermalPrintService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _connected = false;

  get isConnected(): boolean {
    return this._connected;
  }

  get deviceName(): string {
    return this.device?.name || 'Unknown';
  }

  /**
   * Pair and connect to a Bluetooth thermal printer.
   * Shows browser pairing dialog — user picks printer from list.
   */
  async connect(): Promise<boolean> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge.');
    }

    try {
      // Accept all Bluetooth devices (most thermal printers don't advertise standard services)
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERIAL_SERVICE_UUID, ALT_SERVICE_UUID, '000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'],
      });

      const server = await this.device.gatt!.connect();

      // Try different service UUIDs (printers vary widely)
      const serviceUUIDs = [SERIAL_SERVICE_UUID, ALT_SERVICE_UUID, 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'];
      let service: BluetoothRemoteGATTService | null = null;

      for (const uuid of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid);
          break;
        } catch { continue; }
      }

      if (!service) {
        // Try getting any available service
        const services = await server.getPrimaryServices();
        if (services.length > 0) service = services[0];
      }

      if (!service) {
        throw new Error('Tidak bisa menemukan service printer. Coba restart printer.');
      }

      // Get writable characteristic
      const characteristics = await service.getCharacteristics();
      this.characteristic = characteristics.find(c =>
        c.properties.write || c.properties.writeWithoutResponse
      ) || characteristics[0];

      if (!this.characteristic) {
        throw new Error('Tidak bisa menemukan characteristic untuk menulis ke printer.');
      }

      this._connected = true;
      return true;
    } catch (err: any) {
      this._connected = false;
      if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
        throw new Error('cancelled');
      }
      throw new Error(`Gagal connect: ${err.message}`);
    }
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this._connected = false;
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Send raw bytes to printer in chunks (BLE has 20-byte MTU limit).
   */
  private async sendBytes(data: number[]): Promise<void> {
    if (!this.characteristic) throw new Error('Printer belum terconnect.');

    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(new Uint8Array(chunk));
      // Small delay between chunks for printer buffer
      await new Promise(r => setTimeout(r, 20));
    }
  }

  private textToBytes(text: string): number[] {
    return Array.from(new TextEncoder().encode(text));
  }

  private line(text: string): number[] {
    return [...this.textToBytes(text), ...COMMANDS.LINE];
  }

  private separator(): number[] {
    return this.line('--------------------------------');
  }

  /**
   * Print a full receipt.
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    const bytes: number[] = [];

    // Initialize
    bytes.push(...COMMANDS.INIT);

    // Shop name (center, bold, double)
    bytes.push(...COMMANDS.ALIGN_CENTER);
    bytes.push(...COMMANDS.BOLD_ON);
    bytes.push(...COMMANDS.DOUBLE_HEIGHT);
    bytes.push(...this.line(data.shopName));
    bytes.push(...COMMANDS.NORMAL_SIZE);
    bytes.push(...COMMANDS.BOLD_OFF);
    bytes.push(...COMMANDS.LINE);

    // Separator
    bytes.push(...this.separator());

    // Transaction info (left align)
    bytes.push(...COMMANDS.ALIGN_LEFT);
    bytes.push(...this.line(`No: ${data.trxNumber}`));
    bytes.push(...this.line(`${data.date}    ${data.method}`));
    bytes.push(...this.line(`Kasir: ${data.cashierName}`));

    bytes.push(...this.separator());

    // Items
    for (const item of data.items) {
      bytes.push(...this.line(item.name));
      const itemLine = `${item.qty} x ${this.fmtRp(item.price)}`;
      const subtotalStr = this.fmtRp(item.subtotal);
      const padding = ' '.repeat(Math.max(1, 32 - itemLine.length - subtotalStr.length));
      bytes.push(...this.line(`${itemLine}${padding}${subtotalStr}`));
    }

    bytes.push(...this.separator());

    // Totals
    bytes.push(...this.lineRight('Subtotal', this.fmtRp(data.subtotal)));
    if (data.discount && data.discount > 0) {
      bytes.push(...this.lineRight('Diskon', `-${this.fmtRp(data.discount)}`));
    }
    bytes.push(...COMMANDS.BOLD_ON);
    bytes.push(...this.lineRight('TOTAL', this.fmtRp(data.total)));
    bytes.push(...COMMANDS.BOLD_OFF);
    bytes.push(...this.lineRight('Bayar', this.fmtRp(data.paid)));
    if (data.change > 0) {
      bytes.push(...this.lineRight('Kembali', this.fmtRp(data.change)));
    }

    bytes.push(...this.separator());

    // Footer
    bytes.push(...COMMANDS.ALIGN_CENTER);
    bytes.push(...this.line('Terima kasih atas kunjungan Anda!'));
    bytes.push(...COMMANDS.LINE);

    // Feed and cut
    bytes.push(...COMMANDS.FEED_3);
    bytes.push(...COMMANDS.CUT);

    await this.sendBytes(bytes);
  }

  /**
   * Print a BRILink receipt. Compact: minimal paper, aligned ":" labels.
   */
  async printBrilinkReceipt(data: BrilinkReceiptData): Promise<void> {
    const bytes: number[] = [];
    bytes.push(...COMMANDS.INIT);

    // Header (center, bold)
    bytes.push(...COMMANDS.ALIGN_CENTER);
    bytes.push(...COMMANDS.BOLD_ON);
    bytes.push(...COMMANDS.DOUBLE_HEIGHT);
    bytes.push(...this.line(data.shopName));
    bytes.push(...COMMANDS.NORMAL_SIZE);
    bytes.push(...COMMANDS.BOLD_OFF);
    if (data.shopAddress) bytes.push(...this.line(data.shopAddress));
    bytes.push(...this.separator());

    // Date & Ref (compact, padded ":")
    bytes.push(...COMMANDS.ALIGN_LEFT);
    bytes.push(...this.line(data.date));
    bytes.push(...this.linePad('No Ref', data.refNumber));
    bytes.push(...this.linePad('Kasir', data.cashierName));
    bytes.push(...this.separator());

    // Detail (padded labels — ":" aligned)
    bytes.push(...this.linePad('Transaksi', data.category));
    if (data.metodeAdmin) bytes.push(...this.linePad('Metode', data.metodeAdmin));
    bytes.push(...this.linePad('Nama', data.customerName || '-'));
    bytes.push(...this.linePad('No HP', data.customerPhone || '-'));
    if (data.destination) bytes.push(...this.linePad('Tujuan', data.destination));
    if (data.bankName) bytes.push(...this.linePad('Bank', data.bankName));
    bytes.push(...this.separator());

    // Financials
    bytes.push(...this.lineRight('Nominal', this.fmtRp(data.amount)));
    if (data.systemFee && data.systemFee > 0) bytes.push(...this.lineRight('Biaya Sistem', this.fmtRp(data.systemFee)));
    if (data.adminFee && data.adminFee > 0) bytes.push(...this.lineRight('Biaya Admin', this.fmtRp(data.adminFee)));
    bytes.push(...COMMANDS.BOLD_ON);
    bytes.push(...this.lineRight('TOTAL', this.fmtRp(data.total)));
    bytes.push(...COMMANDS.BOLD_OFF);
    bytes.push(...this.separator());

    // Status
    bytes.push(...COMMANDS.BOLD_ON);
    bytes.push(...this.linePad('Status', data.status));
    bytes.push(...COMMANDS.BOLD_OFF);
    bytes.push(...this.separator());

    // Footer (compact)
    bytes.push(...COMMANDS.ALIGN_CENTER);
    bytes.push(...this.line('Terima kasih'));
    bytes.push(...this.line('Simpan resi sebagai bukti'));

    // Minimal feed then cut (2 lines instead of 3)
    bytes.push(...COMMANDS.FEED_2);
    bytes.push(...COMMANDS.CUT);
    await this.sendBytes(bytes);
  }

  private lineRight(left: string, right: string): number[] {
    const padding = ' '.repeat(Math.max(1, 32 - left.length - right.length));
    return this.line(`${left}${padding}${right}`);
  }

  /**
   * Padded label line: "Label   : Value"
   * Label is padded to 10 chars so ":" aligns neatly.
   */
  private linePad(label: string, value: string): number[] {
    const padded = label.padEnd(10, ' ');
    return this.line(`${padded}: ${value}`);
  }

  private fmtRp(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
  }
}

export const thermalPrint = new ThermalPrintService();
export default thermalPrint;
