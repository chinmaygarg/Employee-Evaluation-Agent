import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Check if not on login page
      if (window.location.pathname !== '/admin/login') {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Question paper endpoints
export const questionPaperAPI = {
  createQuestionPaper: (data) => api.post('/admin/question-papers', data),
  getAllQuestionPapers: (params) => api.get('/admin/question-papers', { params }),
  getQuestionPaperById: (id) => api.get(`/admin/question-papers/${id}`),
  getQuestionPaperByExamCode: (examCode) => api.get(`/admin/question-papers/code/${examCode}`),
  updateQuestionPaper: (id, data) => api.put(`/admin/question-papers/${id}`, data),
  addQuestionToSection: (id, data) => api.post(`/admin/question-papers/${id}/questions`, data),
  removeQuestion: (id, questionId) => api.delete(`/admin/question-papers/${id}/questions/${questionId}`),
  addSection: (id, data) => api.post(`/admin/question-papers/${id}/sections`, data),
  removeSection: (id, sectionId) => api.delete(`/admin/question-papers/${id}/sections/${sectionId}`),
  regenerateQuestions: (id, sectionId, data) => api.post(`/admin/question-papers/${id}/sections/${sectionId}/regenerate`, data),
};

// Evaluation endpoints
export const evaluationAPI = {
  getAllEvaluations: (params) => api.get('/admin/evaluations', { params }),
  getEvaluationById: (id) => api.get(`/admin/evaluations/${id}`),
  getEvaluationsByExamCode: (examCode) => api.get(`/admin/evaluations/exam/${examCode}`),
  getEvaluationsByCandidate: (candidateId) => api.get(`/admin/evaluations/candidate/${candidateId}`),
  downloadReport: (id) => api.get(`/admin/evaluations/${id}/report`, { responseType: 'blob' }),
  regenerateEvaluation: (id) => api.post(`/admin/evaluations/${id}/regenerate`),
  getEvaluationStats: () => api.get('/admin/evaluations/stats'),
};

// Candidate endpoints
export const candidateAPI = {
  getAllCandidates: (params) => api.get('/admin/candidates', { params }),
  getCandidateById: (id) => api.get(`/admin/candidates/${id}`),
  searchCandidate: (params) => api.get('/admin/candidates/search', { params }),
  getCandidateSessions: (id) => api.get(`/admin/candidates/${id}/sessions`),
  updateCandidate: (id, data) => api.put(`/admin/candidates/${id}`, data),
  getCandidateStats: () => api.get('/admin/candidates/stats'),
};

// Exam endpoints
export const examAPI = {
  validateExamCode: (examCode) => api.get(`/exam/validate/${examCode}`),
  startExam: (data) => api.post('/exam/start', data),
  getExamQuestionPaper: (sessionId) => api.get(`/exam/${sessionId}`),
  saveAnswer: (sessionId, data) => api.post(`/exam/${sessionId}/answer`, data),
  submitExam: (sessionId) => api.post(`/exam/${sessionId}/submit`),
  getUnansweredQuestions: (sessionId) => api.get(`/exam/${sessionId}/unanswered`),
  getSessionStatus: (sessionId) => api.get(`/exam/${sessionId}/status`),
};

export default api;
