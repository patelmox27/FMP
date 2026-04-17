import api from "./axios";

export const login = (data) => api.post("/admin/login", data);
export const getDashboard = () => api.get("/admin/dashboard");
export const getRevenue = (days = 7) => api.get(`/admin/revenue?days=${days}`);
export const getPeakHours = () => api.get("/admin/peak-hours");
export const getOccupancy = () => api.get("/admin/occupancy");
export const getLots = () => api.get("/admin/lots");
export const createLot = (data) => api.post("/admin/lots", data);
export const updateLot = (id, data) => api.put(`/admin/lots/${id}`, data);
export const deleteLot = (id) => api.delete(`/admin/lots/${id}`);
export const getSlots = (lotId) => api.get(`/admin/lots/${lotId}/slots`);
export const addSlot = (lotId, data) => api.post(`/admin/lots/${lotId}/slots`, data);
export const bulkAddSlots = (lotId, data) => api.post(`/admin/lots/${lotId}/slots/bulk`, data);
export const updateSlot = (id, data) => api.put(`/admin/slots/${id}`, data);

export const deleteSlot = (id) => api.delete(`/admin/slots/${id}`);

export const getUsers = () => api.get("/admin/users");
export const getBookings = (limit = 20) =>
  api.get(`/admin/bookings?limit=${limit}`);
export const getNotifications = (limit = 20) =>
  api.get(`/admin/notifications?limit=${limit}`);
export const markNotificationRead = (id) =>
  api.patch(`/admin/notifications/${id}/read`);
export const getAlerts = () => api.get("/admin/alerts");
