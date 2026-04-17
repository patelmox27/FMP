import apiClient from './apiClient';

export const getUserNotifications = async (userId) => {
  const response = await apiClient.get(`/user/notifications/${userId}`);
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/user/notifications/${notificationId}/read`);
  return response.data;
};
