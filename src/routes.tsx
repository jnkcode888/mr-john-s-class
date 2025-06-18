import { Routes, Route } from 'react-router-dom';
import QuizPage from './pages/QuizPage';
import UnitsPage from './pages/UnitsPage';
import TopicsPage from './pages/TopicsPage';
import AdminPage from './pages/AdminPage';
import AssignmentPage from './pages/AssignmentPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<QuizPage />} />
      <Route path="/units" element={<UnitsPage />} />
      <Route path="/topics/:unitId" element={<TopicsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/assignments" element={<AssignmentPage />} />
    </Routes>
  );
} 