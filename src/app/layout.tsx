import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import { inter } from '@/lib/fonts';

export const metadata = {
  title: 'Devares FaceSwap Card',
  description: 'A simple face swap For Devares card game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <header className="bg-white shadow-sm py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">Tiny Little</Link>
              <nav className="flex items-center space-x-4">
                <Link href="/about" className="text-gray-600 hover:text-blue-600">About</Link>
                <UserMenu />
              </nav>
            </div>
          </header>
          <ToastContainer position="top-right" autoClose={5000} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
