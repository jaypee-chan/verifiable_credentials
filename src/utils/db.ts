import { HolderInfo } from '../types';

const STORAGE_KEY = 'holders_data';

// Initialize storage
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};

// Save holder information
export const saveHolderInfo = async (holderInfo: HolderInfo) => {
  try {
    initializeStorage();
    const holders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newHolder = {
      ...holderInfo,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    holders.push(newHolder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holders));
    return newHolder;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save holder information');
  }
};

// Get all holder records
export const getAllHolders = async () => {
  try {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}; 