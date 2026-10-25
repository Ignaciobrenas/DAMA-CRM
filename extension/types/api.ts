// Shared API & Timer contracts for the DAMA-CRM Browser Extension (Chrome & Firefox)

export interface ActiveTimerState {
  id?: string;
  taskId: string;
  taskKey: string;
  taskTitle: string;
  projectId?: string | null;
  projectName?: string | null;
  reason?: string | null;
  notes?: string | null;
  isBillable?: boolean;
  startTime: number; // UTC ms of current running segment (lastResumedAt or clockIn)
  clockInIso?: string;
  accumulatedSeconds?: number; // Seconds accumulated prior to current running segment
  elapsed: number; // Frozen ms when paused
  isPaused: boolean;
}

export interface HarvestTimeRecord {
  id: string;
  clockIn: string;
  clockOut?: string | null;
  lastResumedAt?: string | null;
  pausedAt?: string | null;
  accumulatedSeconds?: number;
  elapsedSeconds?: number;
  durationMinutes?: number;
  isPaused?: boolean;
  type?: string;
  reason?: string | null;
  notes?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  isBillable?: boolean;
}

export interface HarvestClockStatus {
  isClockedIn: boolean;
  activeRecord: HarvestTimeRecord | null;
  todayMinutes: number;
  todaySeconds?: number;
  todayRecordCount?: number;
  todayRecords?: HarvestTimeRecord[];
  serverTimestamp?: string;
}

export interface TrackableProject {
  id: string;
  name: string;
  key?: string;
  source: string;
}

export interface TrackableTask {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  source: string;
}

export interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export interface Note {
  id: string;
  title: string | null;
  content: string;
  color: string | null;
  pinned: boolean;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role?: string;
  tenantId?: string;
}

export interface LoginSuccess {
  user: AuthUser;
  token: string;
}
export interface LoginTwoFactorRequired {
  requires2FA: true;
  method?: string;
  pendingToken: string;
  user?: AuthUser;
}
export interface LoginTwoFactorSetup {
  requires2FASetup: true;
  tempToken?: string;
  user?: AuthUser;
}
export type LoginResponse =
  | LoginSuccess
  | LoginTwoFactorRequired
  | LoginTwoFactorSetup;
