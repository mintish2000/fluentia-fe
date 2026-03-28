import { CommonModule } from '@angular/common';
import { Component, computed, inject, output, ViewEncapsulation } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { SystemService } from '@shared/services/system/system.service';
import { ActionButtonComponent } from '../action-button/action-button.component';

@Component({
  selector: 'app-change-language',
  imports: [
    CommonModule,
    ActionButtonComponent,
    MatMenuModule,
    TranslateModule,
  ],
  templateUrl: './change-language.component.html',
  styleUrl: './change-language.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChangeLanguageComponent {
  private _systemService = inject(SystemService);

  langChange = output<string>();
  currentLanguage = computed(() => this._systemService.currentLanguage);
  filteredSystemLanguages = computed(() =>
    this._systemService
      .systemLanguages
      .filter((lang) => lang !== this._systemService.currentLocale),
  );

  switchLanguage(lang: string) {
    this._systemService.switchSystemLanguage(lang);
    this.langChange.emit(lang);
  }
}
