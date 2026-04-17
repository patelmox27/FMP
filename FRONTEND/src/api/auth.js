import apiClient from './apiClient';

export const login = async (email, password) => {
  const response = await apiClient.post('/user/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post('/user/register', userData);
  return response.data;
};

// Add other user APIs here
export const getUserProfile = async (id) => {
  const response = await apiClient.get(`/user/${id}`);
  return response.data;
};
