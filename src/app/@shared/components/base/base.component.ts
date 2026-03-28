import { Direction } from '@angular/cdk/bidi';
import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ActiveStatus, Pagination } from '@shared/enums';
import { AuthService } from '@shared/services/auth/auth.service';
import { UserService } from '@shared/services/user/user.service';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { SystemService } from '../../services/system/system.service';
import { ToastService } from '../../services/toast/toast.service';

// A base class for inheriting all key services, getters, and functions. (inject function is really helpful).

@Injectable()
export abstract class BaseComponent {
  protected _translate = inject(TranslateService);
  protected _titleService = inject(Title);
  protected _formBuilder = inject(FormBuilder);
  protected _router = inject(Router);
  protected _activatedRoute = inject(ActivatedRoute);
  protected _location = inject(Location);

  protected _systemService = inject(SystemService);
  protected _localStorageService = inject(LocalStorageService);
  protected _toast = inject(ToastService);
  protected _authService = inject(AuthService);
  protected _userService = inject(UserService);

  protected _pagination = {
    limit: signal(Pagination.TAKE),
    offset: signal(Pagination.SKIP),
    options: [5, 10, 20],
  };

  protected _totalCount = signal(0);

  protected _defaultTimeout = 10000;
  protected _isLoading = signal(false);

  protected get _systemLanguages(): string[] {
    return this._systemService.systemLanguages;
  }

  protected get _currentLanguage(): string {
    return this._systemService.currentLanguage;
  }

  protected get _filteredSystemLanguages(): string[] {
    return this._systemLanguages.filter(
      (lang) => lang !== this._systemService.currentLocale
    );
  }

  protected get _direction(): Direction {
    return this._systemService.direction;
  }

  protected get _limit() {
    return this._pagination.limit;
  }

  protected get _offset() {
    return this._pagination.offset;
  }

  protected get _pageSizeOptions() {
    return this._pagination.options;
  }

  protected get _isDevelopment(): boolean {
    return this._systemService.isDevelopment;
  }

  protected get _isProduction(): boolean {
    return this._systemService.isProduction;
  }

  protected get _activeStatus() {
    return ActiveStatus;
  }

  protected _goBack() {
    this._location.back();
  }

  protected _navigate(route: string, mergeParams = true) {
    this._router.navigate([route], {
      queryParamsHandling: mergeParams ? 'merge' : 'replace',
    });
  }
}
