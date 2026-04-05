import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { Course } from '@shared/interfaces/learning/learning.interface';
import { CoursesService } from '@shared/services/learning/courses.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-course-details',
  imports: [RouterLink, ScrollRevealContainerDirective],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseDetailsComponent {
  private _route = inject(ActivatedRoute);
  private _coursesService = inject(CoursesService);

  readonly course = signal<Course | null>(null);
  readonly isLoading = signal(false);

  constructor() {
    this.loadCourse();
  }

  /**
   * Loads detailed course data from route param.
   */
  loadCourse(): void {
    const courseId = this._route.snapshot.paramMap.get('id');
    if (!courseId) {
      return;
    }

    this.isLoading.set(true);
    this._coursesService
      .getCourseById(courseId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (course) => this.course.set(course),
      });
  }
}
