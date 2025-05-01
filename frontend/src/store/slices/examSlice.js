import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examAPI } from '../../services/api';

// Async thunks
export const validateExamCode = createAsyncThunk(
  'exam/validateExamCode',
  async (examCode, { rejectWithValue }) => {
    try {
      const response = await examAPI.validateExamCode(examCode);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid exam code');
    }
  }
);

export const startExam = createAsyncThunk(
  'exam/startExam',
  async (candidateData, { rejectWithValue }) => {
    try {
      const response = await examAPI.startExam(candidateData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start exam');
    }
  }
);

export const getExamQuestionPaper = createAsyncThunk(
  'exam/getExamQuestionPaper',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await examAPI.getExamQuestionPaper(sessionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load question paper');
    }
  }
);

export const saveAnswer = createAsyncThunk(
  'exam/saveAnswer',
  async ({ sessionId, answerData }, { rejectWithValue }) => {
    try {
      const response = await examAPI.saveAnswer(sessionId, answerData);
      return { ...answerData, savedAt: new Date() };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save answer');
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await examAPI.submitExam(sessionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit exam');
    }
  }
);

export const getUnansweredQuestions = createAsyncThunk(
  'exam/getUnansweredQuestions',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await examAPI.getUnansweredQuestions(sessionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get unanswered questions');
    }
  }
);

export const getSessionStatus = createAsyncThunk(
  'exam/getSessionStatus',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await examAPI.getSessionStatus(sessionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get session status');
    }
  }
);

// Slice
const examSlice = createSlice({
  name: 'exam',
  initialState: {
    // Exam validation
    examInfo: null,
    
    // Exam session
    sessionId: null,
    sessionStatus: null,
    examCode: null,
    candidateId: null,
    startTime: null,
    endTime: null,
    remainingTime: 0,
    isSubmitted: false,
    
    // Question paper
    questionPaper: null,
    currentSection: 0,
    currentQuestion: 0,
    answers: [],
    
    // Unanswered questions
    unanswered: [],
    
    // Loading and error states
    loading: false,
    savingAnswer: false,
    error: null,
  },
  reducers: {
    clearExamState: (state) => {
      state.examInfo = null;
      state.sessionId = null;
      state.sessionStatus = null;
      state.questionPaper = null;
      state.answers = [];
      state.unanswered = [];
      state.isSubmitted = false;
    },
    setCurrentSection: (state, action) => {
      state.currentSection = action.payload;
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    updateRemainingTime: (state, action) => {
      state.remainingTime = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Validate exam code
      .addCase(validateExamCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateExamCode.fulfilled, (state, action) => {
        state.loading = false;
        state.examInfo = action.payload;
        state.examCode = action.payload.examCode;
      })
      .addCase(validateExamCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Start exam
      .addCase(startExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startExam.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.sessionId;
        state.candidateId = action.payload.candidateId;
        state.startTime = action.payload.startTime;
        state.endTime = action.payload.endTime;
        state.sessionStatus = 'in-progress';
      })
      .addCase(startExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get question paper
      .addCase(getExamQuestionPaper.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExamQuestionPaper.fulfilled, (state, action) => {
        state.loading = false;
        state.questionPaper = action.payload;
        state.answers = action.payload.answers || [];
        state.remainingTime = action.payload.remainingTime;
      })
      .addCase(getExamQuestionPaper.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save answer
      .addCase(saveAnswer.pending, (state) => {
        state.savingAnswer = true;
      })
      .addCase(saveAnswer.fulfilled, (state, action) => {
        state.savingAnswer = false;
        // Update or add answer
        const existingIndex = state.answers.findIndex(
          a => a.questionId === action.payload.questionId
        );
        
        if (existingIndex >= 0) {
          state.answers[existingIndex] = action.payload;
        } else {
          state.answers.push(action.payload);
        }
      })
      .addCase(saveAnswer.rejected, (state, action) => {
        state.savingAnswer = false;
        state.error = action.payload;
      })
      
      // Submit exam
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.isSubmitted = true;
        state.sessionStatus = 'completed';
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get unanswered questions
      .addCase(getUnansweredQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUnansweredQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.unanswered = action.payload.unanswered;
      })
      .addCase(getUnansweredQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get session status
      .addCase(getSessionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSessionStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionStatus = action.payload.status;
        state.remainingTime = action.payload.remainingTime;
        state.isSubmitted = action.payload.status === 'completed' || action.payload.status === 'evaluated';
      })
      .addCase(getSessionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearExamState,
  setCurrentSection,
  setCurrentQuestion,
  updateRemainingTime,
  clearError,
} = examSlice.actions;

export default examSlice.reducer;
