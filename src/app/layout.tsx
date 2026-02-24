import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "30different",
  description: "Track 30+ different fruit and veg each week",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "12px 24px",
          }}
        >
          <nav style={{ maxWidth: 720, margin: "0 auto" }}>
            <Link href="/">30different</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
