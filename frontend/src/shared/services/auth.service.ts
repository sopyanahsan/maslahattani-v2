import api from './api';

// ============================================
// Request payloads
// ============================================

export interface LoginPayload {
  /** Email atau username (dikirim ke backend sebagai field `identifier`). */
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

export interface LoginPinPayload {
  username: string;
  pin: string;
}

// ============================================
// Shared types
// ============================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'KASIR' | 'CASHIER_SUPERVISOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AuthUserDto {
  id: string;
  email?: string | null;
  username?: string | null;
  fullName?: string | null;
  role: UserRole;
  status: UserStatus;
  shopId?: string | null;
  mustChangePassword?: boolean;
  mustChangePin?: boolean;
}

export interface ShopDto {
  id: string;
  name: string;
  address: string;
  phone: string;
}

// ============================================
// Login response variants
//
// Backend balas satu dari 3 shape:
// 1. Success direct (regular user dengan shop assigned, atau super-admin
//    setelah selectShop)
// 2. OTP required (admin/super-admin first step)
// 3. Shop selection required (super-admin setelah OTP, sebelum pilih cabang)
// ============================================

export interface LoginSuccessResponse {
  success: true;
  requireShopSelection?: false;
  requireOtp?: false;
  token: string;
  refreshToken: string;
  user: AuthUserDto;
  /** Hadir kalau user sudah ada di cabang spesifik. */
  shop?: ShopDto;
}

export interface LoginOtpRequiredResponse {
  success: false;
  requireOtp: true;
  message: string;
}

export interface LoginShopSelectionRequiredResponse {
  success: true;
  requireShopSelection: true;
  token: string; // token sementara, shopId=null di JWT
  refreshToken: string;
  user: AuthUserDto; // user.shopId akan null
  shops: ShopDto[];
}

export type LoginResponse =
  | LoginSuccessResponse
  | LoginOtpRequiredResponse
  | LoginShopSelectionRequiredResponse;

// ============================================
// /me response
// ============================================

export interface MeResponse extends AuthUserDto {
  /** Detail cabang aktif. Untuk super-admin: cabang yang dipilih.
   *  Untuk regular user: cabang yang di-assign. Null kalau belum dipilih. */
  currentShop?: ShopDto | null;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// ============================================
// Service functions
// ============================================

const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async loginWithPin(payload: LoginPinPayload): Promise<LoginSuccessResponse> {
    const { data } = await api.post<LoginSuccessResponse>('/auth/login-pin', payload);
    return data;
  },

  async registerKasir(payload: RegisterPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/register-kasir', payload);
    return data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<LoginSuccessResponse> {
    const { data } = await api.post('/auth/refresh-token', { refreshToken });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
  },

  async changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/change-password', { newPassword });
    return data;
  },

  async changePin(oldPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/change-pin', { oldPin, newPin });
    return data;
  },

  async setNewPin(newPin: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/set-new-pin', { newPin });
    return data;
  },
};

export default authService;
