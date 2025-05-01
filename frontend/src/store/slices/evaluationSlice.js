import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { evaluationAPI } from '../../services/api';

// Async thunks
export const getAllEvaluations = createAsyncThunk(
  'evaluation/getAllEvaluations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.getAllEvaluations(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get evaluations');
    }
  }
);

export const getEvaluationById = createAsyncThunk(
  'evaluation/getEvaluationById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.getEvaluationById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get evaluation');
    }
  }
);

export const getEvaluationsByExamCode = createAsyncThunk(
  'evaluation/getEvaluationsByExamCode',
  async (examCode, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.getEvaluationsByExamCode(examCode);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get evaluations');
    }
  }
);

export const getEvaluationsByCandidate = createAsyncThunk(
  'evaluation/getEvaluationsByCandidate',
  async (candidateId, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.getEvaluationsByCandidate(candidateId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get evaluations');
    }
  }
);

export const downloadReport = createAsyncThunk(
  'evaluation/downloadReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.downloadReport(id);
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create an object URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element and trigger a download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { id, success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download report');
    }
  }
);

export const regenerateEvaluation = createAsyncThunk(
  'evaluation/regenerateEvaluation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.regenerateEvaluation(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to regenerate evaluation');
    }
  }
);

export const getEvaluationStats = createAsyncThunk(
  'evaluation/getEvaluationStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await evaluationAPI.getEvaluationStats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get evaluation stats');
    }
  }
);

// Slice
const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState: {
    currentEvaluation: null,
    evaluations: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0,
    },
    stats: null,
    loading: false,
    downloading: false,
    error: null,
  },
  reducers: {
    clearCurrentEvaluation: (state) => {
      state.currentEvaluation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all evaluations
      .addCase(getAllEvaluations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEvaluations.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluations = action.payload.evaluations;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllEvaluations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get evaluation by ID
      .addCase(getEvaluationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvaluationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvaluation = action.payload;
      })
      .addCase(getEvaluationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get evaluations by exam code
      .addCase(getEvaluationsByExamCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvaluationsByExamCode.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluations = action.payload.evaluations;
      })
      .addCase(getEvaluationsByExamCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get evaluations by candidate
      .addCase(getEvaluationsByCandidate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvaluationsByCandidate.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluations = action.payload.evaluations;
      })
      .addCase(getEvaluationsByCandidate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Download report
      .addCase(downloadReport.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadReport.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload;
      })
      
      // Regenerate evaluation
      .addCase(regenerateEvaluation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(regenerateEvaluation.fulfilled, (state) => {
        state.loading = false;
        state.currentEvaluation = null; // Clear to force reload
      })
      .addCase(regenerateEvaluation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get evaluation stats
      .addCase(getEvaluationStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvaluationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getEvaluationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentEvaluation, clearError } = evaluationSlice.actions;

export default evaluationSlice.reducer;
