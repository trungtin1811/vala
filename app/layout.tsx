import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { QueryProvider } from '@/context/QueryProvider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Vala - Vãng Lai Cầu Lông',
  description: 'Nền tảng kết nối người yêu thích cầu lông để tìm đối thủ và tổ chức vãng lai.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.className} h-full`}>
      <body className="min-h-full flex flex-col bg-white" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
