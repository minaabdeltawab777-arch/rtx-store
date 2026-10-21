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
  cashierId?: string;
  notes?: string;
  status: 'completed' | 'cancelled';
  cancelledAt?: string;
  cancelledBy?: InvoiceCancelledBy;
  cancelReason?: string;
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
  
  // Barcode & QR Label defaults
  defaultLabelPreset: '40x25' | '50x30' | '60x40' | '70x50' | 'custom';
  customLabelWidthMm: number;
  customLabelHeightMm: number;
  labelTemplate: 'phone_box' | 'barcode_first' | 'dual_code' | 'compact';
  qrMode: 'online' | 'offline';
  labelShowLogo: boolean;
  labelShowStoreName: boolean;
  labelShowPrice: boolean;
  labelShowSku: boolean;
  labelShowModel: boolean;
  labelShowBarcodeText: boolean;
  labelShowQR: boolean;
  labelShowSpecs: boolean;
  labelShowWarranty: boolean;
  labelShowSerial: boolean;
  labelFontSize: 'compact' | 'standard' | 'large';
  labelSheetColumns: number; // 1 for roll, 2-5 for A4 sheet
  
  // Scanner & POS defaults
  scannerAudioFeedback: boolean;
  scannerSuffix: 'Enter' | 'Tab' | 'None';
  cashierDisplayName: string;
  enableDiscounts: boolean;
  defaultStockTracking: boolean;
}

export type UserRole = 'owner' | 'admin' | 'cashier';

export interface UserPermissions {
  canDiscount: boolean;
  canViewReports: boolean;
  canManageProducts: boolean;
  canCancelInvoices: boolean;
  canPrintLabels: boolean;
  canManageUsers: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  permissions: UserPermissions;
  lastLoginAt?: string;
  createdAt: string;
}

export interface InvoiceCancelledBy {
  userId: string;
  displayName: string;
  role: string;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSync: boolean;
  sessionTimeoutHours: number;
}

export interface CloudSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingChangesCount: number;
  errorMessage: string | null;
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
  | 'users'
  | 'settings';
