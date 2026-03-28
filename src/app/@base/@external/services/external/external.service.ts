import { inject, Injectable } from '@angular/core';
import {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '@base/@external/login/interfaces/login.interface';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ExternalService {
  private _api = inject(ApiService);

  login(data: LoginPayload) {
    return this._api.post<LoginResponse>({
      path: '/auth/email/login',
      body: data,
    });
  }

  register(data: RegisterPayload) {
    return this._api.post<void>({
      path: '/auth/email/register',
      body: data,
    });
  }

  forgotPassword(data: ForgotPasswordPayload) {
    return this._api.post<void>({
      path: '/auth/forgot/password',
      body: data,
    });
  }

  resetPassword(data: ResetPasswordPayload) {
    return this._api.post<void>({
      path: '/auth/reset/password',
      body: data,
    });
  }
}
