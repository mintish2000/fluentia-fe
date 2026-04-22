import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnglishLevelService {
  /**
   * Returns CEFR-aligned English level from percentage score.
   */
  englishLevelFromScore(score: number): string {
    const normalized = Math.max(0, Math.min(100, Number(score) || 0));

    switch (true) {
      case normalized < 10:
        return 'Starter (Pre-A1)';
      case normalized < 20:
        return 'Beginner (A1)';
      case normalized < 30:
        return 'Elementary (A1+)';
      case normalized < 40:
        return 'Pre-Intermediate (A2)';
      case normalized < 50:
        return 'Intermediate (B1-)';
      case normalized < 60:
        return 'Intermediate (B1)';
      case normalized < 70:
        return 'Upper-Intermediate (B2-)';
      case normalized < 80:
        return 'Upper-Intermediate (B2)';
      case normalized < 90:
        return 'Advanced (C1)';
      default:
        return 'Proficient (C2)';
    }
  }
}
