import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
} from '@angular/router';
import { appHttpInterceptors } from '@core/interceptors';
import { TranslateModule } from '@ngx-translate/core';
import { materialProviders } from '@shared/utils/providers/material.provider';
import { PageTitleStrategy } from '@shared/utils/strategies/page-title.strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(appHttpInterceptors)),
    importProvidersFrom([
      BrowserAnimationsModule,
      TranslateModule.forRoot(),
      MatSnackBarModule,
    ]),
    {
      provide: TitleStrategy,
      useClass: PageTitleStrategy,
    },
    ...materialProviders,
  ],
};
