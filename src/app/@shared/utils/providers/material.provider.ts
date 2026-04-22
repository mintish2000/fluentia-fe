import { Provider } from '@angular/core';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EnglishArabicPaginatorIntl } from '../translation/paginator-intl';

export const materialProviders: Provider[] = [
  {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: {
      appearance: 'outline',
      subscriptSizing: 'fixed',
    } as MatFormFieldDefaultOptions,
  },
  {
    provide: MatPaginatorIntl,
    useClass: EnglishArabicPaginatorIntl,
  },
  provideNativeDateAdapter({
    parse: { dateInput: 'DD/MM/YYYY' },
    display: {
      dateInput: 'DD/MM/YYYY',
      monthLabel: 'MMM',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'DD/MM/YYYY',
      monthYearA11yLabel: 'MMMM YYYY',
    },
  }),
];
