import './globals.css'

export const metadata = {
  title: 'Advanced Image Converter',
  description: 'Convert, compress, and resize with ease.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
      </head>
      <body>{children}</body>
    </html>
  )
