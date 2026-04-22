import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateParser, TranslateService } from '@ngx-translate/core';

@Injectable()
export class EnglishArabicPaginatorIntl extends MatPaginatorIntl {
  private _translate: TranslateService = inject(TranslateService);
  private _translateParser: TranslateParser = inject(TranslateParser);

  private rangeLabelIntl!: string;

  constructor() {
    super();

    this.getTranslations();
    this._translate.onLangChange.subscribe(() => this.getTranslations());
  }

  getTranslations() {
    this._translate
      .get([
        'paginator.itemsPerPage',
        'paginator.nextPage',
        'paginator.previousPage',
        'paginator.range',
      ])
      .subscribe((translation) => {
        this.itemsPerPageLabel = translation['paginator.itemsPerPage'];
        this.nextPageLabel = translation['paginator.nextPage'];
        this.previousPageLabel = translation['paginator.previousPage'];
        this.rangeLabelIntl = translation['paginator.range'];
        this.changes.next();
      });
  }

  override getRangeLabel = (
    page: number,
    pageSize: number,
    length: number
  ): string => {
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try to fix the end index to the end.
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;
    return this._translateParser.interpolate(this.rangeLabelIntl, {
      startIndex: startIndex + 1,
      endIndex,
      length,
    }) as string;
  };
}
