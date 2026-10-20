import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 70,
  className = '',
  color = '#000000',
  backgroundColor = '#ffffff',
  errorCorrectionLevel = 'M'
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setSvgMarkup('');
      return;
    }

    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: color,
        light: backgroundColor
      },
      errorCorrectionLevel
    })
      .then((svg) => {
        setSvgMarkup(svg);
        setError(null);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
        setError('تعذر إنشاء رمز QR');
      });
  }, [value, size, color, backgroundColor, errorCorrectionLevel]);

  if (error) {
    return (
      <div className={`p-1 bg-red-950/30 text-red-400 text-[10px] rounded text-center ${className}`}>
        {error}
      </div>
    );
  }

  if (!svgMarkup) {
    return <div style={{ width: size, height: size }} className={`bg-gray-100 animate-pulse rounded ${className}`} />;
  }

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
