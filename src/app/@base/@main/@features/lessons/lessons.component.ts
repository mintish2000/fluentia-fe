import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lesson } from '@shared/interfaces/learning/learning.interface';
import { LessonsService } from '@shared/services/learning/lessons.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-lessons',
  imports: [RouterLink],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LessonsComponent {
  private _lessonsService = inject(LessonsService);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly hasNextPage = signal(false);
  readonly isLoading = signal(false);
  readonly selectedCourseId = signal<string>('all');
  readonly lessons = signal<Lesson[]>([]);
  readonly filteredLessons = computed(() => {
    const selected = this.selectedCourseId();
    if (selected === 'all') {
      return this.lessons();
    }

    return this.lessons().filter((lesson) => lesson.course.id === selected);
  });
  readonly availableCourseFilters = computed(() => {
    const map = new Map<string, string>();
    for (const lesson of this.lessons()) {
      map.set(lesson.course.id, lesson.course.title);
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  });

  constructor() {
    this.loadLessons();
  }

  /**
   * Loads lessons from backend with current pagination values.
   */
  loadLessons(): void {
    this.isLoading.set(true);
    this._lessonsService
      .getLessons({
        page: this.page(),
        limit: this.limit(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.lessons.set(response.data ?? []);
          this.hasNextPage.set(response.hasNextPage);
        },
      });
  }

  /**
   * Updates selected course filter.
   */
  setCourseFilter(value: string): void {
    this.selectedCourseId.set(value);
  }

  /**
   * Advances to next page when available.
   */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.page.update((value) => value + 1);
    this.loadLessons();
  }

  /**
   * Goes to previous page when current page is above 1.
   */
  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((value) => value - 1);
    this.loadLessons();
  }
}
