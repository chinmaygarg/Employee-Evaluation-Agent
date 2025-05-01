import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { candidateAPI } from '../../services/api';

// Async thunks
export const getAllCandidates = createAsyncThunk(
  'candidate/getAllCandidates',
  async (params, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getAllCandidates(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get candidates');
    }
  }
);

export const getCandidateById = createAsyncThunk(
  'candidate/getCandidateById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getCandidateById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get candidate');
    }
  }
);

export const searchCandidate = createAsyncThunk(
  'candidate/searchCandidate',
  async (params, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.searchCandidate(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search candidate');
    }
  }
);

export const getCandidateSessions = createAsyncThunk(
  'candidate/getCandidateSessions',
  async (id, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getCandidateSessions(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get candidate sessions');
    }
  }
);

export const updateCandidate = createAsyncThunk(
  'candidate/updateCandidate',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.updateCandidate(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update candidate');
    }
  }
);

export const getCandidateStats = createAsyncThunk(
  'candidate/getCandidateStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getCandidateStats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get candidate stats');
    }
  }
);

// Slice
const candidateSlice = createSlice({
  name: 'candidate',
  initialState: {
    currentCandidate: null,
    candidateSessions: [],
    candidates: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0,
    },
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
      state.candidateSessions = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all candidates
      .addCase(getAllCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload.candidates;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get candidate by ID
      .addCase(getCandidateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCandidateById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCandidate = action.payload;
      })
      .addCase(getCandidateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search candidate
      .addCase(searchCandidate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCandidate.fulfilled, (state, action) => {
        state.loading = false;
        // Just return one candidate, not stored in state
      })
      .addCase(searchCandidate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get candidate sessions
      .addCase(getCandidateSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCandidateSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.candidateSessions = action.payload.sessions;
      })
      .addCase(getCandidateSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update candidate
      .addCase(updateCandidate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCandidate = action.payload;
        
        // Update in the list if present
        const index = state.candidates.findIndex(c => c._id === action.payload._id);
        if (index >= 0) {
          state.candidates[index] = action.payload;
        }
      })
      .addCase(updateCandidate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get candidate stats
      .addCase(getCandidateStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCandidateStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getCandidateStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCandidate, clearError } = candidateSlice.actions;

export default candidateSlice.reducer;
