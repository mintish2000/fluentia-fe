import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  PreloadAllModules,
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { appHttpInterceptors } from '@core/interceptors';
import { TranslateModule } from '@ngx-translate/core';
import { materialProviders } from '@shared/utils/providers/material.provider';
import { PageTitleStrategy } from '@shared/utils/strategies/page-title.strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors(appHttpInterceptors), withFetch()),
    provideAnimationsAsync(),
    importProvidersFrom([
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
