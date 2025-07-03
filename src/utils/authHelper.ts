/**
 * Authentication Helper Utilities
 * 
 * This file contains utility functions to help resolve authentication issues
 * and provide better user experience when dealing with access problems.
 */

/**
 * Clear all authentication data from localStorage
 * Use this function if you're experiencing access issues
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('openedClasses');
  
  // Clear any other auth-related data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Reload the page to ensure clean state
  window.location.reload();
};

/**
 * Check if user has valid authentication
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Basic token validation (check if it's a valid JWT format)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }
    
    // Check if user data is valid JSON
    JSON.parse(user);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get user information from localStorage
 */
export const getUserInfo = (): { id: number; email: string; name: string; role: string } | null => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return null;
    }
    
    return JSON.parse(userData);
  } catch (error) {
    return null;
  }
};

/**
 * Check if user has access to a specific class
 */
export const hasClassAccess = (classId: string): boolean => {
  try {
    const openedClasses = JSON.parse(localStorage.getItem('openedClasses') || '[]');
    return openedClasses.includes(classId);
  } catch (error) {
    return false;
  }
};

/**
 * Add class to user's opened classes list
 */
export const addClassAccess = (classId: string): void => {
  try {
    const openedClasses = JSON.parse(localStorage.getItem('openedClasses') || '[]');
    if (!openedClasses.includes(classId)) {
      openedClasses.push(classId);
      localStorage.setItem('openedClasses', JSON.stringify(openedClasses));
    }
  } catch (error) {
    console.error('Error adding class access:', error);
  }
};

/**
 * Remove class from user's opened classes list
 */
export const removeClassAccess = (classId: string): void => {
  try {
    const openedClasses = JSON.parse(localStorage.getItem('openedClasses') || '[]');
    const filteredClasses = openedClasses.filter((id: string) => id !== classId);
    localStorage.setItem('openedClasses', JSON.stringify(filteredClasses));
  } catch (error) {
    console.error('Error removing class access:', error);
  }
};

/**
 * Get all classes the user has accessed
 */
export const getOpenedClasses = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('openedClasses') || '[]');
  } catch (error) {
    return [];
  }
};

/**
 * Reset all class access data
 */
export const resetClassAccess = (): void => {
  localStorage.removeItem('openedClasses');
};

/**
 * Diagnostic function to check authentication state
 */
export const diagnoseAuthIssues = (): {
  hasToken: boolean;
  hasUser: boolean;
  tokenValid: boolean;
  userValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  const hasToken = !!token;
  const hasUser = !!user;
  
  let tokenValid = false;
  let userValid = false;
  
  if (hasToken) {
    try {
      const tokenParts = token!.split('.');
      tokenValid = tokenParts.length === 3;
      if (!tokenValid) {
        issues.push('Token format is invalid');
      }
    } catch (error) {
      issues.push('Token is corrupted');
    }
  } else {
    issues.push('No authentication token found');
  }
  
  if (hasUser) {
    try {
      JSON.parse(user!);
      userValid = true;
    } catch (error) {
      issues.push('User data is corrupted');
    }
  } else {
    issues.push('No user data found');
  }
  
  return {
    hasToken,
    hasUser,
    tokenValid,
    userValid,
    issues
  };
};

/**
 * Show a user-friendly message about authentication issues
 */
export const showAuthIssueMessage = (): void => {
  const diagnosis = diagnoseAuthIssues();
  
  if (diagnosis.issues.length > 0) {
    const message = `Authentication Issues Detected:\n\n${diagnosis.issues.join('\n')}\n\nPlease log out and log back in to resolve these issues.`;
    alert(message);
  }
}; 