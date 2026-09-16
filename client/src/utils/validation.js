/**
 * HRMS Authentication & Security Input Validation Rules
 */

// Phone number: Exactly 10 digits
export const validatePhone = (phone) => {
  const cleanPhone = (phone || '').toString().trim();
  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required.' };
  }
  if (!/^[0-9]{10}$/.test(cleanPhone)) {
    return { isValid: false, message: 'Phone number must be exactly 10 numeric digits (e.g. 9876543210).' };
  }
  return { isValid: true, message: '' };
};

// Password criteria: Minimum 8 characters, must contain at least 1 uppercase, 1 lowercase, and 1 number
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one numeric digit (0-9).' };
  }
  return { isValid: true, message: '' };
};

// Email validation
export const validateEmail = (email) => {
  const cleanEmail = (email || '').toString().trim();
  if (!cleanEmail) {
    return { isValid: false, message: 'Email address is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true, message: '' };
};
