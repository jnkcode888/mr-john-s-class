import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';
import AssignmentPage from './pages/AssignmentPage';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/assignments" element={<AssignmentPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App; 