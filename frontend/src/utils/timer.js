import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../store/slices/uiSlice';
import { updateRemainingTime } from '../store/slices/examSlice';

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  return hours > 0 
    ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    : `${formattedMinutes}:${formattedSeconds}`;
};

export const useExamTimer = (initialSeconds, onExpire) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const dispatch = useDispatch();
  
  // Use a ref to store the callback so it doesn't trigger useEffect
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  
  // Notification time in seconds
  const notificationTime = parseInt(process.env.REACT_APP_NOTIFICATION_TIME) / 1000 || 300; // Default to 5 minutes
  const hasNotified = useRef(false);
  
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const resumeTimer = useCallback(() => {
    setIsRunning(true);
  }, []);
  
  const resetTimer = useCallback((newSeconds) => {
    setSecondsRemaining(newSeconds || initialSeconds);
    hasNotified.current = false;
    setIsRunning(true);
  }, [initialSeconds]);
  
  useEffect(() => {
    if (!isRunning) return;
    
    // Update the Redux store with the current time
    dispatch(updateRemainingTime(secondsRemaining));
    
    // Notify when 5 minutes remaining
    if (secondsRemaining === notificationTime && !hasNotified.current) {
      dispatch(showSnackbar({
        message: '5 minutes remaining for the exam!',
        severity: 'warning',
      }));
      hasNotified.current = true;
    }
    
    // Check if timer has expired
    if (secondsRemaining <= 0) {
      if (onExpireRef.current) {
        onExpireRef.current();
      }
      return;
    }
    
    // Decrement timer
    const timerId = setTimeout(() => {
      setSecondsRemaining(seconds => Math.max(0, seconds - 1));
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [isRunning, secondsRemaining, dispatch, notificationTime]);
  
  return {
    secondsRemaining,
    formattedTime: formatTime(secondsRemaining),
    isRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
};
