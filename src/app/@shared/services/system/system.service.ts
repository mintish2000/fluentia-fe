import { Direction } from '@angular/cdk/bidi';
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '@environments/environment';
import { TranslateService } from '@ngx-translate/core';

type AppLanguages = 'ar' | 'en';
type DataValue = any;
type AppLocals = {
  [local: string]: {
    lang: AppLanguages;
    data: { [key: string]: DataValue };
  };
};

@Injectable({
  providedIn: 'root',
})
export class SystemService {
  private _translate = inject(TranslateService);
  private _currentLocale = signal<AppLanguages>('en');
  private _availableLanguages = signal<string[]>([]);
  readonly currentLocaleSignal = this._currentLocale.asReadonly();
  readonly availableLanguagesSignal = this._availableLanguages.asReadonly();
  readonly directionSignal = computed<Direction>(() =>
    this._currentLocale() === 'en' ? 'ltr' : 'rtl',
  );
  readonly currentLanguageLabelSignal = computed(() =>
    this._currentLocale() === 'en'
      ? this._translate.instant('pages.layout.header.language.en')
      : this._translate.instant('pages.layout.header.language.ar'),
  );

  constructor() {
    this._translate.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(({ lang }) => {
        this._updateCurrentLocale(lang as AppLanguages);
      });
  }

  get isDevelopment(): boolean {
    return environment.production == false;
  }

  get isProduction(): boolean {
    return environment.production == true;
  }

  get systemLanguages(): string[] {
    return this._availableLanguages();
  }

  get currentLanguage(): string {
    return this.currentLanguageLabelSignal();
  }

  get currentLocale(): string {
    return this._currentLocale();
  }

  get direction(): Direction {
    return this.directionSignal();
  }

  initLanguageConfig(
    languages: string[],
    defaultLanguage: string,
    locals: AppLocals,
  ): void {
    this._translate.addLangs(languages);
    this._availableLanguages.set(languages);
    this.setTranslations(locals);

    let systemLanguage = this.getSystemLanguage();

    if (!systemLanguage) {
      systemLanguage = defaultLanguage || 'en';
      this.setSystemLanguage(systemLanguage);
    }

    this._translate.setDefaultLang(systemLanguage);
    this._translate.use(systemLanguage);
    this._updateCurrentLocale(systemLanguage as AppLanguages);

    this.reflectDirectionChanges(systemLanguage);
  }

  setTranslations(locals: AppLocals) {
    for (const langLocal in locals) {
      if (Object.prototype.hasOwnProperty.call(locals, langLocal)) {
        const element = locals[langLocal];
        this._translate.setTranslation(element.lang, element.data, true);
      }
    }
  }

  setSystemLanguage(lang: string) {
    localStorage.setItem('lang', lang);
  }

  getSystemLanguage(): string | null {
    return localStorage.getItem('lang') || null;
  }

  switchSystemLanguage(lang: string) {
    this.setSystemLanguage(lang);
    window.location.reload();
  }

  /**
   * Synchronizes locale-dependent signals and direction attributes.
   */
  private _updateCurrentLocale(lang: AppLanguages): void {
    this._currentLocale.set(lang);
    this.reflectDirectionChanges(lang);
  }

  reflectDirectionChanges(lang: string) {
    const html = document.querySelector('html');

    if (!html) return;

    switch (lang) {
      case 'ar': {
        html.setAttribute('dir', 'rtl');
        break;
      }

      case 'en': {
        html.setAttribute('dir', 'ltr');
        break;
      }

      default:
        return;
    }
  }
}
