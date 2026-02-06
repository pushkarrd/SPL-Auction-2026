import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teams API
export const getAllTeams = async () => {
  const response = await api.get('/api/teams');
  return response.data;
};

export const getTeamDetails = async (teamCode) => {
  const response = await api.get(`/api/teams/${teamCode}`);
  return response.data;
};

// Bids API
export const addBid = async (bidData) => {
  const response = await api.post('/api/bids', bidData);
  return response.data;
};

export const getTeamBids = async (teamCode) => {
  const response = await api.get(`/api/bids/${teamCode}`);
  return response.data;
};

export const deleteBid = async (bidId) => {
  const response = await api.delete(`/api/bids/${bidId}`);
  return response.data;
};

export const updateBid = async (bidId, bidData) => {
  const response = await api.put(`/api/bids/${bidId}`, bidData);
  return response.data;
};

// Stats API
export const getAuctionStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

// Reset API (for testing)
export const resetDatabase = async () => {
  const response = await api.post('/api/reset');
  return response.data;
};

export default api;
