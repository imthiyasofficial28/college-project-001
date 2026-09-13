/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Authentication & Platform State Provider
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession, Institution, UserRole, Notification, SystemTelemetry } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, getLastSavedTimestamp, recordLocalMemorySync } from './api.ts';

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
  lastSavedAt: Date | null;
  syncStatus: 'synced' | 'saving' | 'idle';
  hasPermission: (permission: string) => boolean;
  login: (identifierOrEmail: string, password: string) => Promise<void>;
  personalizedEntry: (fullName: string, role: UserRole, password?: string) => Promise<void>;
  updateUserName: (fullName: string) => Promise<void>;
  updateFullProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchPerspective: (targetRole: UserRole) => Promise<void>;
  bootstrap: (payload: { institution: any; owner: any; template?: string }) => Promise<void>;
  updateInstitutionProfile: (data: Partial<Institution>) => Promise<Institution>;
  markDataSaved: () => Promise<void>;
  refreshState: () => Promise<void>;
  syncToLocalMemory: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  resetInstitution: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<SystemTelemetry | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    const raw = getLastSavedTimestamp();
    return raw ? new Date(raw) : new Date();
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'idle'>('synced');

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
    recordLocalMemorySync();
  }, [checkBootstrap, fetchUserData, fetchAuxiliary]);

  const syncToLocalMemory = useCallback(async () => {
    setSyncStatus('saving');
    try {
      const iso = recordLocalMemorySync();
      setLastSavedAt(new Date(iso));
      await refreshState();
      setTimeout(() => {
        setSyncStatus('synced');
      }, 350);
    } catch (err) {
      console.warn('[CUOIS Storage] Local sync warning:', err);
      setSyncStatus('synced');
    }
  }, [refreshState]);

  useEffect(() => {
    const handleDataSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ timestamp: string }>;
      setSyncStatus('saving');
      const ts = customEvent.detail?.timestamp ? new Date(customEvent.detail.timestamp) : new Date();
      setTimeout(() => {
        setLastSavedAt(ts);
        setSyncStatus('synced');
      }, 300);
    };

    window.addEventListener('cuois:data-saved', handleDataSaved);
    return () => {
      window.removeEventListener('cuois:data-saved', handleDataSaved);
    };
  }, []);

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

  const login = async (identifierOrEmail: string, password: string) => {
    const res = await api.login({ identifier: identifierOrEmail, password });
    setStoredToken(res.session.token);
    setUser(res.session.user);
    setSession(res.session);
    setRolePermissions(res.session.rolePermissions || []);
    await fetchAuxiliary();
  };

  const personalizedEntry = async (fullName: string, role: UserRole, password?: string) => {
    const res = await api.personalizedEntry({ fullName, role, password });
    setStoredToken(res.session.token);
    setUser(res.session.user);
    setSession(res.session);
    setRolePermissions(res.session.rolePermissions || []);
    await fetchAuxiliary();
  };

  const updateUserName = async (fullName: string) => {
    const res = await api.updateProfile({ fullName });
    setUser(res.user);
    if (session) {
      setSession({ ...session, user: res.user });
    }
    recordLocalMemorySync();
  };

  const updateFullProfile = async (data: Partial<User>) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    if (session) {
      setSession({ ...session, user: res.user });
    }
    recordLocalMemorySync();
  };

  const changePassword = async (data: { currentPassword?: string; newPassword: string }) => {
    await api.changePassword(data);
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

  const updateInstitutionProfile = async (data: Partial<Institution>): Promise<Institution> => {
    const updated = await api.updateInstitution(data);
    setInstitution(updated);
    recordLocalMemorySync();
    return updated;
  };

  const markDataSaved = async () => {
    await syncToLocalMemory();
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
        lastSavedAt,
        syncStatus,
        hasPermission,
        login,
        personalizedEntry,
        updateUserName,
        updateFullProfile,
        changePassword,
        logout,
        switchPerspective,
        bootstrap,
        updateInstitutionProfile,
        markDataSaved,
        refreshState,
        syncToLocalMemory,
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
