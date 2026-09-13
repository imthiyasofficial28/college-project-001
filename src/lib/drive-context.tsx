import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getDriveAccessToken,
  setDriveAccessToken,
  uploadSnapshotToDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  deleteBackupFromDrive,
  isInsufficientScopesError,
  isUserCancelledAuthError,
  saveMasterDatabaseToDrive,
  getMasterDatabaseFromDrive,
  getMasterDatabaseInfo,
  DriveBackupFile,
  DriveUser,
} from './google-drive.ts';
import { api } from './api.ts';
import { useAuth } from './auth-context.tsx';

interface DriveContextType {
  driveUser: DriveUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  isAutoSyncing: boolean;
  autoSyncEnabled: boolean;
  isLoadingBackups: boolean;
  driveBackups: DriveBackupFile[];
  masterDriveFile: DriveBackupFile | null;
  lastDriveSyncAt: Date | null;
  lastSyncSuccessMessage: string | null;
  syncError: string | null;
  hasScopeError: boolean;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => Promise<void>;
  syncAllToDrive: (customNote?: string) => Promise<DriveBackupFile>;
  saveToMasterDrive: (customNote?: string) => Promise<{ masterFile: DriveBackupFile; backupFile: DriveBackupFile }>;
  pullFromMasterDrive: () => Promise<void>;
  toggleAutoSync: (enabled: boolean) => void;
  refreshBackups: () => Promise<void>;
  restoreFromDrive: (backup: DriveBackupFile) => Promise<void>;
  deleteFromDrive: (fileId: string) => Promise<void>;
  reauthorizeDrive: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

const LAST_DRIVE_SYNC_KEY = 'cuois_last_drive_sync_iso';
const DRIVE_AUTO_SYNC_KEY = 'cuois_drive_auto_sync_enabled';

export const DriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { institution, refreshState } = useAuth();

  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [masterDriveFile, setMasterDriveFile] = useState<DriveBackupFile | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasScopeError, setHasScopeError] = useState(false);
  const [lastSyncSuccessMessage, setLastSyncSuccessMessage] = useState<string | null>(null);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DRIVE_AUTO_SYNC_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [lastDriveSyncAt, setLastDriveSyncAt] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem(LAST_DRIVE_SYNC_KEY);
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  const isConnected = !!driveUser && !!getDriveAccessToken() && !hasScopeError;

  const toggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    try {
      localStorage.setItem(DRIVE_AUTO_SYNC_KEY, String(enabled));
    } catch {
      // ignore
    }
  };

  // Load backups and master file status when authenticated
  const refreshBackups = useCallback(async () => {
    const token = getDriveAccessToken();
    if (!token) return;
    setIsLoadingBackups(true);
    try {
      const [files, master] = await Promise.all([
        listDriveBackups(token),
        getMasterDatabaseInfo(token),
      ]);
      setDriveBackups(files);
      setMasterDriveFile(master);
      setSyncError(null);
      setHasScopeError(false);
    } catch (err: any) {
      console.error('[DriveContext] Error fetching backups:', err);
      if (isInsufficientScopesError(err)) {
        setHasScopeError(true);
        setDriveAccessToken(null);
        setSyncError(
          'Google Drive permissions required: Your current authorization does not have Drive access. Please click "Authorize Google Drive" below to grant file permissions.'
        );
      } else {
        setSyncError(err.message || 'Failed to list Google Drive backups');
      }
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setDriveUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        refreshBackups();
      },
      () => {
        setDriveUser(null);
        setDriveBackups([]);
        setMasterDriveFile(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [refreshBackups]);

  // Connect via popup
  const connectDrive = async () => {
    setIsConnecting(true);
    setSyncError(null);
    setHasScopeError(false);
    try {
      const { user } = await signInWithGoogleDrive();
      setDriveUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
      await refreshBackups();
    } catch (err: any) {
      if (isUserCancelledAuthError(err)) {
        // User voluntarily dismissed the Google authentication popup
        return;
      }
      console.error('[DriveContext] Connection error:', err);
      if (isInsufficientScopesError(err)) {
        setHasScopeError(true);
        setDriveAccessToken(null);
        setSyncError(
          'Google Drive permissions required: Your current authorization does not have Drive access. Please click "Authorize Google Drive" below to grant file permissions.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setSyncError('Browser popup blocked. Please allow popups for this site to connect Google Drive.');
      } else {
        setSyncError(err.message || 'Failed to connect to Google Drive');
      }
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Reauthorize is an alias for connectDrive to re-trigger consent popup
  const reauthorizeDrive = async () => {
    return connectDrive();
  };

  // Disconnect
  const disconnectDrive = async () => {
    try {
      await signOutGoogleDrive();
      setDriveUser(null);
      setDriveBackups([]);
      setMasterDriveFile(null);
      setSyncError(null);
      setHasScopeError(false);
    } catch (err: any) {
      console.error('[DriveContext] Disconnect error:', err);
    }
  };

  // Push Local State to Master Google Drive File (accessible across all devices)
  const saveToMasterDrive = async (customNote?: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Please sign in and connect Google Drive before syncing.');
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const rawData = await api.exportData();
      const result = await saveMasterDatabaseToDrive(token, rawData, {
        institutionCode: institution?.code || 'CUOIS',
        customNote: customNote || 'Master database updated from live campus state',
      });

      setMasterDriveFile(result.masterFile);
      const now = new Date();
      setLastDriveSyncAt(now);
      try {
        localStorage.setItem(LAST_DRIVE_SYNC_KEY, now.toISOString());
      } catch {
        // ignore
      }

      setLastSyncSuccessMessage(`Saved to Google Drive Master (${now.toLocaleTimeString()})`);
      await refreshBackups();
      return result;
    } catch (err: any) {
      console.error('[DriveContext] Master sync error:', err);
      setSyncError(err.message || 'Failed to sync master database to Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull Master Database from Google Drive onto This Device
  const pullFromMasterDrive = async () => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Please sign in and connect Google Drive before pulling master data.');
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const { data, file } = await getMasterDatabaseFromDrive(token);
      await api.syncFromDrive(data);
      await refreshState();

      setMasterDriveFile(file);
      const now = new Date();
      setLastDriveSyncAt(now);
      try {
        localStorage.setItem(LAST_DRIVE_SYNC_KEY, now.toISOString());
      } catch {
        // ignore
      }

      setLastSyncSuccessMessage(`Loaded Master Campus Database from Google Drive!`);
      await refreshBackups();
    } catch (err: any) {
      console.error('[DriveContext] Pull master error:', err);
      setSyncError(err.message || 'Failed to pull master database from Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync All Data to Drive (creates an explicit snapshot backup file)
  const syncAllToDrive = async (customNote?: string): Promise<DriveBackupFile> => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Please sign in and connect Google Drive before syncing.');
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const rawData = await api.exportData();

      // Save both as master file and timestamped backup
      const { masterFile, backupFile } = await saveMasterDatabaseToDrive(token, rawData, {
        institutionCode: institution?.code || 'CUOIS',
        customNote,
      });

      setMasterDriveFile(masterFile);
      const now = new Date();
      setLastDriveSyncAt(now);
      try {
        localStorage.setItem(LAST_DRIVE_SYNC_KEY, now.toISOString());
      } catch {
        // ignore
      }

      setLastSyncSuccessMessage(`Snapshot & Master backed up to Google Drive (${now.toLocaleTimeString()})`);
      await refreshBackups();
      return backupFile;
    } catch (err: any) {
      console.error('[DriveContext] Backup sync error:', err);
      setSyncError(err.message || 'Failed to sync campus data to Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore snapshot from Google Drive (Invoked after user explicit confirmation)
  const restoreFromDrive = async (backup: DriveBackupFile): Promise<void> => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive access token missing. Please sign in again.');
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const snapshotData = await downloadBackupFromDrive(token, backup.id);
      await api.syncFromDrive(snapshotData);
      await refreshState();
      setLastSyncSuccessMessage(`Restored snapshot "${backup.name}" from Google Drive!`);
    } catch (err: any) {
      console.error('[DriveContext] Restore error:', err);
      setSyncError(err.message || 'Failed to restore snapshot from Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete a backup from Drive
  const deleteFromDrive = async (fileId: string): Promise<void> => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive access token missing.');
    }

    try {
      await deleteBackupFromDrive(token, fileId);
      setDriveBackups((prev) => prev.filter((b) => b.id !== fileId));
    } catch (err: any) {
      console.error('[DriveContext] Delete error:', err);
      setSyncError(err.message || 'Failed to delete backup from Google Drive');
      throw err;
    }
  };

  // Automatic Background Drive Sync:
  // Whenever the System Owner or user saves any record, debounced auto-sync mirrors to Google Drive
  useEffect(() => {
    if (!isConnected || !autoSyncEnabled) return;

    let timeoutId: any = null;
    const handleDataSaved = () => {
      clearTimeout(timeoutId);
      setIsAutoSyncing(true);
      timeoutId = setTimeout(async () => {
        try {
          const token = getDriveAccessToken();
          if (!token) return;
          const rawData = await api.exportData();
          const { masterFile } = await saveMasterDatabaseToDrive(token, rawData, {
            institutionCode: institution?.code || 'CUOIS',
            customNote: 'Automatic auto-sync on campus record save',
          });
          setMasterDriveFile(masterFile);
          const now = new Date();
          setLastDriveSyncAt(now);
          try {
            localStorage.setItem(LAST_DRIVE_SYNC_KEY, now.toISOString());
          } catch {
            // ignore
          }
          setLastSyncSuccessMessage(`Auto-saved to Google Drive at ${now.toLocaleTimeString()}`);
        } catch (err: any) {
          console.warn('[Drive Auto-Sync] Auto-save skipped:', err?.message || err);
        } finally {
          setIsAutoSyncing(false);
        }
      }, 2500);
    };

    window.addEventListener('cuois:data-saved', handleDataSaved);
    return () => {
      window.removeEventListener('cuois:data-saved', handleDataSaved);
      clearTimeout(timeoutId);
    };
  }, [isConnected, autoSyncEnabled, institution]);

  return (
    <DriveContext.Provider
      value={{
        driveUser,
        isConnected,
        isConnecting,
        isSyncing,
        isAutoSyncing,
        autoSyncEnabled,
        isLoadingBackups,
        driveBackups,
        masterDriveFile,
        lastDriveSyncAt,
        lastSyncSuccessMessage,
        syncError,
        hasScopeError,
        connectDrive,
        disconnectDrive,
        syncAllToDrive,
        saveToMasterDrive,
        pullFromMasterDrive,
        toggleAutoSync,
        refreshBackups,
        restoreFromDrive,
        deleteFromDrive,
        reauthorizeDrive,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
};
