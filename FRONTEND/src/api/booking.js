import apiClient from './apiClient';

export const createBooking = async (bookingData) => {
  const response = await apiClient.post('/booking/create', bookingData);
  return response.data;
};

export const getBookingsByUser = async (userId) => {
  const response = await apiClient.get(`/booking/user/${userId}`);
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await apiClient.put(`/booking/cancel/${bookingId}`);
  return response.data;
};

export const updateBooking = async (bookingId, updateData) => {
  const response = await apiClient.patch(`/booking/update/${bookingId}`, updateData);
  return response.data;
};

