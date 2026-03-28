import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { Booking, Course, Lesson } from '@shared/interfaces/learning/learning.interface';
import { TutorHubService } from './tutor-hub.service';

@Component({
  selector: 'app-tutor',
  imports: [CommonModule, CoreModule, ReactiveFormsModule],
  templateUrl: './tutor.component.html',
  styleUrl: './tutor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TutorHubService],
})
export default class TutorComponent extends BaseComponent {
  private readonly _hub = inject(TutorHubService);

  readonly currentUser = this._hub.currentUser;
  readonly displayName = this._hub.displayName;
  readonly editingCourseId = this._hub.editingCourseId;
  readonly courseTitle = this._hub.courseTitle;
  readonly courseLevel = this._hub.courseLevel;
  readonly coursePrice = this._hub.coursePrice;
  readonly courseDescription = this._hub.courseDescription;
  readonly editingLessonId = this._hub.editingLessonId;
  readonly lessonCourseId = this._hub.lessonCourseId;
  readonly lessonTitle = this._hub.lessonTitle;
  readonly lessonOrder = this._hub.lessonOrder;
  readonly lessonVideoUrl = this._hub.lessonVideoUrl;
  readonly lessonContent = this._hub.lessonContent;
  readonly tutorCourses = this._hub.tutorCourses;
  readonly tutorLessons = this._hub.tutorLessons;
  readonly tutorStudents = this._hub.tutorStudents;
  readonly tutorBookingStudents = this._hub.tutorBookingStudents;
  readonly tutorBookings = this._hub.tutorBookings;
  readonly bookingStudentId = this._hub.bookingStudentId;
  readonly bookingDate = this._hub.bookingDate;
  readonly bookingStartTime = this._hub.bookingStartTime;
  readonly bookingMeetingProvider = this._hub.bookingMeetingProvider;
  readonly bookingMeetingLink = this._hub.bookingMeetingLink;
  readonly managedCoursesCount = this._hub.managedCoursesCount;
  readonly managedLessonsCount = this._hub.managedLessonsCount;
  readonly tutorBookingsCount = this._hub.tutorBookingsCount;
  readonly tutorAvailabilitiesCount = this._hub.tutorAvailabilitiesCount;
  readonly tutorStudentsCount = this._hub.tutorStudentsCount;
  readonly lastSyncedAt = this._hub.lastSyncedAt;
  readonly isLoading = this._hub.isLoading;
  readonly activeSection = signal<'courses' | 'lessons' | 'students' | 'bookings'>('courses');

  /** Subscribes to API data only for the visible tutor tab (and shared prerequisites like courses). */
  private readonly _lazyTutorSectionSync = effect(() => {
    this._hub.ensureTutorSectionData(this.activeSection());
  });

  /**
   * Loads tutor dashboard counters from available APIs.
   */
  loadTutorOverview() {
    this._hub.loadTutorOverview();
  }

  /**
   * Persists course create or edit operation for tutor-owned courses.
   */
  saveCourse() {
    this._hub.saveCourse();
  }

  /**
   * Loads course values into the form for editing.
   */
  editCourse(course: Course) {
    this._hub.editCourse(course);
  }

  /**
   * Clears editing state and resets course form controls.
   */
  resetCourseForm() {
    this._hub.resetCourseForm();
  }

  /**
   * Removes selected tutor course.
   */
  deleteCourse(courseId: string) {
    if (!confirm('Delete this course?')) {
      return;
    }
    this._hub.deleteCourse(courseId);
  }

  /**
   * Persists lesson create or edit operation for tutor-owned courses.
   */
  saveLesson() {
    this._hub.saveLesson();
  }

  /**
   * Loads lesson values into the form for editing.
   */
  editLesson(lesson: Lesson) {
    this._hub.editLesson(lesson);
  }

  /**
   * Clears lesson editing state and resets lesson form controls.
   */
  resetLessonForm() {
    this._hub.resetLessonForm();
  }

  /**
   * Removes selected lesson.
   */
  deleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) {
      return;
    }
    this._hub.deleteLesson(lessonId);
  }

  /**
   * Updates student grading/progress for a selected enrollment.
   */
  updateEnrollmentGrade(
    enrollmentId: string,
    progressValue: string,
    statusValue: string,
  ) {
    this._hub.updateEnrollmentGrade(enrollmentId, progressValue, statusValue);
  }

  /**
   * Reassigns a student enrollment to another tutor course.
   */
  reassignEnrollmentCourse(enrollmentId: string, targetCourseId: string) {
    this._hub.reassignEnrollmentCourse(enrollmentId, targetCourseId);
  }

  /**
   * Updates booking status (accept/reject/completed).
   */
  updateBookingStatus(bookingId: string, status: string) {
    this._hub.updateBookingStatus(bookingId, status);
  }

  /**
   * Creates one-to-one tutor appointment for selected student.
   */
  createTutorBooking() {
    this._hub.createTutorBooking();
  }

  /**
   * Resets tutor appointment form controls.
   */
  resetTutorBookingForm() {
    this._hub.resetTutorBookingForm();
  }

  /**
   * Changes the currently visible tutor management section.
   */
  setActiveSection(section: 'courses' | 'lessons' | 'students' | 'bookings') {
    this.activeSection.set(section);
  }

  /**
   * Returns normalized booking status label.
   */
  getBookingStatusLabel(booking: Booking): string {
    return (booking.status || 'pending').toLowerCase();
  }

  /**
   * Returns whether booking can be accepted.
   */
  canAcceptBooking(booking: Booking): boolean {
    const status = this.getBookingStatusLabel(booking);
    return status === 'pending' || status === 'confirmed';
  }

  /**
   * Returns whether booking can be rejected.
   */
  canRejectBooking(booking: Booking): boolean {
    const status = this.getBookingStatusLabel(booking);
    return status === 'pending' || status === 'confirmed' || status === 'accepted';
  }

  /**
   * Returns whether booking can be completed.
   */
  canCompleteBooking(booking: Booking): boolean {
    const status = this.getBookingStatusLabel(booking);
    return status === 'accepted' || status === 'confirmed';
  }
}
