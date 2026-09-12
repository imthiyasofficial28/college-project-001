/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Enterprise Authentication, Session Management & RBAC Enforcement
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, verifyPassword } from './db.ts';
import { User, UserRole, AuthSession } from '../src/types/index.ts';

// In-memory active sessions map: token -> session
interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent?: string;
}

const sessions = new Map<string, SessionRecord>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(user: User, ipAddress: string, userAgent?: string): AuthSession {
  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  const record: SessionRecord = {
    token,
    userId: user.id,
    role: user.role,
    createdAt: now,
    expiresAt,
    ipAddress,
    userAgent,
  };

  sessions.set(token, record);

  // Lookup role permissions
  const roles = db.getRoles();
  const matchedRole = roles.find((r) => r.code === user.role);
  const rolePermissions = user.role === 'SYSTEM_OWNER' ? ['*'] : (matchedRole?.permissions || []);

  return {
    token,
    user,
    expiresAt: new Date(expiresAt).toISOString(),
    rolePermissions,
  };
}

export function invalidateSession(token: string): boolean {
  return sessions.delete(token);
}

export function invalidateAllUserSessions(userId: string): number {
  let count = 0;
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
      count++;
    }
  }
  return count;
}

export function getActiveSessionsCount(): number {
  const now = Date.now();
  // prune expired
  for (const [token, s] of sessions.entries()) {
    if (s.expiresAt < now) {
      sessions.delete(token);
    }
  }
  return Math.max(sessions.size, 1);
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
  rolePermissions?: string[];
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = sessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    return;
  }

  const userWithSecrets = db.findUserById(session.userId);
  if (!userWithSecrets || !userWithSecrets.isActive) {
    sessions.delete(token);
    res.status(403).json({ error: 'User account is deactivated or unavailable.' });
    return;
  }

  const { passwordHash: _, salt: __, ...user } = userWithSecrets;

  const roles = db.getRoles();
  const matchedRole = roles.find((r) => r.code === user.role);
  const rolePermissions = user.role === 'SYSTEM_OWNER' ? ['*'] : (matchedRole?.permissions || []);

  req.user = user;
  req.sessionToken = token;
  req.rolePermissions = rolePermissions;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    // SYSTEM_OWNER always passes
    if (req.user.role === 'SYSTEM_OWNER' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }
    res.status(403).json({
      error: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
    });
  };
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.user.role === 'SYSTEM_OWNER') {
      next();
      return;
    }
    const perms = req.rolePermissions || [];
    if (perms.includes('*') || perms.includes(permissionCode)) {
      next();
      return;
    }
    res.status(403).json({
      error: `Forbidden. Missing required permission '${permissionCode}'.`,
    });
  };
}
