import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  fontOptions?: string;
  className?: string;
  lineColor?: string;
  background?: string;
  margin?: number;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 42,
  displayValue = true,
  fontSize = 13,
  fontOptions = '',
  className = '',
  lineColor = '#000000',
  background = 'transparent',
  margin = 4
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: format as any,
        width,
        height,
        displayValue,
        font: 'JetBrains Mono, monospace, sans-serif',
        fontOptions,
        fontSize,
        textMargin: 3,
        lineColor,
        background,
        margin,
        valid: (valid) => {
          if (!valid) {
            setError('قيمة الباركود غير صالحة للترميز');
          } else {
            setError(null);
          }
        }
      });
    } catch (e: any) {
      console.warn('JsBarcode render error:', e);
      setError('تعذر رسم الباركود');
    }
  }, [value, format, width, height, displayValue, fontSize, fontOptions, lineColor, background, margin]);

  if (error) {
    return (
      <div className={`p-2 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded text-center ${className}`}>
        {error} ({value})
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full overflow-visible" />
    </div>
  );
};
