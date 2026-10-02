// API response shapes as actually returned by the dama-agile-planner Express server.
// NOTE: shared/types.ts has an older/aspirational `Notification` shape
// (entityType/entityId) that does NOT match the real API — the real endpoint
// returns the Prisma model below with `actionUrl`. Use these types instead.

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
}

// POST /api/auth/login can return one of these shapes.
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
