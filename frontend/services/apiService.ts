// API service for handling all API calls
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GameData {
  id: number;
  title: string;
  openTime: string;
  closeTime: string;
  status: string;
  color: string;
  bgColor: string;
}

interface UserData {
  id: string;
  username: string;
  phone: string;
  wallet: number;
  winnings: number;
}

interface BetData {
  id: number;
  number: string | number;
  amount: number;
  type: string;
  game: string;
  timestamp: Date;
}

// API Service for all HTTP requests
export const apiService = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://931f94c7-97e4-4090-b863-b4c79e93dcd2-00-2evcizu71q6al.picard.replit.dev',

  // GET request
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${apiService.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  // POST request
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${apiService.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  // PUT request
  put: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${apiService.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${apiService.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
};

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  // Implementation depends on your auth system
  // For now, return empty string
  return '';
};

export type { GameData, UserData, BetData, ApiResponse };