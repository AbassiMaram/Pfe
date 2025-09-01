// frontend/app/components/qr/QRScanner.js
import React from 'react';
import { QrScanner } from 'react-qr-scanner';

export default function QRScanner({ onScan }) {
  return (
    <div data-testid="qr-scanner">
      <QrScanner
        onDecode={onScan}
        constraints={{ facingMode: 'environment' }}
      />
    </div>
  );
}