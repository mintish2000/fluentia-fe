import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppUserType } from '@shared/enums/user/app-user-type.enum';
import { BackendUser, Course, Enrollment } from '@shared/interfaces/learning/learning.interface';
import { ToastService } from '@shared/services/toast/toast.service';
import { UserService } from '@shared/services/user/user.service';
import { AdminUsersService } from '@shared/services/learning/admin-users.service';
import { BookingsService } from '@shared/services/learning/bookings.service';
import { CoursesService } from '@shared/services/learning/courses.service';
import { EnrollmentsService } from '@shared/services/learning/enrollments.service';
import { LessonsService } from '@shared/services/learning/lessons.service';
import {
  fetchAllInfinityPages,
  INFINITY_PAGE_LIMIT,
} from '@shared/utils/learning/infinity-pagination.utils';
import { finalize, forkJoin } from 'rxjs';

const ACTIVE_STATUS_ID = 1;
const INACTIVE_STATUS_ID = 2;

@Injectable()
export class AdminHubService {
  private readonly _coursesService = inject(CoursesService);
  private readonly _lessonsService = inject(LessonsService);
  private readonly _enrollmentsService = inject(EnrollmentsService);
  private readonly _bookingsService = inject(BookingsService);
  private readonly _adminUsersService = inject(AdminUsersService);
  private readonly _userService = inject(UserService);
  private readonly _toast = inject(ToastService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly currentUser = this._userService.currentUser;
  readonly displayName = computed(() => this.currentUser()?.name || 'Admin');
  readonly isLoading = signal(false);
  readonly users = signal<BackendUser[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly lastSyncedAt = signal<Date | null>(null);
  readonly tutors = computed(() =>
    this.users().filter((user) => this._resolveUserRole(user) === AppUserType.TUTOR),
  );
  readonly students = computed(() =>
    this.users().filter((user) => {
      const role = this._resolveUserRole(user);
      return role === AppUserType.STUDENT || role === AppUserType.USER;
    }),
  );
  readonly assignableTutors = computed(() =>
    this.tutors().filter((user) => this.isUserActive(user)),
  );
  readonly assignableStudents = computed(() =>
    this.students().filter((user) => this.isUserActive(user)),
  );
  readonly studentsWithoutCoursesCount = computed(() => {
    const enrolledStudentIds = new Set(
      this.enrollments()
        .map((enrollment) => enrollment.student?.id)
        .filter((studentId) => studentId !== null && studentId !== undefined)
        .map((studentId) => String(studentId)),
    );
    return this.assignableStudents().filter(
      (student) => !enrolledStudentIds.has(String(student.id)),
    ).length;
  });
  readonly listedUsers = computed(() =>
    this.users()
      .slice()
      .sort((a, b) => {
        const roleA = this._resolveUserRole(a);
        const roleB = this._resolveUserRole(b);
        if (roleA !== roleB) {
          return roleA - roleB;
        }

        const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim().toLowerCase();
        const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      }),
  );
  readonly activeUsersCount = computed(
    () =>
      this.listedUsers().filter(
        (user) => Number(user.status?.id) === ACTIVE_STATUS_ID,
      ).length,
  );
  readonly inactiveUsersCount = computed(
    () =>
      this.listedUsers().filter(
        (user) => Number(user.status?.id) === INACTIVE_STATUS_ID,
      ).length,
  );
  readonly coursesForSelectedTutor = computed(() => {
    const selectedId = String(this.selectedTutorId.value || '');
    return this.courses().filter((course) => {
      const tutorId = course.tutor?.id;
      return tutorId !== undefined && tutorId !== null && String(tutorId) === selectedId;
    });
  });

  readonly selectedTutorId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly selectedStudentId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly selectedCourseId = new FormControl({ value: '', disabled: true }, {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly reassignEnrollmentId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly reassignTutorId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly reassignCourseId = new FormControl({ value: '', disabled: true }, {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly coursesForReassignTutor = computed(() => {
    const selectedId = String(this.reassignTutorId.value || '');
    return this.courses().filter((course) => {
      const tutorId = course.tutor?.id;
      return tutorId !== undefined && tutorId !== null && String(tutorId) === selectedId;
    });
  });

  readonly coursesCount = signal(0);
  readonly lessonsCount = signal(0);
  readonly enrollmentsCount = signal(0);
  readonly bookingsCount = signal(0);

  /** True after Operations tab data has been loaded at least once. */
  private _operationsBundleLoaded = false;
  /** True after Users tab has resolved its user list (or reused Operations data). */
  private _usersTabResolved = false;

  constructor() {
    this._syncAssignmentCourseControlState();
    this._syncReassignCourseControlState();
  }

  /**
   * Loads Operations-tab datasets once (assignments and metrics) unless already loaded.
   */
  ensureOperationsDataLoaded(): void {
    if (this._operationsBundleLoaded) {
      return;
    }
    this._loadOperationsBundle();
  }

  /**
   * Ensures user list is available for the Users tab without loading the full Operations bundle when possible.
   */
  ensureUsersTabLoaded(): void {
    if (this._usersTabResolved) {
      return;
    }
    if (this.users().length > 0) {
      this._usersTabResolved = true;
      return;
    }

    this.isLoading.set(true);
    fetchAllInfinityPages((page, limit) => this._adminUsersService.getUsers({ page, limit }))
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (list) => {
          this.users.set(list);
          this._usersTabResolved = true;
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Refreshes Operations data (and related counters). Always hits the network.
   */
  loadAdminOverview() {
    this._loadOperationsBundle();
  }

  /**
   * Runs the Operations forkJoin and applies results.
   */
  private _loadOperationsBundle(): void {
    this.isLoading.set(true);

    forkJoin({
      users: fetchAllInfinityPages((page, limit) =>
        this._adminUsersService.getUsers({ page, limit }),
      ),
      courses: fetchAllInfinityPages((page, limit) =>
        this._coursesService.getCourses({ page, limit }),
      ),
      lessons: this._lessonsService.getLessons({ page: 1, limit: INFINITY_PAGE_LIMIT }),
      enrollments: this._enrollmentsService.getEnrollments({
        page: 1,
        limit: INFINITY_PAGE_LIMIT,
      }),
      bookings: this._bookingsService.getBookings({ page: 1, limit: INFINITY_PAGE_LIMIT }),
    })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.users.set(response.users ?? []);
          this.courses.set(response.courses ?? []);
          this.enrollments.set(response.enrollments.data ?? []);
          this.coursesCount.set(response.courses.length);
          this.lessonsCount.set(response.lessons.data.length);
          this.enrollmentsCount.set(response.enrollments.data.length);
          this.bookingsCount.set(response.bookings.data.length);
          this._operationsBundleLoaded = true;
          this._usersTabResolved = true;
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Assigns a student to a tutor by creating enrollment on a tutor-owned course.
   */
  assignStudentToTutor() {
    if (
      this.selectedTutorId.invalid ||
      this.selectedStudentId.invalid ||
      this.selectedCourseId.invalid
    ) {
      this.selectedTutorId.markAsTouched();
      this.selectedStudentId.markAsTouched();
      this.selectedCourseId.markAsTouched();
      return;
    }

    const selectedTutorId = this.selectedTutorId.value;
    const selectedCourseId = this.selectedCourseId.value;
    const selectedStudentId = this.selectedStudentId.value;

    const selectedCourse = this.courses().find(
      (course) => course.id === selectedCourseId,
    );
    if (!selectedCourse || String(selectedCourse.tutor.id) !== String(selectedTutorId)) {
      this._toast.showError('Selected course must belong to the selected tutor.');
      return;
    }

    const alreadyAssigned = this.enrollments().some(
      (enrollment) =>
        String(enrollment.student?.id ?? '') === String(selectedStudentId) &&
        String(enrollment.course.id) === String(selectedCourseId),
    );
    if (alreadyAssigned) {
      this._toast.showError('Student is already assigned to this tutor course.');
      return;
    }

    this.isLoading.set(true);
    this._enrollmentsService
      .createEnrollment({
        course: { id: selectedCourseId },
        student: { id: selectedStudentId },
        progress: 0,
        status: 'active',
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (newEnrollment) => {
          this.enrollments.update((list) => [newEnrollment, ...list]);
          this.enrollmentsCount.update((count) => count + 1);
          this._toast.showSuccess('Student assigned to tutor successfully.');
          this.selectedStudentId.setValue('');
          this.selectedCourseId.setValue('');
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Handles tutor selection changes and resets dependent course selection.
   */
  onTutorChanged() {
    this.selectedCourseId.setValue('');
    this._syncAssignmentCourseControlState();
  }

  /**
   * Handles tutor selection changes for reassignment flow.
   */
  onReassignTutorChanged() {
    this.reassignCourseId.setValue('');
    this._syncReassignCourseControlState();
  }

  /**
   * Keeps assignment course control enabled only when tutor is selected.
   */
  private _syncAssignmentCourseControlState() {
    if (this.selectedTutorId.value) {
      this.selectedCourseId.enable({ emitEvent: false });
      return;
    }
    this.selectedCourseId.disable({ emitEvent: false });
  }

  /**
   * Keeps reassignment course control enabled only when tutor is selected.
   */
  private _syncReassignCourseControlState() {
    if (this.reassignTutorId.value) {
      this.reassignCourseId.enable({ emitEvent: false });
      return;
    }
    this.reassignCourseId.disable({ emitEvent: false });
  }

  /**
   * Reassigns an existing enrollment to a new tutor-owned course.
   */
  reassignStudentTutor() {
    if (
      this.reassignEnrollmentId.invalid ||
      this.reassignTutorId.invalid ||
      this.reassignCourseId.invalid
    ) {
      this.reassignEnrollmentId.markAsTouched();
      this.reassignTutorId.markAsTouched();
      this.reassignCourseId.markAsTouched();
      return;
    }

    const enrollmentId = this.reassignEnrollmentId.value;
    const tutorId = this.reassignTutorId.value;
    const courseId = this.reassignCourseId.value;

    const selectedCourse = this.courses().find((course) => course.id === courseId);
    if (!selectedCourse || String(selectedCourse.tutor?.id) !== String(tutorId)) {
      this._toast.showError('Selected course must belong to the selected tutor.');
      return;
    }

    this.isLoading.set(true);
    this._enrollmentsService
      .updateEnrollment(enrollmentId, { course: { id: courseId } })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (updatedEnrollment) => {
          this.enrollments.update((list) =>
            list.map((item) =>
              String(item.id) === String(updatedEnrollment.id)
                ? { ...item, ...updatedEnrollment }
                : item,
            ),
          );
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess('Student reassigned to tutor successfully.');
          this.reassignEnrollmentId.setValue('');
          this.reassignTutorId.setValue('');
          this.reassignCourseId.setValue('');
        },
      });
  }

  /**
   * Returns whether the user is currently active.
   */
  isUserActive(user: BackendUser): boolean {
    return Number(user.status?.id) === ACTIVE_STATUS_ID;
  }

  /**
   * Returns whether admin can mutate selected user.
   */
  canManageUser(user: BackendUser): boolean {
    return String(user.id) !== String(this.currentUser()?.id);
  }

  /**
   * Resolves user status to readable label.
   */
  getUserStatusLabel(user: BackendUser): string {
    if (Number(user.status?.id) === ACTIVE_STATUS_ID) {
      return 'Active';
    }
    if (Number(user.status?.id) === INACTIVE_STATUS_ID) {
      return 'Inactive';
    }
    return user.status?.name || 'Unknown';
  }

  /**
   * Toggles user active/inactive status.
   */
  setUserActiveState(user: BackendUser, shouldBeActive: boolean) {
    const targetStatusId = shouldBeActive ? ACTIVE_STATUS_ID : INACTIVE_STATUS_ID;
    if (Number(user.status?.id) === targetStatusId) {
      return;
    }

    this.isLoading.set(true);
    this._adminUsersService
      .updateUser(user.id, { status: { id: targetStatusId } })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (updatedUser) => {
          this.users.update((list) =>
            list.map((item) =>
              String(item.id) === String(updatedUser.id)
                ? { ...item, ...updatedUser }
                : item,
            ),
          );
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess(
            shouldBeActive ? 'User activated successfully.' : 'User deactivated successfully.',
          );
        },
      });
  }

  /**
   * Deletes a user from platform.
   */
  deleteUser(user: BackendUser) {
    this.isLoading.set(true);
    this._adminUsersService
      .deleteUser(user.id)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.users.update((list) =>
            list.filter((item) => String(item.id) !== String(user.id)),
          );
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess('User deleted successfully.');
        },
      });
  }

  /**
   * Resolves a backend user role to AppUserType enum.
   */
  private _resolveUserRole(user: BackendUser): AppUserType {
    const roleId = Number(user.role?.id);
    if (!Number.isNaN(roleId) && roleId in AppUserType) {
      return roleId as AppUserType;
    }

    const roleName = user.role?.name?.trim().toLowerCase();
    if (roleName === 'admin') {
      return AppUserType.ADMIN;
    }
    if (roleName === 'tutor') {
      return AppUserType.TUTOR;
    }
    if (roleName === 'student') {
      return AppUserType.STUDENT;
    }
    return AppUserType.USER;
  }
}
