import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router } from 'react-router-dom'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChakraProvider>
      <Router>
        {children}
      </Router>
    </ChakraProvider>
  )
} 