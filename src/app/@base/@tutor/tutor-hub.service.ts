import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Availability,
  Booking,
  Course,
  Enrollment,
  Lesson,
} from '@shared/interfaces/learning/learning.interface';
import { ToastService } from '@shared/services/toast/toast.service';
import { UserService } from '@shared/services/user/user.service';
import { AvailabilitiesService } from '@shared/services/learning/availabilities.service';
import { BookingsService } from '@shared/services/learning/bookings.service';
import { CoursesService } from '@shared/services/learning/courses.service';
import { EnrollmentsService } from '@shared/services/learning/enrollments.service';
import { LessonsService } from '@shared/services/learning/lessons.service';
import {
  fetchAllInfinityPages,
  mergeRecordsById,
} from '@shared/utils/learning/infinity-pagination.utils';
import { finalize, forkJoin, Observable } from 'rxjs';

/** Tutor hub workspace tabs; each tab triggers its own lazy API bundle. */
export type TutorHubSection = 'courses' | 'lessons' | 'students' | 'bookings';

@Injectable()
export class TutorHubService {
  private readonly _coursesService = inject(CoursesService);
  private readonly _lessonsService = inject(LessonsService);
  private readonly _bookingsService = inject(BookingsService);
  private readonly _availabilitiesService = inject(AvailabilitiesService);
  private readonly _enrollmentsService = inject(EnrollmentsService);
  private readonly _userService = inject(UserService);
  private readonly _toast = inject(ToastService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly currentUser = this._userService.currentUser;
  readonly displayName = computed(() => this.currentUser()?.name || 'Tutor');

  readonly isLoading = signal(false);
  readonly lastSyncedAt = signal<Date | null>(null);
  readonly allCourses = signal<Course[]>([]);
  readonly allEnrollments = signal<Enrollment[]>([]);
  readonly allBookings = signal<Booking[]>([]);
  readonly allAvailabilities = signal<Availability[]>([]);
  readonly allLessons = signal<Lesson[]>([]);
  readonly editingCourseId = signal<string | null>(null);
  readonly editingLessonId = signal<string | null>(null);

  readonly courseTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly courseLevel = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly coursePrice = new FormControl<number | null>(null, {
    validators: [Validators.min(0)],
  });
  readonly courseDescription = new FormControl('', { nonNullable: true });
  readonly lessonCourseId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly lessonTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly lessonOrder = new FormControl<number | null>(1, {
    validators: [Validators.required, Validators.min(1)],
  });
  readonly lessonVideoUrl = new FormControl('', { nonNullable: true });
  readonly lessonContent = new FormControl('', { nonNullable: true });
  readonly bookingStudentId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly bookingDate = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly bookingStartTime = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly bookingMeetingProvider = new FormControl<'zoom' | 'google_meet'>('zoom', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly bookingMeetingLink = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly tutorCourses = computed(() => {
    const tutorId = this.currentUser()?.id;
    return this.allCourses().filter(
      (course) => String(course.tutor?.id) === String(tutorId),
    );
  });
  readonly tutorCourseIds = computed(
    () => new Set(this.tutorCourses().map((course) => course.id)),
  );
  readonly tutorEnrollments = computed(() =>
    this.allEnrollments().filter((enrollment) =>
      this.tutorCourseIds().has(enrollment.course.id),
    ),
  );
  readonly tutorBookings = computed(() => {
    const tutorId = this.currentUser()?.id;
    return this.allBookings().filter(
      (booking) => String(booking.tutor?.id) === String(tutorId),
    );
  });
  readonly tutorAvailabilities = computed(() => {
    const tutorId = this.currentUser()?.id;
    return this.allAvailabilities().filter(
      (availability) => String(availability.tutor?.id) === String(tutorId),
    );
  });
  readonly tutorStudents = computed(() => {
    const byStudentId = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        averageProgress: number;
        enrollments: Enrollment[];
      }
    >();

    this.tutorEnrollments().forEach((enrollment) => {
      if (!enrollment.student) {
        return;
      }
      const id = String(enrollment.student.id);
      const current = byStudentId.get(id);
      const studentName =
        `${enrollment.student.firstName ?? ''} ${
          enrollment.student.lastName ?? ''
        }`.trim() || 'Student';
      const studentEmail = enrollment.student.email ?? '-';

      if (!current) {
        byStudentId.set(id, {
          id,
          name: studentName,
          email: studentEmail,
          averageProgress: Number(enrollment.progress ?? 0),
          enrollments: [enrollment],
        });
        return;
      }

      current.enrollments.push(enrollment);
      const total = current.enrollments.reduce(
        (sum, item) => sum + Number(item.progress ?? 0),
        0,
      );
      current.averageProgress = Math.round(total / current.enrollments.length);
    });

    return Array.from(byStudentId.values());
  });
  readonly tutorBookingStudents = computed(() =>
    this.tutorStudents()
      .map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly managedCoursesCount = signal(0);
  readonly managedLessonsCount = signal(0);
  readonly tutorBookingsCount = signal(0);
  readonly tutorAvailabilitiesCount = signal(0);
  readonly tutorStudentsCount = signal(0);
  readonly tutorLessons = computed(() =>
    this.allLessons().filter((lesson) => this.tutorCourseIds().has(lesson.course.id)),
  );

  private _fetchedTutorCourses = false;
  private _fetchedTutorLessons = false;
  private _fetchedTutorEnrollments = false;
  private _fetchedTutorBookings = false;
  private _fetchedTutorAvailabilities = false;

  /**
   * Recomputes dashboard counters from whatever tutor-scoped rows are already in memory.
   */
  private _recomputeTutorMetrics(): void {
    const tutorId = this.currentUser()?.id;
    if (!tutorId) {
      return;
    }

    const tutorCourses = this.allCourses().filter(
      (course) => String(course.tutor?.id) === String(tutorId),
    );
    const tutorCourseIds = new Set(tutorCourses.map((course) => course.id));
    const tutorLessons = this.allLessons().filter((lesson) =>
      tutorCourseIds.has(lesson.course.id),
    );
    const tutorBookings = this.allBookings().filter(
      (booking) => String(booking.tutor?.id) === String(tutorId),
    );
    const tutorAvailabilities = this.allAvailabilities().filter(
      (availability) => String(availability.tutor?.id) === String(tutorId),
    );
    const tutorEnrollments = this.allEnrollments().filter((enrollment) =>
      tutorCourseIds.has(enrollment.course.id),
    );
    const uniqueStudents = new Set(
      tutorEnrollments
        .filter((enrollment) => enrollment.student)
        .map((enrollment) => String(enrollment.student!.id)),
    );

    this.managedCoursesCount.set(tutorCourses.length);
    this.managedLessonsCount.set(tutorLessons.length);
    this.tutorBookingsCount.set(tutorBookings.length);
    this.tutorAvailabilitiesCount.set(tutorAvailabilities.length);
    this.tutorStudentsCount.set(uniqueStudents.size);
  }

  /**
   * Applies lazy tab forkJoin results into signals and marks fetch flags.
   */
  private _applyLazySectionPayload(payload: Record<string, unknown>): void {
    const courses = payload['courses'] as Course[] | undefined;
    const lessons = payload['lessons'] as Lesson[] | undefined;
    const enrollments = payload['enrollments'] as Enrollment[] | undefined;
    const bookings = payload['bookings'] as Booking[] | undefined;
    const availabilities = payload['availabilities'] as Availability[] | undefined;

    if (courses !== undefined) {
      this.allCourses.update((cur) => mergeRecordsById(cur, courses));
      this._fetchedTutorCourses = true;
    }
    if (lessons !== undefined) {
      this.allLessons.update((cur) => mergeRecordsById(cur, lessons));
      this._fetchedTutorLessons = true;
    }
    if (enrollments !== undefined) {
      this.allEnrollments.update((cur) => mergeRecordsById(cur, enrollments));
      this._fetchedTutorEnrollments = true;
    }
    if (bookings !== undefined) {
      this.allBookings.update((cur) => mergeRecordsById(cur, bookings));
      this._fetchedTutorBookings = true;
    }
    if (availabilities !== undefined) {
      this.allAvailabilities.update((cur) => mergeRecordsById(cur, availabilities));
      this._fetchedTutorAvailabilities = true;
    }
  }

  /**
   * Subscribes only to API bundles required for the active tutor tab (first visit per resource).
   */
  ensureTutorSectionData(section: TutorHubSection): void {
    const tutorId = this.currentUser()?.id;
    if (!tutorId) {
      return;
    }

    const reqs: Record<string, Observable<unknown>> = {};
    if (!this._fetchedTutorCourses) {
      reqs['courses'] = fetchAllInfinityPages((page, limit) =>
        this._coursesService.getCourses({ page, limit }),
      );
    }
    if (section === 'lessons' && !this._fetchedTutorLessons) {
      reqs['lessons'] = fetchAllInfinityPages((page, limit) =>
        this._lessonsService.getLessons({ page, limit }),
      );
    }
    if (section === 'students' && !this._fetchedTutorEnrollments) {
      reqs['enrollments'] = fetchAllInfinityPages((page, limit) =>
        this._enrollmentsService.getEnrollments({ page, limit }),
      );
    }
    if (section === 'bookings') {
      if (!this._fetchedTutorEnrollments) {
        reqs['enrollments'] = fetchAllInfinityPages((page, limit) =>
          this._enrollmentsService.getEnrollments({ page, limit }),
        );
      }
      if (!this._fetchedTutorBookings) {
        reqs['bookings'] = fetchAllInfinityPages((page, limit) =>
          this._bookingsService.getBookings({ page, limit }),
        );
      }
      if (!this._fetchedTutorAvailabilities) {
        reqs['availabilities'] = fetchAllInfinityPages((page, limit) =>
          this._availabilitiesService.getAvailabilities({ page, limit }),
        );
      }
    }

    if (Object.keys(reqs).length === 0) {
      this._recomputeTutorMetrics();
      return;
    }

    this.isLoading.set(true);
    forkJoin(reqs)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._applyLazySectionPayload(response as Record<string, unknown>);
          this._recomputeTutorMetrics();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Full refresh after mutations or explicit sync; loads every tutor-related list with paging.
   */
  loadTutorOverview() {
    const tutorId = this.currentUser()?.id;
    if (!tutorId) {
      return;
    }

    this.isLoading.set(true);

    forkJoin({
      courses: fetchAllInfinityPages((page, limit) =>
        this._coursesService.getCourses({ page, limit }),
      ),
      lessons: fetchAllInfinityPages((page, limit) =>
        this._lessonsService.getLessons({ page, limit }),
      ),
      bookings: fetchAllInfinityPages((page, limit) =>
        this._bookingsService.getBookings({ page, limit }),
      ),
      availabilities: fetchAllInfinityPages((page, limit) =>
        this._availabilitiesService.getAvailabilities({ page, limit }),
      ),
      enrollments: fetchAllInfinityPages((page, limit) =>
        this._enrollmentsService.getEnrollments({ page, limit }),
      ),
    })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.allCourses.set(response.courses);
          this.allEnrollments.set(response.enrollments);
          this.allBookings.set(response.bookings);
          this.allAvailabilities.set(response.availabilities);
          this.allLessons.set(response.lessons);

          this._fetchedTutorCourses = true;
          this._fetchedTutorLessons = true;
          this._fetchedTutorEnrollments = true;
          this._fetchedTutorBookings = true;
          this._fetchedTutorAvailabilities = true;

          this._recomputeTutorMetrics();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Persists course create or edit operation for tutor-owned courses.
   */
  saveCourse() {
    if (this.courseTitle.invalid || this.courseLevel.invalid) {
      this.courseTitle.markAsTouched();
      this.courseLevel.markAsTouched();
      return;
    }

    const tutorId = this.currentUser()?.id;
    if (!tutorId) {
      return;
    }

    const payload = {
      tutor: { id: tutorId },
      title: this.courseTitle.value.trim(),
      level: this.courseLevel.value.trim(),
      price: this.coursePrice.value,
      description: this.courseDescription.value.trim() || null,
    };

    this.isLoading.set(true);
    const request$ = this.editingCourseId()
      ? this._coursesService.updateCourse(this.editingCourseId() as string, payload)
      : this._coursesService.createCourse(payload);

    request$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess(
            this.editingCourseId()
              ? 'Course updated successfully'
              : 'Course created successfully',
          );
          this.resetCourseForm();
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Loads course values into the form for editing.
   */
  editCourse(course: Course) {
    this.editingCourseId.set(course.id);
    this.courseTitle.setValue(course.title);
    this.courseLevel.setValue(course.level);
    this.coursePrice.setValue(course.price ?? null);
    this.courseDescription.setValue(course.description ?? '');
  }

  /**
   * Clears editing state and resets course form controls.
   */
  resetCourseForm() {
    this.editingCourseId.set(null);
    this.courseTitle.setValue('');
    this.courseLevel.setValue('');
    this.coursePrice.setValue(null);
    this.courseDescription.setValue('');
  }

  /**
   * Removes selected tutor course.
   */
  deleteCourse(courseId: string) {
    this.isLoading.set(true);
    this._coursesService
      .deleteCourse(courseId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Course deleted successfully');
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Persists lesson create or edit operation for tutor-owned courses.
   */
  saveLesson() {
    if (
      this.lessonCourseId.invalid ||
      this.lessonTitle.invalid ||
      this.lessonOrder.invalid
    ) {
      this.lessonCourseId.markAsTouched();
      this.lessonTitle.markAsTouched();
      this.lessonOrder.markAsTouched();
      return;
    }

    const selectedCourseId = this.lessonCourseId.value;
    if (!this.tutorCourseIds().has(selectedCourseId)) {
      this._toast.showError('You can only manage lessons in your own courses.');
      return;
    }

    const payload = {
      course: { id: selectedCourseId },
      title: this.lessonTitle.value.trim(),
      lessonOrder: Number(this.lessonOrder.value ?? 1),
      videoUrl: this.lessonVideoUrl.value.trim() || null,
      content: this.lessonContent.value.trim() || null,
    };

    this.isLoading.set(true);
    const request$ = this.editingLessonId()
      ? this._lessonsService.updateLesson(this.editingLessonId() as string, payload)
      : this._lessonsService.createLesson(payload);

    request$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess(
            this.editingLessonId()
              ? 'Lesson updated successfully'
              : 'Lesson created successfully',
          );
          this.resetLessonForm();
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Loads lesson values into form for editing.
   */
  editLesson(lesson: Lesson) {
    this.editingLessonId.set(lesson.id);
    this.lessonCourseId.setValue(lesson.course.id);
    this.lessonTitle.setValue(lesson.title);
    this.lessonOrder.setValue(lesson.lessonOrder ?? 1);
    this.lessonVideoUrl.setValue(lesson.videoUrl ?? '');
    this.lessonContent.setValue(lesson.content ?? '');
  }

  /**
   * Clears lesson editing state and resets lesson form controls.
   */
  resetLessonForm() {
    this.editingLessonId.set(null);
    this.lessonCourseId.setValue('');
    this.lessonTitle.setValue('');
    this.lessonOrder.setValue(1);
    this.lessonVideoUrl.setValue('');
    this.lessonContent.setValue('');
  }

  /**
   * Removes selected lesson.
   */
  deleteLesson(lessonId: string) {
    this.isLoading.set(true);
    this._lessonsService
      .deleteLesson(lessonId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Lesson deleted successfully');
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Updates student grading/progress for a selected enrollment.
   */
  updateEnrollmentGrade(
    enrollmentId: string,
    progressValue: string,
    statusValue: string,
  ) {
    const parsedProgress = Number(progressValue);
    const normalizedProgress = Number.isNaN(parsedProgress)
      ? 0
      : Math.max(0, Math.min(100, parsedProgress));
    const normalizedStatus = statusValue?.trim() || 'active';

    this._enrollmentsService
      .updateEnrollment(enrollmentId, {
        progress: normalizedProgress,
        status: normalizedStatus,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Student grade/progress updated');
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Reassigns an enrollment to another tutor-owned course.
   */
  reassignEnrollmentCourse(enrollmentId: string, targetCourseId: string) {
    if (!targetCourseId || !this.tutorCourseIds().has(targetCourseId)) {
      this._toast.showError('Select one of your own courses for reassignment.');
      return;
    }

    this._enrollmentsService
      .updateEnrollment(enrollmentId, {
        course: { id: targetCourseId },
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Student course reassigned successfully');
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Updates booking status (accept/reject/completed).
   */
  updateBookingStatus(bookingId: string, status: string) {
    this._bookingsService
      .updateBooking(bookingId, { status })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Booking status updated');
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Creates a one-to-one appointment from tutor to selected student.
   */
  createTutorBooking() {
    if (
      this.bookingStudentId.invalid ||
      this.bookingDate.invalid ||
      this.bookingStartTime.invalid ||
      this.bookingMeetingProvider.invalid ||
      this.bookingMeetingLink.invalid
    ) {
      this.bookingStudentId.markAsTouched();
      this.bookingDate.markAsTouched();
      this.bookingStartTime.markAsTouched();
      this.bookingMeetingProvider.markAsTouched();
      this.bookingMeetingLink.markAsTouched();
      return;
    }

    const tutorId = this.currentUser()?.id;
    if (!tutorId) {
      return;
    }

    const selectedStudent = this.tutorBookingStudents().find(
      (student) => String(student.id) === String(this.bookingStudentId.value),
    );
    if (!selectedStudent) {
      this._toast.showError('Select one of your assigned students.');
      return;
    }

    this.isLoading.set(true);
    this._bookingsService
      .createBooking({
        tutor: { id: tutorId },
        student: { id: this.bookingStudentId.value },
        status: 'scheduled',
        bookingDate: this.bookingDate.value,
        startTime: this.bookingStartTime.value,
        meetingProvider: this.bookingMeetingProvider.value,
        meetingLink: this.bookingMeetingLink.value.trim(),
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Appointment created successfully');
          this.resetTutorBookingForm();
          this.loadTutorOverview();
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Resets tutor appointment form controls.
   */
  resetTutorBookingForm() {
    this.bookingStudentId.setValue('');
    this.bookingDate.setValue('');
    this.bookingStartTime.setValue('');
    this.bookingMeetingProvider.setValue('zoom');
    this.bookingMeetingLink.setValue('');
  }
}
