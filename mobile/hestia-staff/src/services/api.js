import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://itserpapi.duckdns.org/hestia/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    await SecureStore.setItemAsync('authToken', access_token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
  }
};

// ==================== DASHBOARD ====================

export const dashboardService = {
  async getStats(hotelId) {
    const response = await api.get(`/dashboard/stats?hotel_id=${hotelId}`);
    return response.data;
  },

  async getMobileStaffDashboard(hotelId) {
    const response = await api.get(`/reports/mobile/staff/${hotelId}`);
    return response.data;
  }
};

// ==================== RESERVATIONS ====================

export const reservationService = {
  async getTodayCheckins(hotelId) {
    const response = await api.get(`/check-in-out/checkins/${hotelId}`);
    return response.data;
  },

  async getTodayCheckouts(hotelId) {
    const response = await api.get(`/check-in-out/checkouts/${hotelId}`);
    return response.data;
  },

  async performCheckin(reservationId, roomId) {
    const response = await api.post(`/check-in-out/checkin/${reservationId}`, { room_id: roomId });
    return response.data;
  },

  async performCheckout(reservationId) {
    const response = await api.post(`/check-in-out/checkout/${reservationId}`);
    return response.data;
  }
};

// ==================== ROOMS ====================

export const roomService = {
  async getRooms(hotelId) {
    const response = await api.get(`/rooms/${hotelId}`);
    return response.data;
  },

  async getRoomStatus(roomId) {
    const response = await api.get(`/rooms/status/${roomId}`);
    return response.data;
  },

  async updateRoomStatus(roomId, status) {
    const response = await api.patch(`/rooms/${roomId}/status`, { status });
    return response.data;
  }
};

// ==================== HOUSEKEEPING ====================

export const housekeepingService = {
  async getTasks(hotelId, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/housekeeping/tasks/${hotelId}?${params}`);
    return response.data;
  },

  async getMyTasks(userId, hotelId) {
    const response = await api.get(`/housekeeping/tasks/${hotelId}?assigned_to=${userId}`);
    return response.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await api.patch(`/housekeeping/tasks/${taskId}`, { status });
    return response.data;
  },

  async startTask(taskId) {
    const response = await api.patch(`/housekeeping/tasks/${taskId}`, { status: 'in_progress' });
    return response.data;
  },

  async completeTask(taskId) {
    const response = await api.patch(`/housekeeping/tasks/${taskId}`, { status: 'completed' });
    return response.data;
  }
};

// ==================== GUEST REQUESTS ====================

export const requestService = {
  async getPendingRequests(hotelId) {
    const response = await api.get(`/guest-requests/${hotelId}?status=pending`);
    return response.data;
  },

  async updateRequestStatus(requestId, status) {
    const response = await api.patch(`/guest-requests/${requestId}`, { status });
    return response.data;
  },

  async assignRequest(requestId, userId) {
    const response = await api.patch(`/guest-requests/${requestId}`, { assigned_to: userId });
    return response.data;
  }
};

// ==================== NOTIFICATIONS ====================

export const notificationService = {
  async getNotifications(hotelId) {
    const response = await api.get(`/notifications/${hotelId}`);
    return response.data;
  },

  async markAsRead(hotelId, notificationId) {
    const response = await api.patch(`/notifications/${hotelId}/${notificationId}/read`);
    return response.data;
  },

  async subscribePush(subscription, hotelId) {
    const response = await api.post('/push/subscribe', { ...subscription, hotel_id: hotelId });
    return response.data;
  }
};

// ==================== ORDERS ====================

export const orderService = {
  async getPendingOrders(hotelId) {
    const response = await api.get(`/marketplace/admin/orders/${hotelId}?status=pending`);
    return response.data;
  },

  async updateOrderStatus(orderId, status) {
    const response = await api.patch(`/marketplace/admin/orders/${orderId}`, { status });
    return response.data;
  }
};

export default api;
