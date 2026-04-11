export interface StudentGroup {
  id: string;
  name: string;
  description: string;
  link: string;
}

/** Response shape for {@code GET /admin/groups}. */
export interface AdminGroupsPayload {
  groups: StudentGroup[];
}

export interface GroupDraft {
  name: string;
  description: string;
  link: string;
}

export interface GroupDialogData {
  mode: 'create' | 'edit';
  group?: StudentGroup;
}

export interface GroupDialogResult {
  draft: GroupDraft;
}
