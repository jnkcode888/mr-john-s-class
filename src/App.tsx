import { ChakraProvider, Box, Text, VStack } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import AppRoutes from './routes';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box p={4} color="red.500">
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">Something went wrong:</Text>
        <Text>{error.message}</Text>
      </VStack>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ChakraProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App; 