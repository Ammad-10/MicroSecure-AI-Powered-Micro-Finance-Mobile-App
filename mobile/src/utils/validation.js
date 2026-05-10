/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        return 'Email is required';
    }
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return null;
};

/**
 * Validate CNIC format (13 digits)
 */
export const validateCNIC = (cnic) => {
    const cnicRegex = /^\d{13}$/;
    if (!cnic) {
        return 'CNIC is required';
    }
    if (!cnicRegex.test(cnic)) {
        return 'CNIC must be exactly 13 digits';
    }
    return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
    if (!password) {
        return 'Password is required';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!/\d/.test(password)) {
        return 'Password must contain at least one digit';
    }
    if (!/[a-zA-Z]/.test(password)) {
        return 'Password must contain at least one letter';
    }
    return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    return null;
};

/**
 * Validate age (must be 18+)
 */
export const validateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
        return 'Date of birth is required';
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        return 'You must be at least 18 years old';
    }

    return null;
};

/**
 * Validate username
 */
export const validateUsername = (username) => {
    if (!username) {
        return 'Username is required';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    if (username.length > 50) {
        return 'Username must be less than 50 characters';
    }
    return null;
};
/**
 * Validate phone number (11 digits)
 */
export const validatePhone = (phone) => {
    const phoneRegex = /^\d{11}$/;
    if (!phone) {
        return 'Phone number is required';
    }
    if (!phoneRegex.test(phone)) {
        return 'Phone number must be exactly 11 digits';
    }
    return null;
};
