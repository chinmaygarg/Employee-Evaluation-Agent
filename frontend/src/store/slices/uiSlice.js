import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    snackbar: {
      open: false,
      message: '',
      severity: 'info', // 'success', 'error', 'warning', 'info'
    },
    dialog: {
      open: false,
      title: '',
      content: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmAction: null,
    },
    sidebar: {
      open: true,
    },
    loading: {
      global: false,
    },
  },
  reducers: {
    // Snackbar actions
    showSnackbar: (state, action) => {
      state.snackbar.open = true;
      state.snackbar.message = action.payload.message;
      state.snackbar.severity = action.payload.severity || 'info';
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    
    // Dialog actions
    showDialog: (state, action) => {
      state.dialog.open = true;
      state.dialog.title = action.payload.title;
      state.dialog.content = action.payload.content;
      state.dialog.confirmText = action.payload.confirmText || 'Confirm';
      state.dialog.cancelText = action.payload.cancelText || 'Cancel';
      state.dialog.confirmAction = action.payload.confirmAction;
    },
    hideDialog: (state) => {
      state.dialog.open = false;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.open = !state.sidebar.open;
    },
    setSidebarOpen: (state, action) => {
      state.sidebar.open = action.payload;
    },
    
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
  },
});

export const {
  showSnackbar,
  hideSnackbar,
  showDialog,
  hideDialog,
  toggleSidebar,
  setSidebarOpen,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
