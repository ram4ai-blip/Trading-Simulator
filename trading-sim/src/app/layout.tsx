import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Market Mayhem — Trading Simulation',
  description: 'Live stock trading simulation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
