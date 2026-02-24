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
        <header className="topbar">
          <nav className="topbar-inner">
            <Link href="/" className="brand-link">
              <span className="brand-pill" />
              30different
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
