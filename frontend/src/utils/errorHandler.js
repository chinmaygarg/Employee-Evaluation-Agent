import { showSnackbar } from '../store/slices/uiSlice';

/**
 * Standard error handler for API calls
 * @param {Error} error - The error object from axios
 * @param {Function} dispatch - Redux dispatch function
 * @param {string} customMessage - Optional custom error message
 * @returns {string} - The error message
 */
export const handleApiError = (error, dispatch, customMessage = null) => {
  let errorMessage = customMessage || 'Something went wrong. Please try again.';
  
  if (error.response) {
    // The request was made and the server responded with an error status
    const { data, status } = error.response;
    
    // Handle specific status codes
    switch (status) {
      case 400:
        errorMessage = data.message || 'Invalid data provided.';
        break;
      case 401:
        errorMessage = 'Session expired. Please login again.';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = data.message || 'Resource not found.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorMessage = data.message || errorMessage;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response from server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request
    errorMessage = error.message || errorMessage;
  }
  
  // Show error message in snackbar
  if (dispatch) {
    dispatch(showSnackbar({
      message: errorMessage,
      severity: 'error',
    }));
  }
  
  // Return the error message for additional handling if needed
  return errorMessage;
};

/**
 * Validate form data before submitting to API
 * @param {Object} data - Form data to validate
 * @param {Array} requiredFields - Array of required field names
 * @param {Function} dispatch - Redux dispatch function
 * @returns {boolean} - Whether validation passed
 */
export const validateFormData = (data, requiredFields, dispatch) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    const errorMessage = `Please provide ${missingFields.join(', ')}.`;
    
    if (dispatch) {
      dispatch(showSnackbar({
        message: errorMessage,
        severity: 'error',
      }));
    }
    
    return false;
  }
  
  return true;
};
