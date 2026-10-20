export type ProductCategoryType = 
  | 'laptops'
  | 'macbooks'
  | 'desktops'
  | 'monitors'
  | 'gpus'
  | 'cpus'
  | 'motherboards'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'cases'
  | 'cooling'
  | 'keyboards'
  | 'mice'
  | 'headsets'
  | 'mousepads'
  | 'cables'
  | 'chargers'
  | 'laptop_batteries'
  | 'apple_accessories'
  | 'printers'
  | 'networking'
  | 'gaming_accessories'
  | 'other';

export interface CustomSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  categoryId: string;
  sku: string;
  internalBarcode: string; // Unique Code 128
  manufacturerBarcode?: string;
  barcodeToUse: 'internal' | 'manufacturer';
  price: number; // in EGP
  costPrice?: number;
  image?: string; // base64
  condition: 'new' | 'used' | 'renewed';
  stockTracking: boolean;
  stockQuantity: number;
  minStockAlert?: number;
  warrantyMonths?: number;
  shortDescription?: string;
  notes?: string;
  isSerialized?: boolean;
  serialNumbers?: string[];
  specs: Record<string, string>;
  customSpecs: CustomSpec[];
  isArchived?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  order: number;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  barcode: string;
  serialNumber?: string;
  unitPrice: number;
  quantity: number;
  discount: number; // discount in EGP per unit
  lineTotal: number;
  specsSummary?: string;
  image?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountReceived: number;
  changeToReturn: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  notes?: string;
  status: 'completed' | 'cancelled';
  format: 'thermal80' | 'a4';
  isDemo?: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  logoUrl?: string;
  phone: string;
  address: string;
  commercialReg?: string;
  taxNumber?: string;
  receiptFooter: string;
  defaultReceiptFormat: 'thermal80' | 'a4';
  
  // Barcode Label defaults
  defaultLabelPreset: '40x25' | '50x30' | '60x40' | '70x50' | 'custom';
  customLabelWidthMm: number;
  customLabelHeightMm: number;
  labelShowLogo: boolean;
  labelShowStoreName: boolean;
  labelShowPrice: boolean;
  labelShowSku: boolean;
  labelShowModel: boolean;
  labelShowBarcodeText: boolean;
  labelSheetColumns: number; // 1 for roll, 2-5 for A4 sheet
  
  // Scanner & POS defaults
  scannerAudioFeedback: boolean;
  scannerSuffix: 'Enter' | 'Tab' | 'None';
  cashierDisplayName: string;
  enableDiscounts: boolean;
  defaultStockTracking: boolean;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'sale' | 'cancel_restore' | 'audit';
  quantityChange: number;
  newQuantity: number;
  reason?: string;
  timestamp: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'cashier'
  | 'products'
  | 'labels'
  | 'invoices'
  | 'daily_sales'
  | 'settings';
