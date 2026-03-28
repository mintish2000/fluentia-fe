import { computed, Injectable, signal } from '@angular/core';
import { AppUserType } from '@shared/enums/user/app-user-type.enum';
import { AppUser } from '@shared/interfaces/user/app-user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _currentUser = signal<AppUser | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly fullNameSignal = computed(() => this._currentUser()?.name || '');
  readonly emailSignal = computed(() => this._currentUser()?.email || '');
  readonly phoneNumberSignal = computed(
    () => this._currentUser()?.phoneNumber || null,
  );
  readonly isAdminSignal = computed(
    () => this._currentUser()?.userRole === AppUserType.ADMIN,
  );
  readonly isTutorSignal = computed(
    () => this._currentUser()?.userRole === AppUserType.TUTOR,
  );
  readonly isStudentSignal = computed(() => {
    const role = this._currentUser()?.userRole;
    return role === AppUserType.STUDENT || role === AppUserType.USER;
  });
  readonly roleLabelSignal = computed(() => {
    const role = this._currentUser()?.userRole;

    if (role === AppUserType.ADMIN) {
      return 'Admin';
    }
    if (role === AppUserType.TUTOR) {
      return 'Tutor';
    }
    if (role === AppUserType.STUDENT) {
      return 'Student';
    }

    return 'User';
  });

  get fullName() {
    return this.fullNameSignal();
  }

  get email() {
    return this.emailSignal();
  }

  get phoneNumber() {
    return this.phoneNumberSignal();
  }

  get isAdmin() {
    return this.isAdminSignal();
  }

  get isTutor() {
    return this.isTutorSignal();
  }

  get isStudent() {
    return this.isStudentSignal();
  }

  get roleLabel() {
    return this.roleLabelSignal();
  }

  setCurrentUser(user: AppUser | null) {
    this._currentUser.set(user);
  }

  isAuthenticated() {
    return this._currentUser() !== null;
  }
}
