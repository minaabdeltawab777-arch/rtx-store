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
  width = 1.4,
  height = 36,
  displayValue = true,
  fontSize = 11,
  fontOptions = 'bold',
  className = '',
  lineColor = '#000000',
  background = 'transparent',
  margin = 2
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, String(value).trim(), {
        format: format as any,
        width,
        height,
        displayValue,
        font: 'JetBrains Mono, monospace, sans-serif',
        fontOptions,
        fontSize,
        textMargin: 2,
        lineColor,
        background,
        margin,
        valid: (valid) => {
          if (!valid) {
            setError('قيمة الباركود غير صالحة');
          } else {
            setError(null);
          }
        }
      });
      // Ensure SVG is cleanly contained and centered
      if (svgRef.current) {
        svgRef.current.style.maxWidth = '100%';
        svgRef.current.style.height = 'auto';
        svgRef.current.style.display = 'block';
        svgRef.current.style.margin = '0 auto';
      }
    } catch (e: any) {
      console.warn('JsBarcode render error:', e);
      setError('تعذر رسم الباركود');
    }
  }, [value, format, width, height, displayValue, fontSize, fontOptions, lineColor, background, margin]);

  if (error) {
    return (
      <div className={`p-1 bg-red-950/40 border border-red-500/30 text-red-400 text-[10px] rounded text-center ${className}`}>
        {error} ({value})
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center w-full overflow-hidden ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto overflow-visible select-none" />
    </div>
  );
};
