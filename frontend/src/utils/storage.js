/**
 * Safe wrapper for localStorage with JSON parsing and fallback error handling
 */
export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.warn(`[storage] Error reading key "${key}":`, error);
      return fallback;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[storage] Error writing key "${key}":`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[storage] Error removing key "${key}":`, error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[storage] Error clearing storage:', error);
    }
  }
};
