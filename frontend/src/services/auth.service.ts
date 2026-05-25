import api from './api';

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
  otp?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'KASIR' | 'CASHIER_SUPERVISOR';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    shopId?: string;
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

const authService = {
  /**
   * Login kasir (email + password)
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  /**
   * Register kasir baru (email + password)
   */
  async registerKasir(payload: RegisterPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/register-kasir', payload);
    return data;
  },

  /**
   * Verify OTP (registration / reset)
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  /**
   * Forgot password - kirim OTP ke email
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  },

  /**
   * Reset password dengan OTP
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/refresh-token', { refreshToken });
    return data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<AuthResponse['user']> {
    const { data } = await api.get('/auth/me');
    return data.user || data;
  },
};

export default authService;
