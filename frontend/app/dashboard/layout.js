
import Footer from "@/components/Footer";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
     
      <main className="flex-grow p-6 bg-gray-100">{children}</main>
      <Footer />
    </div>
  );
}
