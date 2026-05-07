import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <nav className="p-4 border-b flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/orders">Pedidos</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}
