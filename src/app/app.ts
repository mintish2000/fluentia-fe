import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '@environments/environment';
import * as appLocales from '@i18n/index';
import { SystemService } from '@shared/services/system/system.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private _systemService = inject(SystemService);

  constructor() {
    this._initLanguage();
  }

  private _initLanguage() {
    const languages = environment.languages;
    const defaultLanguage = environment.defaultLanguage;
    const locals = appLocales;

    this._systemService.initLanguageConfig(languages, defaultLanguage, locals);
  }
}
