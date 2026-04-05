import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { BackendUser, Question } from '@shared/interfaces/learning/learning.interface';
import { AdminHubService } from './admin-hub.service';
import { AdminPlacementService } from './admin-placement.service';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    CoreModule,
    RouterLink,
    ReactiveFormsModule,
    ScrollRevealContainerDirective,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminHubService, AdminPlacementService],
})
export default class AdminComponent extends BaseComponent {
  private readonly _hub = inject(AdminHubService);
  private readonly _placement = inject(AdminPlacementService);

  readonly currentUser = this._hub.currentUser;
  readonly displayName = this._hub.displayName;
  readonly users = this._hub.users;
  readonly courses = this._hub.courses;
  readonly enrollments = this._hub.enrollments;
  readonly tutors = this._hub.tutors;
  readonly students = this._hub.students;
  readonly assignableTutors = this._hub.assignableTutors;
  readonly assignableStudents = this._hub.assignableStudents;
  readonly studentsWithoutCoursesCount = this._hub.studentsWithoutCoursesCount;
  readonly listedUsers = this._hub.listedUsers;
  readonly activeUsersCount = this._hub.activeUsersCount;
  readonly inactiveUsersCount = this._hub.inactiveUsersCount;
  readonly lastSyncedAt = this._hub.lastSyncedAt;
  readonly coursesForSelectedTutor = this._hub.coursesForSelectedTutor;
  readonly selectedTutorId = this._hub.selectedTutorId;
  readonly selectedStudentId = this._hub.selectedStudentId;
  readonly selectedCourseId = this._hub.selectedCourseId;
  readonly reassignEnrollmentId = this._hub.reassignEnrollmentId;
  readonly reassignTutorId = this._hub.reassignTutorId;
  readonly reassignCourseId = this._hub.reassignCourseId;
  readonly coursesForReassignTutor = this._hub.coursesForReassignTutor;
  readonly coursesCount = this._hub.coursesCount;
  readonly lessonsCount = this._hub.lessonsCount;
  readonly enrollmentsCount = this._hub.enrollmentsCount;
  readonly bookingsCount = this._hub.bookingsCount;
  readonly placementResults = this._placement.placementResults;
  readonly placementAttemptsCount = this._placement.placementAttemptsCount;
  readonly placementQuiz = this._placement.placementQuiz;
  readonly placementQuestions = this._placement.placementQuestions;
  readonly placementCourseId = this._placement.placementCourseId;
  readonly editingPlacementQuestionId = this._placement.editingPlacementQuestionId;
  readonly placementQuestionType = this._placement.placementQuestionType;
  readonly placementQuestionPrompt = this._placement.placementQuestionPrompt;
  readonly placementQuestionOptionA = this._placement.placementQuestionOptionA;
  readonly placementQuestionOptionB = this._placement.placementQuestionOptionB;
  readonly placementQuestionOptionC = this._placement.placementQuestionOptionC;
  readonly placementQuestionOptionD = this._placement.placementQuestionOptionD;
  readonly placementQuestionCorrectAnswer = this._placement.placementQuestionCorrectAnswer;
  readonly placementQuestionOptions = this._placement.placementQuestionOptions;
  readonly placementMultiCorrectAnswers = this._placement.placementMultiCorrectAnswers;
  readonly canCreatePlacementQuestion = this._placement.canCreatePlacementQuestion;
  readonly isLoading = computed(
    () => this._hub.isLoading() || this._placement.isLoading(),
  );
  readonly activeSection = signal<'operations' | 'placement' | 'users'>('operations');

  /** Loads hub data only for the active tab (avoids eager subscriptions for hidden tabs). */
  private readonly _lazySectionSync = effect(() => {
    const section = this.activeSection();
    if (section === 'operations') {
      this._hub.ensureOperationsDataLoaded();
    } else if (section === 'placement') {
      this._placement.ensurePlacementOverviewLoaded();
    } else if (section === 'users') {
      this._hub.ensureUsersTabLoaded();
    }
  });

  /**
   * Loads platform-wide analytics counters for admin.
   */
  loadAdminOverview() {
    this._hub.loadAdminOverview();
    if (this.activeSection() === 'placement') {
      this._placement.refreshPlacementWorkspace();
    }
  }

  /**
   * Assigns a student to a tutor by creating enrollment on a tutor-owned course.
   */
  assignStudentToTutor() {
    this._hub.assignStudentToTutor();
  }

  /**
   * Handles tutor selection changes and resets dependent course selection.
   */
  onTutorChanged() {
    this._hub.onTutorChanged();
  }

  /**
   * Handles tutor selection changes in reassignment flow.
   */
  onReassignTutorChanged() {
    this._hub.onReassignTutorChanged();
  }

  /**
   * Reassigns student enrollment to another tutor-owned course.
   */
  reassignStudentTutor() {
    this._hub.reassignStudentTutor();
  }

  /**
   * Reloads placement editor datasets.
   */
  refreshPlacementWorkspace() {
    this._placement.refreshPlacementWorkspace();
  }

  /**
   * Creates missing placement quiz for selected course.
   */
  createPlacementQuiz() {
    this._placement.createPlacementQuiz();
  }

  /**
   * Saves placement question create or update.
   */
  savePlacementQuestion() {
    this._placement.savePlacementQuestion();
  }

  /**
   * Handles placement question type change from editor.
   */
  onPlacementQuestionTypeChanged() {
    this._placement.onPlacementQuestionTypeChanged();
  }

  /**
   * Toggles multi-answer correct option.
   */
  togglePlacementMultiCorrectAnswer(option: string, checked: boolean) {
    this._placement.togglePlacementMultiCorrectAnswer(option, checked);
  }

  /**
   * Returns whether option is selected as correct multi-answer.
   */
  isPlacementMultiCorrectAnswerSelected(option: string): boolean {
    return this._placement.isPlacementMultiCorrectAnswerSelected(option);
  }

  /**
   * Loads placement question into editor.
   */
  editPlacementQuestion(question: Question) {
    this._placement.editPlacementQuestion(question);
  }

  /**
   * Deletes placement question.
   */
  deletePlacementQuestion(questionId: string) {
    if (!confirm('Delete this placement question?')) {
      return;
    }
    this._placement.deletePlacementQuestion(questionId);
  }

  /**
   * Resets placement question form.
   */
  resetPlacementQuestionForm() {
    this._placement.resetPlacementQuestionForm();
  }

  /**
   * Parses question options for placement list preview.
   */
  parsePlacementQuestionOptions(question: Question): string[] {
    return this._placement.parsePlacementQuestionOptions(question);
  }

  /**
   * Resolves placement question type label.
   */
  getPlacementQuestionType(question: Question): 'single' | 'multi' | 'text' {
    return this._placement.getPlacementQuestionType(question);
  }

  /**
   * Switches visible admin workspace section.
   */
  setActiveSection(section: 'operations' | 'placement' | 'users') {
    this.activeSection.set(section);
  }

  /**
   * Returns whether selected user is active.
   */
  isUserActive(user: BackendUser): boolean {
    return this._hub.isUserActive(user);
  }

  /**
   * Returns whether selected user is manageable by current admin.
   */
  canManageUser(user: BackendUser): boolean {
    return this._hub.canManageUser(user);
  }

  /**
   * Returns readable user status label.
   */
  getUserStatusLabel(user: BackendUser): string {
    return this._hub.getUserStatusLabel(user);
  }

  /**
   * Returns consistent full name fallback for users.
   */
  getUserName(user?: BackendUser | null): string {
    if (!user) {
      return 'Unknown User';
    }
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown User';
  }

  /**
   * Activates or deactivates platform user.
   */
  setUserActiveState(user: BackendUser, shouldBeActive: boolean) {
    if (!shouldBeActive && !confirm(`Deactivate ${this.getUserName(user)}?`)) {
      return;
    }
    this._hub.setUserActiveState(user, shouldBeActive);
  }

  /**
   * Deletes platform user.
   */
  deleteUser(user: BackendUser) {
    if (
      !confirm(
        `Delete ${this.getUserName(user)} (${user.email || '-'})?\nThis action cannot be undone.`,
      )
    ) {
      return;
    }
    this._hub.deleteUser(user);
  }
}
