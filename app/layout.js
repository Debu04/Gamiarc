import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import MobileNav from '../components/layout/MobileNav';
import Footer from '../components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-primary',
  display: 'swap',
});

export const metadata = {
  title: 'Gamiarc – Play Free Mini Games Online | Sudoku, Tic-Tac-Toe & More',
  description:
    'Gamiarc is your daily escape into premium browser mini-games. Play Sudoku, Tic-Tac-Toe, Minesweeper and hundreds more for free. No download required. Instant play.',
  keywords: 'mini games, free online games, sudoku, tic tac toe, browser games, play games online',
  robots: 'index, follow',
  metadataBase: new URL('https://cortenity.qlexia.com'),
  openGraph: {
    title: 'Gamiarc – Your Daily Escape into Mini Worlds',
    description:
      'Experience premium glassmorphic gaming with neon aesthetics. Play the most addictive mini-games right from your browser.',
    type: 'website',
    url: 'https://cortenity.qlexia.com/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="text-white font-sans antialiased min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <main className="pb-20 md:pb-0">{children}</main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}
