import apiClient from './apiClient';

export const getAllParkingLots = async () => {
  const response = await apiClient.get('/parking');
  return response.data;
};

export const getParkingLotById = async (id) => {
  const response = await apiClient.get(`/parking/${id}`);
  return response.data;
};

export const getSlotsByParkingLot = async (id) => {
  const response = await apiClient.get(`/parking/slots/${id}`);
  return response.data;
};
