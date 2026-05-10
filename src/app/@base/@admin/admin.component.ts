import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { BaseComponent } from '@shared/components/base/base.component';
import { Question } from '@shared/interfaces/learning/learning.interface';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { GroupDialogComponent } from './dialogs/group-dialog/group-dialog.component';
import { PlacementQuestionDialogComponent } from './dialogs/placement-question-dialog/placement-question-dialog.component';
import { StudentDialogComponent } from './dialogs/student-dialog/student-dialog.component';
import { GroupDialogResult, StudentGroup } from './models/admin-group.models';
import { PlacementQuestionDialogResult } from './models/admin-placement.models';
import {
  AdminStudent,
  AdminStudentDialogResult,
  StudentMistakeDetail,
  StudentPaymentRecord,
} from './models/admin-student.models';
import { AdminGroupStoreService } from './services/admin-group-store.service';
import { AdminGroupService } from './services/admin-group.service';
import { AdminHubService } from './services/admin-hub.service';
import { AdminPlacementWorkspaceService } from './services/admin-placement-workspace.service';
import { AdminPlacementService } from './services/admin-placement.service';
import { AdminStudentStoreService } from './services/admin-student-store.service';

const STUDENT_LIST_PAGE_SIZE = 10;
const STUDENT_DETAIL_COLLAPSE_AT = 8;

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    FormsModule,
    ScrollRevealContainerDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslateModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AdminHubService,
    AdminStudentStoreService,
    AdminPlacementWorkspaceService,
    AdminPlacementService,
    AdminGroupStoreService,
    AdminGroupService,
  ],
})
export default class AdminComponent extends BaseComponent {
  private readonly _hub = inject(AdminHubService);
  private readonly _placement = inject(AdminPlacementService);
  private readonly _groups = inject(AdminGroupService);
  private readonly _dialog = inject(MatDialog);

  readonly displayName = this._hub.displayName;
  readonly students = this._hub.listedStudents;
  readonly selectedStudent = this._hub.selectedStudent;
  readonly activeStudentsCount = this._hub.activeStudentsCount;
  readonly inactiveStudentsCount = this._hub.inactiveStudentsCount;
  readonly totalPaidAmount = this._hub.totalPaidAmount;
  readonly lastSyncedAt = this._hub.lastSyncedAt;

  readonly groups = this._groups.groups;

  readonly placementQuiz = this._placement.placementQuiz;
  readonly placementQuestions = this._placement.placementQuestions;
  readonly placementExamDurationMinutes = this._placement.placementExamDurationMinutes;

  readonly isLoading = computed(
    () =>
      this._hub.isLoading() || this._placement.isLoading() || this._groups.isLoading(),
  );
  readonly activeSection = signal<'placement' | 'groups' | 'students'>('placement');

  readonly studentSearchQuery = signal('');
  readonly studentStatusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly studentPage = signal(1);
  readonly showAllMistakes = signal(false);
  readonly showAllPayments = signal(false);

  /** Group targeted by the shared row action menu (Student Groups cards). */
  readonly groupMenuContext = signal<StudentGroup | null>(null);

  readonly filteredStudents = computed(() => {
    const query = this.studentSearchQuery().trim().toLowerCase();
    const status = this.studentStatusFilter();
    return this.students().filter((student) => {
      if (status !== 'all' && student.status !== status) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase();
      return haystack.includes(query);
    });
  });

  readonly studentPageCount = computed(() => {
    const total = this.filteredStudents().length;
    return Math.max(1, Math.ceil(total / STUDENT_LIST_PAGE_SIZE));
  });

  readonly pagedStudents = computed(() => {
    const list = this.filteredStudents();
    const page = this.studentPage();
    const start = (page - 1) * STUDENT_LIST_PAGE_SIZE;
    return list.slice(start, start + STUDENT_LIST_PAGE_SIZE);
  });

  readonly visibleMistakes = computed((): StudentMistakeDetail[] => {
    const student = this.selectedStudent();
    if (!student) {
      return [];
    }
    const mistakes = student.placement.mistakes;
    if (this.showAllMistakes() || mistakes.length <= STUDENT_DETAIL_COLLAPSE_AT) {
      return mistakes;
    }
    return mistakes.slice(0, STUDENT_DETAIL_COLLAPSE_AT);
  });

  readonly visiblePayments = computed((): StudentPaymentRecord[] => {
    const student = this.selectedStudent();
    if (!student) {
      return [];
    }
    const payments = student.payments;
    if (this.showAllPayments() || payments.length <= STUDENT_DETAIL_COLLAPSE_AT) {
      return payments;
    }
    return payments.slice(0, STUDENT_DETAIL_COLLAPSE_AT);
  });

  private readonly _lazySectionSync = effect(() => {
    const section = this.activeSection();
    if (section === 'placement') {
      this._placement.ensurePlacementOverviewLoaded();
    } else if (section === 'groups') {
      this._groups.ensureGroupsLoaded();
    } else {
      this._hub.ensureUsersTabLoaded();
    }
  });

  private readonly _clampStudentPage = effect(() => {
    const maxPage = this.studentPageCount();
    if (this.studentPage() > maxPage) {
      this.studentPage.set(maxPage);
    }
  });

  private readonly _resetDetailExpand = effect(() => {
    this.selectedStudent();
    this.showAllMistakes.set(false);
    this.showAllPayments.set(false);
  });

  constructor() {
    super();
    afterNextRender(() => {
      this._hub.loadAdminOverview(true);
    });
  }

  /**
   * Resolves a group id to its display name for the student list and detail panels.
   */
  getGroupName(groupId: string | null | undefined): string {
    if (!groupId) {
      return '';
    }
    return this.groups().find((g) => g.id === groupId)?.name ?? groupId;
  }

  setStudentSearchQuery(value: string) {
    this.studentSearchQuery.set(value);
    this.studentPage.set(1);
  }

  setStudentStatusFilter(value: string) {
    this.studentStatusFilter.set(value as 'all' | 'active' | 'inactive');
    this.studentPage.set(1);
  }

  prevStudentPage() {
    this.studentPage.update((page) => Math.max(1, page - 1));
  }

  nextStudentPage() {
    this.studentPage.update((page) => Math.min(this.studentPageCount(), page + 1));
  }

  toggleAllMistakes() {
    this.showAllMistakes.update((value) => !value);
  }

  toggleAllPayments() {
    this.showAllPayments.update((value) => !value);
  }

  loadAdminOverview() {
    if (this.activeSection() === 'placement') {
      this._placement.refreshPlacementWorkspace();
      return;
    }
    if (this.activeSection() === 'groups') {
      this._groups.refreshGroups();
      return;
    }
    this._hub.loadAdminOverview(true);
  }

  setActiveSection(section: 'placement' | 'groups' | 'students') {
    this.activeSection.set(section);
  }

  refreshPlacementWorkspace() {
    this._placement.refreshPlacementWorkspace();
  }

  openCreateGroupDialog() {
    const dialogRef = this._dialog.open<GroupDialogComponent, { mode: 'create' }, GroupDialogResult>(
      GroupDialogComponent,
      {
        width: '560px',
        maxWidth: '96vw',
        data: { mode: 'create' },
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._groups.createGroup(result.draft);
    });
  }

  openEditGroupDialog(group: StudentGroup) {
    const dialogRef = this._dialog.open<
      GroupDialogComponent,
      { mode: 'edit'; group: StudentGroup },
      GroupDialogResult
    >(GroupDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      data: { mode: 'edit', group },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._groups.updateGroup(group.id, result.draft);
    });
  }

  /** Sets which group the shared mat-menu applies to before the menu opens. */
  setGroupMenuContext(group: StudentGroup) {
    this.groupMenuContext.set(group);
  }

  editGroupFromMenu() {
    const group = this.groupMenuContext();
    if (group) {
      this.openEditGroupDialog(group);
    }
  }

  deleteGroupFromMenu() {
    const group = this.groupMenuContext();
    if (group) {
      this.deleteGroup(group);
    }
  }

  deleteGroup(group: StudentGroup) {
    if (!confirm(`Delete group "${group.name}"? Students in this group will be unassigned.`)) {
      return;
    }
    this._groups.deleteGroup(group.id);
  }

  openCreatePlacementQuestionDialog() {
    const dialogRef = this._dialog.open<
      PlacementQuestionDialogComponent,
      { mode: 'create' },
      PlacementQuestionDialogResult
    >(PlacementQuestionDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._placement.createPlacementQuestion(result.draft);
    });
  }

  openEditPlacementQuestionDialog(question: Question) {
    const dialogRef = this._dialog.open<
      PlacementQuestionDialogComponent,
      { mode: 'edit'; question: Question },
      PlacementQuestionDialogResult
    >(PlacementQuestionDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: { mode: 'edit', question },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._placement.updatePlacementQuestion(question.id, result.draft);
    });
  }

  deletePlacementQuestion(questionId: string) {
    if (!confirm('Delete this placement question?')) {
      return;
    }
    this._placement.deletePlacementQuestion(questionId);
  }

  parsePlacementQuestionOptions(question: Question): string[] {
    return this._placement.parsePlacementQuestionOptions(question);
  }

  getPlacementQuestionType(question: Question): 'single' | 'multi' | 'text' {
    return this._placement.getPlacementQuestionType(question);
  }

  getPlacementCorrectAnswerLabel(question: Question): string {
    return this._placement.getPlacementCorrectAnswerLabel(question);
  }

  selectStudent(studentId: string) {
    this._hub.setSelectedStudent(studentId);
  }

  openCreateStudentDialog() {
    const dialogRef = this._dialog.open<
      StudentDialogComponent,
      { mode: 'create'; groups: StudentGroup[] },
      AdminStudentDialogResult
    >(StudentDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: { mode: 'create', groups: this.groups() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._hub.createStudent(result.draft);
    });
  }

  openEditStudentDialog(student: AdminStudent) {
    const dialogRef = this._dialog.open<
      StudentDialogComponent,
      { mode: 'edit'; student: AdminStudent; groups: StudentGroup[] },
      AdminStudentDialogResult
    >(StudentDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: { mode: 'edit', student, groups: this.groups() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this._hub.updateStudent(student.id, result.draft);
    });
  }

  toggleStudentStatus(student: AdminStudent) {
    this._hub.toggleStudentStatus(student);
  }

  deleteStudent(student: AdminStudent) {
    if (!confirm(`Delete ${student.firstName} ${student.lastName}?`)) {
      return;
    }
    this._hub.deleteStudent(student);
  }

  getStudentPaidAmount(student: AdminStudent): number {
    return student.payments
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }
}
