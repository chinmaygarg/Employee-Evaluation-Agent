import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import questionPaperReducer from './slices/questionPaperSlice';
import examReducer from './slices/examSlice';
import evaluationReducer from './slices/evaluationSlice';
import candidateReducer from './slices/candidateSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    questionPaper: questionPaperReducer,
    exam: examReducer,
    evaluation: evaluationReducer,
    candidate: candidateReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
