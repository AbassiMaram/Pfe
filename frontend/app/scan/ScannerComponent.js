'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QrReader = dynamic(() => import("react-qr-scanner"), { 
  ssr: false 
});

export default function ScannerComponent() {
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleScan = (data) => {
    if (data) router.push(data);
  };

  const handleError = (err) => {
    console.error(err);
    setError(err.message);
  };

  return (
    <div>
      {error && <p>Erreur: {error}</p>}
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
      />
    </div>
  );
}
