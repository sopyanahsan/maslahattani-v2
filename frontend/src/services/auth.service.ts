import api from './api';

export interface LoginPayload {
  /** Email OR username (akan dikirim ke backend sebagai field `identifier`). */
  identifier: string;
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

export interface AuthUserDto {
  id: string;
  email: string;
  username?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'KASIR' | 'CASHIER_SUPERVISOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  shopId?: string | null;
}

/** Sukses login (admin sudah verifikasi OTP, atau kasir tanpa OTP). */
export interface LoginSuccessResponse {
  success: true;
  token: string;
  refreshToken: string;
  user: AuthUserDto;
}

/** Backend butuh OTP (admin login step 1). */
export interface LoginOtpRequiredResponse {
  success: false;
  requireOtp: true;
  message: string;
}

export type LoginResponse = LoginSuccessResponse | LoginOtpRequiredResponse;

export interface MessageResponse {
  success: boolean;
  message: string;
}

const authService = {
  /**
   * Login dengan email/username + password (+ optional OTP untuk admin).
   * Bisa balik 2 shape: success+token, atau requireOtp.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  /**
   * Register kasir baru (email + password).
   */
  async registerKasir(payload: RegisterPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/register-kasir', payload);
    return data;
  },

  /**
   * Verify OTP (registration / reset).
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  /**
   * Forgot password - kirim OTP ke email.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  },

  /**
   * Reset password dengan OTP.
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },

  /**
   * Refresh token.
   */
  async refreshToken(refreshToken: string): Promise<LoginSuccessResponse> {
    const { data } = await api.post('/auth/refresh-token', { refreshToken });
    return data;
  },

  /**
   * Logout.
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Get current user profile (GET /auth/me).
   */
  async getMe(): Promise<AuthUserDto> {
    const { data } = await api.get('/auth/me');
    return data.user || data;
  },
};

export default authService;
