export interface AuthUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  provider?: AuthProvider;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum AuthProvider {
  PHONE = 'phone',
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook'
}

export interface PhoneLoginRequest {
  countryCode: string;
  phoneNumber: string;
}

export interface PhoneStartResponse {
  sessionId: string;
  expiresIn: number;
  message: string;
}

export interface PhoneVerifyRequest {
  sessionId: string;
  code: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  countryCode?: string;
}

export interface SocialLoginRequest {
  provider: AuthProvider;
  token: string;
  email?: string;
}

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag?: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
];