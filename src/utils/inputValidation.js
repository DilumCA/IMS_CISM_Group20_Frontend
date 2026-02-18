import DOMPurify from 'dompurify';

export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateName = (name) =>
  /^[a-zA-Z\s'-]{2,50}$/.test(name);

export const validateRole = (role) =>
  /^[a-zA-Z0-9_-]{2,30}$/.test(role);

export const validateDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date);

export const validateNumber = (num) =>
  /^\d+$/.test(num);

export const sanitizeInput = (input) => DOMPurify.sanitize(input);
