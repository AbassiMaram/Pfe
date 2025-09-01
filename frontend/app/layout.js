import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // ✅ Vérifie le chemin
import { CartProvider } from "@/context/CartContext";
export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body>
                <AuthProvider> {/* ✅ Vérifie que `AuthProvider` est bien autour de `children` */}
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
