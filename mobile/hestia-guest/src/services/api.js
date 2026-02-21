import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://guest-app-preview.preview.emergentagent.com/api';

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
  async loginWithCode(reservationCode) {
    const response = await api.post('/guest-portal/access', { code: reservationCode });
    return response.data;
  },

  async getGuestInfo(guestId) {
    const response = await api.get(`/guest-portal/info/${guestId}`);
    return response.data;
  },

  async logout() {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('guestData');
    await SecureStore.deleteItemAsync('reservationData');
  }
};

// ==================== RESERVATIONS ====================

export const reservationService = {
  async getReservation(reservationId) {
    const response = await api.get(`/reservations/${reservationId}`);
    return response.data;
  },

  async getGuestReservations(guestId) {
    const response = await api.get(`/guest-portal/reservations/${guestId}`);
    return response.data;
  },

  async createBooking(bookingData) {
    const response = await api.post('/guest-portal/booking', bookingData);
    return response.data;
  }
};

// ==================== SERVICES ====================

export const servicesService = {
  async getAvailableServices(hotelId) {
    const response = await api.get(`/guest-portal/services/${hotelId}`);
    return response.data;
  },

  async requestService(serviceData) {
    const response = await api.post('/guest-portal/service-request', serviceData);
    return response.data;
  },

  async getServiceRequests(guestId) {
    const response = await api.get(`/guest-portal/requests/${guestId}`);
    return response.data;
  }
};

// ==================== MARKETPLACE ====================

export const marketplaceService = {
  async getProducts(hotelId) {
    const response = await api.get(`/marketplace/products`, { params: { hotel_id: hotelId } });
    return response.data;
  },

  async getCategories() {
    const response = await api.get(`/marketplace/categories`);
    return response.data;
  },

  async createOrder(orderData) {
    const response = await api.post('/marketplace/orders', orderData);
    return response.data;
  },

  async getOrders(guestId) {
    const response = await api.get(`/marketplace/orders/guest/${guestId}`);
    return response.data;
  }
};

// ==================== CHAT ====================

export const chatService = {
  async sendMessage(message, guestId, hotelId) {
    const response = await api.post('/guest-portal/chat', {
      message,
      guest_id: guestId,
      hotel_id: hotelId
    });
    return response.data;
  }
};

// ==================== LOYALTY ====================

export const loyaltyService = {
  async getMemberInfo(guestId, hotelId) {
    const response = await api.get(`/guest-portal/loyalty/${guestId}`, {
      params: { hotel_id: hotelId }
    });
    return response.data;
  },

  async getRewards(hotelId) {
    const response = await api.get(`/loyalty/rewards/${hotelId}`);
    return response.data;
  },

  async redeemReward(memberId, rewardId) {
    const response = await api.post(`/loyalty/redeem`, { member_id: memberId, reward_id: rewardId });
    return response.data;
  }
};

// ==================== ACCOUNT ====================

export const accountService = {
  async getAccountInfo(guestId) {
    const response = await api.get(`/guest-portal/account/${guestId}`);
    return response.data;
  }
};

// ==================== AVAILABILITY ====================

export const availabilityService = {
  async checkAvailability(hotelId, checkIn, checkOut, adults = 2, children = 0) {
    const response = await api.get('/public/availability', {
      params: { hotel_id: hotelId, check_in: checkIn, check_out: checkOut, adults, children }
    });
    return response.data;
  }
};

export default api;
