import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App; 