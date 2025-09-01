// pages/_app.js
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Gestionnaire global pour les "unhandled rejections"
    const handleUnhandledRejection = (event) => {
      console.warn("Unhandled promise rejection:", event.reason);
      event.preventDefault(); // Empêche l'erreur de remonter à Next.js
    };

    // Gestionnaire global pour les erreurs non capturées
    const handleError = (event) => {
      console.warn("Uncaught error:", event.error);
      event.preventDefault(); // Empêche l'erreur de remonter à Next.js
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}