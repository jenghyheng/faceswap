import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import { inter } from '@/lib/fonts';

export const metadata = {
  title: 'FaceSwap App',
  description: 'A simple face swap application',
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
              <Link href="/" className="text-xl font-bold text-blue-600">FaceSwap</Link>
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
