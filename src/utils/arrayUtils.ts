/**
 * Utility functions for safe array handling
 * Prevents "map is not a function" errors
 */

/**
 * Safely checks if a value is an array and has items
 */
export const isArrayWithItems = (value: any): boolean => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * Safely extracts array data from API response
 * Handles different response formats
 */
export const extractArrayFromResponse = (response: any, fallbackKey?: string): any[] => {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) {
    return response;
  }
  
  // If response is an object with data property
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If response is an object with a specific key
  if (fallbackKey && response[fallbackKey] && Array.isArray(response[fallbackKey])) {
    return response[fallbackKey];
  }
  
  // If response is an object, try common array keys
  const commonKeys = ['items', 'results', 'list', 'data', 'content'];
  for (const key of commonKeys) {
    if (response[key] && Array.isArray(response[key])) {
      return response[key];
    }
  }
  
  // If nothing matches, return empty array
  console.warn('Could not extract array from response:', response);
  return [];
};

/**
 * Safely maps over an array with fallback
 */
export const safeMap = <T, R>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => R,
  fallback: R[] = []
): R[] => {
  if (!Array.isArray(array)) {
    return fallback;
  }
  
  try {
    return array.map(mapper);
  } catch (error) {
    console.error('Error in safeMap:', error);
    return fallback;
  }
};

/**
 * Safely filters an array
 */
export const safeFilter = <T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  fallback: T[] = []
): T[] => {
  if (!Array.isArray(array)) {
    return fallback;
  }
  
  try {
    return array.filter(predicate);
  } catch (error) {
    console.error('Error in safeFilter:', error);
    return fallback;
  }
};

/**
 * Safely gets array length
 */
export const safeLength = (array: any): number => {
  return Array.isArray(array) ? array.length : 0;
};

/**
 * Creates a safe render function for arrays
 */
export const createSafeRenderer = <T>(
  array: T[] | null | undefined,
  renderer: (item: T, index: number) => React.ReactNode,
  emptyRenderer?: () => React.ReactNode
) => {
  if (!Array.isArray(array) || array.length === 0) {
    return emptyRenderer ? emptyRenderer() : null;
  }
  
  try {
    return array.map(renderer);
  } catch (error) {
    console.error('Error in safe renderer:', error);
    return emptyRenderer ? emptyRenderer() : null;
  }
}; 