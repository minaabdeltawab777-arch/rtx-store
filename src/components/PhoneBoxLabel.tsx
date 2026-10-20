import React from 'react';
import { Product, StoreSettings } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { formatEGP } from '../utils/formatters';

export type PhoneBoxTemplateType = 'phone_box' | 'barcode_first' | 'compact' | 'dual_code';

export interface PhoneBoxLabelProps {
  product: Product;
  settings: StoreSettings;
  widthMm: number;
  heightMm: number;
  serialNumber?: string;
  template?: PhoneBoxTemplateType;
  qrMode?: 'online' | 'offline';
  showStoreName?: boolean;
  showPrice?: boolean;
  showSku?: boolean;
  showModel?: boolean;
  showBarcodeText?: boolean;
  showQR?: boolean;
  showSpecs?: boolean;
  showWarranty?: boolean;
  showSerial?: boolean;
  fontSize?: 'compact' | 'standard' | 'large';
  className?: string;
  isPrintVersion?: boolean;
}

export const PhoneBoxLabel: React.FC<PhoneBoxLabelProps> = ({
  product,
  settings,
  widthMm,
  heightMm,
  serialNumber,
  template = (settings.labelTemplate as PhoneBoxTemplateType) || 'phone_box',
  qrMode = settings.qrMode || 'online',
  showStoreName = settings.labelShowStoreName ?? true,
  showPrice = settings.labelShowPrice ?? true,
  showSku = settings.labelShowSku ?? true,
  showModel = settings.labelShowModel ?? true,
  showBarcodeText = settings.labelShowBarcodeText ?? true,
  showQR = settings.labelShowQR ?? false,
  showSpecs = settings.labelShowSpecs ?? true,
  showWarranty = settings.labelShowWarranty ?? true,
  showSerial = settings.labelShowSerial ?? true,
  fontSize = settings.labelFontSize || 'standard',
  className = '',
  isPrintVersion = false
}) => {
  // Extract key hardware specifications from product
  const keySpecs: { label: string; value: string }[] = [];
  const specs = product.specs || {};

  // Standard computer specs
  if (specs.cpu) keySpecs.push({ label: 'CPU', value: specs.cpu });
  if (specs.dedicated_gpu || specs.gpu) keySpecs.push({ label: 'GPU', value: specs.dedicated_gpu || specs.gpu });
  if (specs.apple_chip) keySpecs.push({ label: 'CHIP', value: specs.apple_chip });
  if (specs.ram || specs.unified_memory) keySpecs.push({ label: 'RAM', value: specs.ram || specs.unified_memory });
  if (specs.storage || specs.ssd_capacity) keySpecs.push({ label: 'SSD', value: specs.storage || specs.ssd_capacity });
  if (specs.screen_size || specs.display_size) {
    keySpecs.push({
      label: 'DISP',
      value: `${specs.screen_size || specs.display_size} ${specs.refresh_rate ? specs.refresh_rate : ''}`.trim()
    });
  }

  // Accessories specs
  if (specs.switch_type) keySpecs.push({ label: 'SWITCH', value: specs.switch_type });
  if (specs.sensor || specs.dpi) keySpecs.push({ label: 'DPI', value: specs.dpi || specs.sensor });
  if (specs.connectivity) keySpecs.push({ label: 'CONN', value: specs.connectivity });
  if (specs.wattage) keySpecs.push({ label: 'WATT', value: specs.wattage });
  if (specs.form_factor) keySpecs.push({ label: 'FORM', value: specs.form_factor });

  // Custom specs if space permits
  if (product.customSpecs && product.customSpecs.length > 0) {
    product.customSpecs.forEach(cs => {
      if (keySpecs.length < 5 && cs.key && cs.value) {
        keySpecs.push({ label: cs.key.toUpperCase(), value: cs.value });
      }
    });
  }

  // QR Payload (only if enabled & label dimensions >= 60x40mm)
  let qrPayload = '';
  if (showQR) {
    if (qrMode === 'online') {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rtxstore.eg';
      qrPayload = `${baseUrl}/?p=${encodeURIComponent(product.id)}`;
    } else {
      const topSpecsText = keySpecs.slice(0, 3).map(s => `${s.label}:${s.value}`).join(' | ');
      qrPayload = [
        settings.storeName || 'RTX STORE',
        `منتج: ${product.name}`,
        product.model ? `موديل: ${product.model}` : '',
        `السعر: ${product.price} EGP`,
        `كود: ${product.internalBarcode}`,
        topSpecsText ? `المواصفات: ${topSpecsText}` : '',
        product.warrantyMonths ? `الضمان: ${product.warrantyMonths} شهر` : ''
      ].filter(Boolean).join('\n');
    }
  }

  // Dimension scaling for interactive preview (1mm ≈ 3.78px)
  const scale = 3.78;
  const pixelWidth = widthMm * scale;
  const pixelHeight = heightMm * scale;

  // Adaptive sizing logic
  const isSmall = widthMm <= 45 || heightMm <= 26;
  const isMedium = !isSmall && (widthMm <= 55 || heightMm <= 35);
  const isLarge = widthMm >= 60 && heightMm >= 40;

  // Barcode dimensions calculation based on label physical dimensions
  const barcodeHeight = isSmall ? 18 : isMedium ? 22 : 30;
  const barcodeBarWidth = isSmall ? 1.0 : isMedium ? 1.25 : 1.45;
  const barcodeFontSize = isSmall ? 7.5 : isMedium ? 8.5 : 9.5;

  // Serial number to display
  const activeSerial = serialNumber || (product.isSerialized && product.serialNumbers?.[0] ? product.serialNumbers[0] : undefined);

  // Maximum specs lines to display depending on height
  const maxSpecsToShow = isSmall ? 0 : heightMm <= 30 ? 2 : heightMm <= 40 ? 4 : 6;
  const visibleSpecs = keySpecs.slice(0, maxSpecsToShow);

  // Allow QR only if template is dual_code OR showQR is true AND label is large enough (>= 60x35mm)
  const allowQR = (template === 'dual_code' || showQR) && widthMm >= 58 && heightMm >= 32;

  // Condition badge label
  const conditionLabel =
    product.condition === 'renewed' ? 'REFURB' : product.condition === 'used' ? 'USED' : 'NEW';

  // -------------------------------------------------------------
  // Render Barcode Block (Shared across templates)
  // -------------------------------------------------------------
  const renderBarcodeBlock = () => (
    <div className="w-full flex flex-col items-center justify-center my-0.5 px-0.5">
      <BarcodeRenderer
        value={product.internalBarcode}
        height={barcodeHeight}
        width={barcodeBarWidth}
        fontSize={barcodeFontSize}
        displayValue={showBarcodeText}
        margin={1}
        className="w-full"
      />
      {showSerial && activeSerial && (
        <div className="text-[6pt] font-mono font-black text-black tracking-widest leading-none mt-0.5 uppercase">
          S/N: {activeSerial}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // Render Specs Lines (Phone Box Style)
  // -------------------------------------------------------------
  const renderSpecsBlock = () => {
    if (!showSpecs || visibleSpecs.length === 0) return null;

    return (
      <div
        className="w-full border-t border-black/80 pt-0.5 my-0.5 font-mono text-gray-900 leading-tight"
        style={{ fontSize: isSmall ? '5.5pt' : isMedium ? '6pt' : '7pt' }}
      >
        <div className={`grid ${visibleSpecs.length > 2 && !isSmall ? 'grid-cols-2' : 'grid-cols-1'} gap-x-2 gap-y-0.5`}>
          {visibleSpecs.map((spec, i) => (
            <div key={i} className="flex items-baseline gap-1 truncate text-left">
              <span className="font-black text-black uppercase">{spec.label}:</span>
              <span className="truncate text-gray-800 font-medium">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Render Footer Row (Warranty + Selling Price)
  // -------------------------------------------------------------
  const renderFooterBlock = () => (
    <div className="w-full flex items-center justify-between border-t border-black/80 pt-0.5 mt-auto leading-none">
      <div className="flex items-center gap-1.5 text-[6pt] text-gray-700 font-mono">
        {showWarranty && product.warrantyMonths ? (
          <span className="font-bold">ضمان: {product.warrantyMonths} شهر</span>
        ) : (
          <span className="text-[5.5pt] text-gray-500 font-bold tracking-tight">ORIGINAL HW</span>
        )}
        {showSku && product.sku && (
          <span className="text-[5.5pt] text-gray-600 font-bold">| SKU: {product.sku}</span>
        )}
      </div>

      {showPrice && (
        <div
          className="font-black font-mono text-black text-left tracking-tight shrink-0"
          style={{ fontSize: isSmall ? '7.5pt' : isMedium ? '9.5pt' : '11pt' }}
        >
          {formatEGP(product.price)}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`bg-white text-black font-sans box-border flex flex-col justify-between overflow-hidden text-right border border-slate-300 select-none ${className}`}
      style={
        isPrintVersion
          ? {
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              padding: isSmall ? '1.2mm' : '1.8mm',
              margin: '0',
              boxSizing: 'border-box'
            }
          : {
              width: `${pixelWidth}px`,
              minHeight: `${pixelHeight}px`,
              maxHeight: `${pixelHeight}px`,
              padding: `${Math.max(5, heightMm * 0.2)}px`
            }
      }
    >
      {/* ============================================================== */}
      {/* TEMPLATE A: PHONE BOX CLASSIC (Top Header -> Middle Barcode -> Bottom Specs & Price) */}
      {/* ============================================================== */}
      {template === 'phone_box' && (
        <>
          {/* Top Section: Store Brand + SKU/Condition + Product Name */}
          <div className="w-full border-b border-black/80 pb-0.5 mb-0.5 leading-tight">
            <div className="flex items-center justify-between gap-1">
              {showStoreName && (
                <span
                  className="font-black font-mono text-black uppercase tracking-wider"
                  style={{ fontSize: isSmall ? '6.5pt' : '7.5pt' }}
                >
                  {settings.storeName || 'RTX STORE'}
                </span>
              )}
              <div className="flex items-center gap-1 font-mono text-gray-700 font-bold" style={{ fontSize: '6pt' }}>
                {showSku && !showStoreName && product.sku && <span>SKU: {product.sku}</span>}
                <span className="bg-black text-white px-1 py-0.2 rounded-xs font-mono font-bold text-[5pt] tracking-wider uppercase">
                  {conditionLabel}
                </span>
              </div>
            </div>

            {/* Product Title (Brand + Name) */}
            <div
              className="font-black text-black leading-tight truncate mt-0.5"
              style={{ fontSize: isSmall ? '7pt' : isMedium ? '8.5pt' : '10pt' }}
              title={product.name}
            >
              {product.name}
            </div>

            {/* Brand & Model row */}
            {showModel && (product.brand || product.model) && (
              <div
                className="text-gray-700 font-mono font-bold leading-none truncate mt-0.5"
                style={{ fontSize: isSmall ? '5.5pt' : '6.5pt' }}
              >
                {product.brand && <span className="uppercase">{product.brand}</span>}
                {product.brand && product.model && <span> — </span>}
                {product.model && <span>{product.model}</span>}
              </div>
            )}
          </div>

          {/* Middle Section: Code 128 Barcode with quiet zones */}
          <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
            {renderBarcodeBlock()}
          </div>

          {/* Bottom Section: Phone Box Specs + Warranty + Selling Price */}
          <div className="w-full flex flex-col justify-end">
            {renderSpecsBlock()}
            {renderFooterBlock()}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TEMPLATE B: BARCODE FIRST (Prominent Barcode on Top -> Info & Specs Below) */}
      {/* ============================================================== */}
      {template === 'barcode_first' && (
        <>
          {/* Top Barcode with quiet zones */}
          <div className="w-full border-b border-black/80 pb-0.5 mb-0.5">
            <div className="flex items-center justify-between text-[6pt] font-mono text-gray-600 mb-0.5">
              {showStoreName && <span className="font-bold uppercase">{settings.storeName || 'RTX STORE'}</span>}
              <span className="bg-black text-white px-1 py-0.2 rounded-xs font-bold text-[5pt] uppercase">
                {conditionLabel}
              </span>
            </div>
            {renderBarcodeBlock()}
          </div>

          {/* Product Identification Details */}
          <div className="w-full flex-1 flex flex-col justify-center my-0.5 leading-tight">
            <div
              className="font-black text-black truncate"
              style={{ fontSize: isSmall ? '7pt' : isMedium ? '8.5pt' : '9.5pt' }}
            >
              {product.name}
            </div>
            {showModel && (product.brand || product.model) && (
              <div className="text-[6pt] font-mono text-gray-700 font-bold truncate mt-0.5">
                {product.brand} {product.model && `• ${product.model}`}
              </div>
            )}
            {renderSpecsBlock()}
          </div>

          {/* Bottom Row */}
          <div className="w-full">{renderFooterBlock()}</div>
        </>
      )}

      {/* ============================================================== */}
      {/* TEMPLATE C: COMPACT / ACCESSORIES (Tailored for 40x25mm & small accessories) */}
      {/* ============================================================== */}
      {template === 'compact' && (
        <>
          <div className="w-full border-b border-black/80 pb-0.5 leading-tight flex items-center justify-between">
            <div className="font-black text-black truncate text-[7pt] flex-1">
              {product.name}
            </div>
            {showSku && product.sku && (
              <span className="text-[5.5pt] font-mono font-bold text-gray-600 shrink-0 ml-1">
                {product.sku}
              </span>
            )}
          </div>

          <div className="w-full flex-1 flex items-center justify-center my-0.5">
            {renderBarcodeBlock()}
          </div>

          <div className="w-full border-t border-black/80 pt-0.5 flex items-center justify-between leading-none font-mono">
            <span className="text-[5.5pt] text-gray-600 font-bold truncate">
              {product.brand} {product.model ? `• ${product.model}` : ''}
            </span>
            {showPrice && (
              <span className="font-black text-[8pt] text-black">
                {formatEGP(product.price)}
              </span>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TEMPLATE D: DUAL CODE (Linear Code 128 + Side Mobile QR) */}
      {/* ============================================================== */}
      {template === 'dual_code' && (
        <>
          {/* Header */}
          <div className="w-full border-b border-black/80 pb-0.5 mb-0.5 flex items-center justify-between leading-tight">
            <div>
              <div className="font-black text-black truncate" style={{ fontSize: isSmall ? '7pt' : '9pt' }}>
                {product.name}
              </div>
              <div className="text-[6pt] font-mono text-gray-700 font-bold">
                {product.brand} {product.model && `• ${product.model}`}
              </div>
            </div>
            <div className="text-right">
              {showStoreName && (
                <div className="font-black font-mono text-[7pt] text-black uppercase">
                  {settings.storeName || 'RTX STORE'}
                </div>
              )}
              {showSku && product.sku && (
                <div className="text-[5.5pt] font-mono text-gray-600">SKU: {product.sku}</div>
              )}
            </div>
          </div>

          {/* Middle: Code 128 on left + Complementary QR on right */}
          <div className="w-full flex-1 flex items-center justify-between gap-1.5 my-0.5 overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <BarcodeRenderer
                value={product.internalBarcode}
                height={barcodeHeight}
                width={barcodeBarWidth}
                fontSize={barcodeFontSize}
                displayValue={showBarcodeText}
                margin={1}
                className="w-full"
              />
              {showSerial && activeSerial && (
                <div className="text-[6pt] font-mono font-black text-black tracking-widest leading-none mt-0.5 uppercase">
                  S/N: {activeSerial}
                </div>
              )}
            </div>

            {allowQR && (
              <div className="flex flex-col items-center justify-center shrink-0 pr-1 border-l border-gray-300">
                <QRCodeRenderer
                  value={qrPayload}
                  size={heightMm >= 40 ? 52 : 40}
                  className="border border-black p-0.5 rounded-xs bg-white"
                />
                <span className="text-[4.5pt] font-bold text-gray-600 font-mono mt-0.5 uppercase tracking-tighter">
                  SCAN SPECS
                </span>
              </div>
            )}
          </div>

          {/* Bottom */}
          <div className="w-full flex flex-col justify-end">
            {renderSpecsBlock()}
            {renderFooterBlock()}
          </div>
        </>
      )}
    </div>
  );
};
