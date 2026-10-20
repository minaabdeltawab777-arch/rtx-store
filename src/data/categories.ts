import { Category } from '../types';

export interface CategorySpecField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'select' | 'number';
  options?: string[];
  helper?: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-laptops', slug: 'laptops', name: 'لابتوبات', icon: 'Laptop', order: 1 },
  { id: 'cat-macbooks', slug: 'macbooks', name: 'MacBook', icon: 'Apple', order: 2 },
  { id: 'cat-desktops', slug: 'desktops', name: 'أجهزة كمبيوتر PC', icon: 'Cpu', order: 3 },
  { id: 'cat-monitors', slug: 'monitors', name: 'شاشات', icon: 'Monitor', order: 4 },
  { id: 'cat-gpus', slug: 'gpus', name: 'كروت شاشة', icon: 'Layers', order: 5 },
  { id: 'cat-cpus', slug: 'cpus', name: 'معالجات', icon: 'Cpu', order: 6 },
  { id: 'cat-motherboards', slug: 'motherboards', name: 'لوحات أم', icon: 'Grid', order: 7 },
  { id: 'cat-ram', slug: 'ram', name: 'رامات', icon: 'Database', order: 8 },
  { id: 'cat-storage', slug: 'storage', name: 'وحدات تخزين SSD & HDD', icon: 'HardDrive', order: 9 },
  { id: 'cat-psu', slug: 'psu', name: 'باور سبلاي', icon: 'Zap', order: 10 },
  { id: 'cat-cases', slug: 'cases', name: 'كيسات', icon: 'Box', order: 11 },
  { id: 'cat-cooling', slug: 'cooling', name: 'أنظمة تبريد', icon: 'Fan', order: 12 },
  { id: 'cat-keyboards', slug: 'keyboards', name: 'كيبورد', icon: 'Keyboard', order: 13 },
  { id: 'cat-mice', slug: 'mice', name: 'ماوس', icon: 'Mouse', order: 14 },
  { id: 'cat-headsets', slug: 'headsets', name: 'سماعات', icon: 'Headphones', order: 15 },
  { id: 'cat-mousepads', slug: 'mousepads', name: 'ماوس باد', icon: 'Square', order: 16 },
  { id: 'cat-cables', slug: 'cables', name: 'كابلات ومحولات', icon: 'Cable', order: 17 },
  { id: 'cat-chargers', slug: 'chargers', name: 'شواحن', icon: 'BatteryCharging', order: 18 },
  { id: 'cat-laptop_batteries', slug: 'laptop_batteries', name: 'بطاريات لابتوب', icon: 'Battery', order: 19 },
  { id: 'cat-apple_accessories', slug: 'apple_accessories', name: 'إكسسوارات Apple', icon: 'Smartphone', order: 20 },
  { id: 'cat-printers', slug: 'printers', name: 'طابعات وماكينات فواتير', icon: 'Printer', order: 21 },
  { id: 'cat-networking', slug: 'networking', name: 'شبكات وراوترات', icon: 'Wifi', order: 22 },
  { id: 'cat-gaming_accessories', slug: 'gaming_accessories', name: 'إكسسوارات Gaming', icon: 'Gamepad2', order: 23 },
  { id: 'cat-other', slug: 'other', name: 'أخرى', icon: 'Package', order: 24 }
];

export const CATEGORY_SPECS_MAP: Record<string, CategorySpecField[]> = {
  // Laptops
  'cat-laptops': [
    { key: 'cpu', label: 'المعالج (CPU)', placeholder: 'مثال: Intel Core i7-13700HX / Ryzen 7 7840HS' },
    { key: 'generation', label: 'الجيل', placeholder: 'مثال: الجيل 13th' },
    { key: 'integrated_gpu', label: 'كارت الشاشة المدمج', placeholder: 'مثال: Intel Iris Xe / AMD Radeon 780M' },
    { key: 'dedicated_gpu', label: 'كارت الشاشة المنفصل (GPU)', placeholder: 'مثال: NVIDIA RTX 4070 Laptop' },
    { key: 'gpu_vram', label: 'ذاكرة كارت الشاشة (VRAM)', placeholder: 'مثال: 8GB GDDR6' },
    { key: 'ram', label: 'الرامات (RAM)', placeholder: 'مثال: 16GB DDR5 5600MHz' },
    { key: 'storage', label: 'التخزين (SSD/HDD)', placeholder: 'مثال: 1TB NVMe M.2 Gen4' },
    { key: 'display_size', label: 'حجم الشاشة', placeholder: 'مثال: 16 بوصة' },
    { key: 'resolution', label: 'دقة الشاشة', placeholder: 'مثال: 2560x1600 (QHD+)' },
    { key: 'refresh_rate', label: 'معدل التحديث', placeholder: 'مثال: 165Hz / 240Hz' },
    { key: 'panel_type', label: 'نوع الشاشة', placeholder: 'مثال: IPS / OLED / Mini-LED' },
    { key: 'os', label: 'نظام التشغيل', placeholder: 'مثال: Windows 11 Home مرخص' },
    { key: 'battery_health', label: 'صحة البطارية (للأجهزة المستعملة)', placeholder: 'مثال: 94% أو ممتاز' },
    { key: 'weight', label: 'الوزن', placeholder: 'مثال: 2.3 كجم' }
  ],

  // MacBooks
  'cat-macbooks': [
    { key: 'mac_model', label: 'طراز الجهاز', placeholder: 'مثال: MacBook Pro 16 / MacBook Air 15' },
    { key: 'release_year', label: 'سنة الإصدار', placeholder: 'مثال: 2023 / 2024' },
    { key: 'apple_chip', label: 'شريحة المعالج (Apple Silicon)', placeholder: 'مثال: Apple M3 Pro (12-Core CPU / 18-Core GPU)' },
    { key: 'unified_memory', label: 'الذاكرة الموحدة (RAM)', placeholder: 'مثال: 18GB / 36GB' },
    { key: 'ssd_capacity', label: 'سعة التخزين (SSD)', placeholder: 'مثال: 512GB / 1TB' },
    { key: 'screen_size', label: 'حجم الشاشة ودقتها', placeholder: 'مثال: 16.2 Liquid Retina XDR 120Hz ProMotion' },
    { key: 'battery_cycles', label: 'عدد دورات وصحة البطارية', placeholder: 'مثال: 45 دورة (صحة 98%)' },
    { key: 'color', label: 'اللون', placeholder: 'مثال: Space Black / Silver / Midnight' }
  ],

  // Desktop PCs
  'cat-desktops': [
    { key: 'cpu', label: 'المعالج (CPU)', placeholder: 'مثال: Intel Core i9-14900K' },
    { key: 'gpu', label: 'كارت الشاشة (GPU)', placeholder: 'مثال: GeForce RTX 4080 Super 16GB' },
    { key: 'motherboard', label: 'اللوحة الأم (Motherboard)', placeholder: 'مثال: ASUS ROG Strix Z790-E WiFi' },
    { key: 'ram', label: 'الرامات (RAM)', placeholder: 'مثال: 32GB (2x16) Corsair DDR5 6000MHz RGB' },
    { key: 'storage', label: 'التخزين', placeholder: 'مثال: 2TB Samsung 990 Pro NVMe' },
    { key: 'psu', label: 'الباور سبلاي (Power Supply)', placeholder: 'مثال: Corsair RM850x 850W Gold Fully Modular' },
    { key: 'case', label: 'الكيسة (PC Case)', placeholder: 'مثال: Lian Li O11 Dynamic EVO Black' },
    { key: 'cooling', label: 'التبريد (Cooling)', placeholder: 'مثال: NZXT Kraken 360 RGB AIO Liquid' },
    { key: 'os', label: 'نظام التشغيل', placeholder: 'مثال: Windows 11 Pro' }
  ],

  // Monitors
  'cat-monitors': [
    { key: 'screen_size', label: 'حجم الشاشة', placeholder: 'مثال: 27 بوصة / 34 بوصة Ultrawide' },
    { key: 'resolution', label: 'الدقة', placeholder: 'مثال: 2K QHD (2560x1440) / 4K UHD' },
    { key: 'panel_tech', label: 'نوع اللوحة', placeholder: 'مثال: Fast IPS / QD-OLED / VA' },
    { key: 'refresh_rate', label: 'معدل التحديث', placeholder: 'مثال: 180Hz / 240Hz / 360Hz' },
    { key: 'response_time', label: 'زمن الاستجابة', placeholder: 'مثال: 0.03ms / 1ms GtG' },
    { key: 'curve', label: 'الانحناء', placeholder: 'مثال: مسطحة Flat / منحنية 1500R' },
    { key: 'connectivity', label: 'المنافذ', placeholder: 'مثال: 2x HDMI 2.1, 1x DP 1.4, USB Hub' }
  ],

  // GPUs
  'cat-gpus': [
    { key: 'chipset', label: 'الشريحة', placeholder: 'مثال: NVIDIA GeForce RTX 4070 Ti SUPER' },
    { key: 'vram', label: 'سعة الذاكرة', placeholder: 'مثال: 16GB GDDR6X' },
    { key: 'bus_width', label: 'عرض النطاق', placeholder: 'مثال: 256-bit' },
    { key: 'boost_clock', label: 'التردد', placeholder: 'مثال: 2655 MHz' },
    { key: 'power_connector', label: 'منافذ الطاقة الموصى بها', placeholder: 'مثال: 16-Pin (12VHPWR) / 750W PSU' }
  ],

  // Keyboards & Mice & Accessories
  'cat-keyboards': [
    { key: 'switch_type', label: 'نوع السويتش', placeholder: 'مثال: Cherry MX Red / Gateron Optical Yellow' },
    { key: 'connectivity', label: 'طريقة الاتصال', placeholder: 'مثال: لاسلكي 2.4GHz + بلوتوث + سلكي Type-C' },
    { key: 'layout', label: 'الحجم والتصميم', placeholder: 'مثال: 75% TKL عربي/إنجليزي' },
    { key: 'rgb', label: 'الإضاءة', placeholder: 'مثال: RGB لكل زر قابل للتخصيص' }
  ],

  'cat-mice': [
    { key: 'sensor', label: 'الحساس (Sensor)', placeholder: 'مثال: Focus Pro 30K Optical' },
    { key: 'dpi', label: 'أقصى DPI', placeholder: 'مثال: 30,000 DPI' },
    { key: 'weight', label: 'الوزن', placeholder: 'مثال: 63 جرام' },
    { key: 'connectivity', label: 'الاتصال', placeholder: 'مثال: Razer HyperSpeed Wireless / سلكي' }
  ]
};
