export interface DashboardMeta {
  title: string;
  subtitle: string;
  generatedAt: string;
}

export interface DashboardKpis {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalGroups: number;
  averagePlacementScore: number;
  expectedMonthlyRevenueUsd: number;
}

export interface DashboardStudentsByGroupItem {
  groupId: string;
  groupName: string;
  count: number;
  color: string;
}

export interface DashboardStudentsByStatusItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface DashboardPlacementBand {
  label: string;
  count: number;
}

export interface DashboardRevenueMonth {
  month: string;
  label: string;
  amountUsd: number;
}

/** API payload: `GET /admin/dashboard` */
export interface DashboardResponse {
  meta: DashboardMeta;
  kpis: DashboardKpis;
  studentsByGroup: DashboardStudentsByGroupItem[];
  studentsByStatus: DashboardStudentsByStatusItem[];
  placementScoreDistribution: DashboardPlacementBand[];
  revenueByMonth: DashboardRevenueMonth[];
}
