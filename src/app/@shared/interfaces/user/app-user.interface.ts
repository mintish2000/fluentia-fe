import { AppUserType } from '@shared/enums/user/app-user-type.enum';

export interface AppUser {
  id: number | string;
  email: string | null;
  name: string;
  userRole: AppUserType;
  role: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string;
  profilePicture?: string;
}
