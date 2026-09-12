/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Authentication & Platform State Provider
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession, Institution, UserRole, Notification, SystemTelemetry } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from './api.ts';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  institution: Institution | null;
  isBootstrapped: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  rolePermissions: string[];
  notifications: Notification[];
  unreadNotifsCount: number;
  liveTelemetry: SystemTelemetry | null;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPerspective: (targetRole: UserRole) => Promise<void>;
  bootstrap: (payload: { institution: any; owner: any; template?: string }) => Promise<void>;
  refreshState: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  resetInstitution: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<SystemTelemetry | null>(null);

  const activeRole: UserRole = user?.role || 'STUDENT';

  const checkBootstrap = useCallback(async () => {
    try {
      const res = await api.getBootstrapStatus();
      setIsBootstrapped(res.isConfigured);
      setInstitution(res.institution);
      return res.isConfigured;
    } catch (err) {
      console.error('[CUOIS Auth] Error checking bootstrap status:', err);
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSession(null);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      setRolePermissions(res.rolePermissions || []);
      setSession({
        token: res.sessionToken,
        user: res.user,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        rolePermissions: res.rolePermissions || [],
      });
    } catch {
      setStoredToken(null);
      setUser(null);
      setSession(null);
    }
  }, []);

  const fetchAuxiliary = useCallback(async () => {
    try {
      const [notifs, telemetry] = await Promise.allSettled([
        api.getNotifications(),
        api.getTelemetry(),
      ]);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value);
      if (telemetry.status === 'fulfilled') setLiveTelemetry(telemetry.value);
    } catch {
      // ignore
    }
  }, []);

  const refreshState = useCallback(async () => {
    await checkBootstrap();
    await fetchUserData();
    await fetchAuxiliary();
  }, [checkBootstrap, fetchUserData, fetchAuxiliary]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      await checkBootstrap();
      await fetchUserData();
      await fetchAuxiliary();
      if (isMounted) setIsLoading(false);
    })();

    // Subscribe to SSE
    const unsubscribe = api.subscribeRealtimeEvents((event) => {
      if (event.type === 'NEW_ANNOUNCEMENT' || event.type === 'ATTENDANCE_RECORDED' || event.type === 'SECURITY_INCIDENT_LOGGED') {
        fetchAuxiliary();
      }
      if (event.type === 'INSTITUTION_RESET') {
        setStoredToken(null);
        setUser(null);
        setIsBootstrapped(false);
        setInstitution(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [checkBootstrap, fetchUserData, fetchAuxiliary]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.session.token);
    setUser(res.session.user);
    setSession(res.session);
    setRolePermissions(res.session.rolePermissions || []);
    await fetchAuxiliary();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setSession(null);
  };

  const switchPerspective = async (targetRole: UserRole) => {
    const res = await api.switchRole(targetRole);
    setUser(res.user);
    setRolePermissions(res.rolePermissions || []);
  };

  const bootstrap = async (payload: { institution: any; owner: any; template?: string }) => {
    const res = await api.initializeInstitution(payload);
    setInstitution(res.institution);
    setIsBootstrapped(true);
    setStoredToken(res.session.token);
    setUser(res.session.user);
    setSession(res.session);
    setRolePermissions(res.session.rolePermissions || []);
    await fetchAuxiliary();
  };

  const resetInstitution = async () => {
    await api.resetInstitution();
    setStoredToken(null);
    setUser(null);
    setSession(null);
    setIsBootstrapped(false);
    setInstitution(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SYSTEM_OWNER') return true;
    if (rolePermissions.includes('*')) return true;
    if (rolePermissions.includes(permission)) return true;
    const alt = permission.includes('.') ? permission.replace('.', ':') : permission.replace(':', '.');
    return rolePermissions.includes(alt);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        institution,
        isBootstrapped,
        isLoading,
        activeRole,
        rolePermissions,
        notifications,
        unreadNotifsCount,
        liveTelemetry,
        hasPermission,
        login,
        logout,
        switchPerspective,
        bootstrap,
        refreshState,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetInstitution,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
