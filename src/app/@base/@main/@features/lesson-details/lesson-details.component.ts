import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { Lesson } from '@shared/interfaces/learning/learning.interface';
import { LessonsService } from '@shared/services/learning/lessons.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-lesson-details',
  imports: [RouterLink, ScrollRevealContainerDirective],
  templateUrl: './lesson-details.component.html',
  styleUrl: './lesson-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LessonDetailsComponent {
  private _route = inject(ActivatedRoute);
  private _lessonsService = inject(LessonsService);

  readonly lesson = signal<Lesson | null>(null);
  readonly isLoading = signal(false);

  constructor() {
    this.loadLesson();
  }

  /**
   * Loads detailed lesson data from route parameter.
   */
  loadLesson(): void {
    const lessonId = this._route.snapshot.paramMap.get('id');
    if (!lessonId) {
      return;
    }

    this.isLoading.set(true);
    this._lessonsService
      .getLessonById(lessonId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (lesson) => this.lesson.set(lesson),
      });
  }
}
