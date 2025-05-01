import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { questionPaperAPI } from '../../services/api';

// Async thunks
export const createQuestionPaper = createAsyncThunk(
  'questionPaper/createQuestionPaper',
  async (paperData, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.createQuestionPaper(paperData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create question paper');
    }
  }
);

export const getAllQuestionPapers = createAsyncThunk(
  'questionPaper/getAllQuestionPapers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.getAllQuestionPapers(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get question papers');
    }
  }
);

export const getQuestionPaperById = createAsyncThunk(
  'questionPaper/getQuestionPaperById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.getQuestionPaperById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get question paper');
    }
  }
);

export const updateQuestionPaper = createAsyncThunk(
  'questionPaper/updateQuestionPaper',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.updateQuestionPaper(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update question paper');
    }
  }
);

export const addQuestionToSection = createAsyncThunk(
  'questionPaper/addQuestionToSection',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.addQuestionToSection(id, data);
      return { ...response.data.data, question: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add question');
    }
  }
);

export const removeQuestion = createAsyncThunk(
  'questionPaper/removeQuestion',
  async ({ id, questionId }, { rejectWithValue }) => {
    try {
      await questionPaperAPI.removeQuestion(id, questionId);
      return { id, questionId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove question');
    }
  }
);

export const addSection = createAsyncThunk(
  'questionPaper/addSection',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.addSection(id, data);
      return { ...response.data.data, section: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add section');
    }
  }
);

export const removeSection = createAsyncThunk(
  'questionPaper/removeSection',
  async ({ id, sectionId }, { rejectWithValue }) => {
    try {
      await questionPaperAPI.removeSection(id, sectionId);
      return { id, sectionId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove section');
    }
  }
);

export const regenerateQuestions = createAsyncThunk(
  'questionPaper/regenerateQuestions',
  async ({ id, sectionId, data }, { rejectWithValue }) => {
    try {
      const response = await questionPaperAPI.regenerateQuestions(id, sectionId, data);
      return { ...response.data.data, sectionId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to regenerate questions');
    }
  }
);

// Slice
const questionPaperSlice = createSlice({
  name: 'questionPaper',
  initialState: {
    currentPaper: null,
    papers: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0,
    },
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearCurrentPaper: (state) => {
      state.currentPaper = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create question paper
      .addCase(createQuestionPaper.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createQuestionPaper.fulfilled, (state, action) => {
        state.submitting = false;
        // Don't update papers array as we're redirecting to list page
      })
      .addCase(createQuestionPaper.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Get all question papers
      .addCase(getAllQuestionPapers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQuestionPapers.fulfilled, (state, action) => {
        state.loading = false;
        state.papers = action.payload.questionPapers;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllQuestionPapers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get question paper by ID
      .addCase(getQuestionPaperById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestionPaperById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPaper = action.payload;
      })
      .addCase(getQuestionPaperById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update question paper
      .addCase(updateQuestionPaper.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateQuestionPaper.fulfilled, (state, action) => {
        state.submitting = false;
        if (state.currentPaper) {
          state.currentPaper = {
            ...state.currentPaper,
            ...action.payload,
          };
        }
      })
      .addCase(updateQuestionPaper.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Add question to section
      .addCase(addQuestionToSection.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addQuestionToSection.fulfilled, (state, action) => {
        state.submitting = false;
        // Update the current paper
        if (state.currentPaper) {
          const { sectionId, questionId } = action.payload;
          const sectionIndex = state.currentPaper.sections.findIndex(
            s => s._id === sectionId
          );
          
          if (sectionIndex >= 0) {
            // Create a new question object
            const newQuestion = {
              _id: questionId,
              ...action.payload.question,
            };
            
            // Add to the section
            state.currentPaper.sections[sectionIndex].questions.push(newQuestion);
          }
        }
      })
      .addCase(addQuestionToSection.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Remove question
      .addCase(removeQuestion.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeQuestion.fulfilled, (state, action) => {
        state.submitting = false;
        // Update the current paper
        if (state.currentPaper) {
          const { questionId } = action.payload;
          
          // Find the section containing the question
          state.currentPaper.sections.forEach(section => {
            const questionIndex = section.questions.findIndex(
              q => q._id === questionId
            );
            
            if (questionIndex >= 0) {
              // Remove the question
              section.questions.splice(questionIndex, 1);
            }
          });
        }
      })
      .addCase(removeQuestion.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Add section
      .addCase(addSection.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addSection.fulfilled, (state, action) => {
        state.submitting = false;
        // Update the current paper
        if (state.currentPaper) {
          const { sectionId } = action.payload;
          const newSection = {
            _id: sectionId,
            ...action.payload.section,
            questions: [],
          };
          
          state.currentPaper.sections.push(newSection);
        }
      })
      .addCase(addSection.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Remove section
      .addCase(removeSection.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeSection.fulfilled, (state, action) => {
        state.submitting = false;
        // Update the current paper
        if (state.currentPaper) {
          const { sectionId } = action.payload;
          const sectionIndex = state.currentPaper.sections.findIndex(
            s => s._id === sectionId
          );
          
          if (sectionIndex >= 0) {
            state.currentPaper.sections.splice(sectionIndex, 1);
          }
        }
      })
      .addCase(removeSection.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Regenerate questions
      .addCase(regenerateQuestions.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(regenerateQuestions.fulfilled, (state, action) => {
        state.submitting = false;
        // Reload the question paper to get the updated questions
      })
      .addCase(regenerateQuestions.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentPaper, clearError } = questionPaperSlice.actions;

export default questionPaperSlice.reducer;
