import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from './store/slices/authSlice';

// Layout components
import AdminLayout from './components/layouts/AdminLayout';
import ExamLayout from './components/layouts/ExamLayout';

// Admin pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import QuestionPapersPage from './pages/admin/QuestionPapersPage';
import CreateQuestionPaperPage from './pages/admin/CreateQuestionPaperPage';
import EditQuestionPaperPage from './pages/admin/EditQuestionPaperPage';
import EvaluationsPage from './pages/admin/EvaluationsPage';
import EvaluationDetailPage from './pages/admin/EvaluationDetailPage';
import CandidatesPage from './pages/admin/CandidatesPage';
import CandidateDetailPage from './pages/admin/CandidateDetailPage';

// Exam pages
import ExamEntryPage from './pages/exam/ExamEntryPage';
import CandidateRegistrationPage from './pages/exam/CandidateRegistrationPage';
import ExamInstructionsPage from './pages/exam/ExamInstructionsPage';
import ExamPage from './pages/exam/ExamPage';
import ExamCompletionPage from './pages/exam/ExamCompletionPage';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Check if user is authenticated on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);
  
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="question-papers" element={<QuestionPapersPage />} />
        <Route path="question-papers/create" element={<CreateQuestionPaperPage />} />
        <Route path="question-papers/edit/:id" element={<EditQuestionPaperPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="evaluations/:id" element={<EvaluationDetailPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
      </Route>
      
      {/* Exam Routes */}
      <Route path="/" element={<ExamLayout />}>
        <Route index element={<ExamEntryPage />} />
        <Route path="register/:examCode" element={<CandidateRegistrationPage />} />
        <Route path="instructions/:sessionId" element={<ExamInstructionsPage />} />
        <Route path="exam/:sessionId" element={<ExamPage />} />
        <Route path="completion/:sessionId" element={<ExamCompletionPage />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
