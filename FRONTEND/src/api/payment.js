import apiClient from './apiClient';

export const createPaymentOrder = async (amount) => {
  const response = await apiClient.post('/payment/create-order', { amount });
  return response.data;
};

export const getPaymentsByUser = async (userId) => {
  const response = await apiClient.get(`/payment/user/${userId}`);
  return response.data;
};

export const verifyPaymentSignature = async (paymentData) => {
  const response = await apiClient.post('/payment/verify-payment', paymentData);
  return response.data;
};
