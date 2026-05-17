import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnglishLevelService {
  /**
   * Returns CEFR-aligned English level from percentage score.
   */
  englishLevelFromScore(score: number): string {
    const normalized = Math.max(0, Math.min(100, Number(score) || 0));

    if (normalized <= 33) return 'A1/ A2';
    if (normalized <= 66) return 'B1/ B2';
    return 'C1';
  }
}
