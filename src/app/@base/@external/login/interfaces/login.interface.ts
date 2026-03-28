import { FormControl } from '@angular/forms';
import { BackendUser } from '@shared/interfaces/learning/learning.interface';

export interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordForm {
  email: FormControl<string>;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordForm {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

export interface ResetPasswordPayload {
  hash: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires?: number;
  user: BackendUser;
}
