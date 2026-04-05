import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { Course } from '@shared/interfaces/learning/learning.interface';
import { CoursesService } from '@shared/services/learning/courses.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-courses',
  imports: [RouterLink, ScrollRevealContainerDirective],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CoursesComponent {
  private _coursesService = inject(CoursesService);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly hasNextPage = signal(false);
  readonly isLoading = signal(false);
  readonly courses = signal<Course[]>([]);
  readonly hasCourses = computed(() => this.courses().length > 0);

  constructor() {
    this.loadCourses();
  }

  /**
   * Loads course list for the current pagination state.
   */
  loadCourses(): void {
    this.isLoading.set(true);

    this._coursesService
      .getCourses({
        page: this.page(),
        limit: this.limit(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.courses.set(response.data ?? []);
          this.hasNextPage.set(response.hasNextPage);
        },
      });
  }

  /**
   * Moves to next page when available.
   */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.page.update((value) => value + 1);
    this.loadCourses();
  }

  /**
   * Moves to previous page when possible.
   */
  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((value) => value - 1);
    this.loadCourses();
  }
}
