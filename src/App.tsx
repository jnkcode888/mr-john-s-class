import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';
<<<<<<< HEAD
import AssignmentPage from './pages/AssignmentPage';
=======
>>>>>>> 9b903dab9d848f902c85131f7a453ff3927f1fc8

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/admin" element={<AdminPage />} />
<<<<<<< HEAD
          <Route path="/assignments" element={<AssignmentPage />} />
=======
>>>>>>> 9b903dab9d848f902c85131f7a453ff3927f1fc8
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App; 