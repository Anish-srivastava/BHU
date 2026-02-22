import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const vehicleAPI = {
  getSegments: async () => {
    const response = await api.get('/segments');
    return response.data;
  },

  compareVehicles: async (dailyMileage: number, ownershipYears: number, vehicleSegment: string) => {
    const response = await api.post('/compare', {
      daily_mileage: dailyMileage,
      ownership_years: ownershipYears,
      vehicle_segment: vehicleSegment,
    });
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
