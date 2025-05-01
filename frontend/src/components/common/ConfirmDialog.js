import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { hideDialog } from '../../store/slices/uiSlice';

const ConfirmDialog = () => {
  const dispatch = useDispatch();
  const { open, title, content, confirmText, cancelText, confirmAction } = useSelector(
    (state) => state.ui.dialog
  );

  const handleClose = () => {
    dispatch(hideDialog());
  };

  const handleConfirm = () => {
    if (confirmAction) {
      dispatch(confirmAction());
    }
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{cancelText}</Button>
        <Button onClick={handleConfirm} autoFocus variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
