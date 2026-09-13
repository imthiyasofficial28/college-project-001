import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Configure Google Auth Provider with all requested Drive scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.setCustomParameters({
  prompt: 'consent',
});

// Token handling (keeps in-memory with sessionStorage backup for browser navigation/refresh)
const DRIVE_TOKEN_SESSION_KEY = 'cuois_drive_oauth_token';

let inMemoryAccessToken: string | null = (() => {
  try {
    return sessionStorage.getItem(DRIVE_TOKEN_SESSION_KEY);
  } catch {
    return null;
  }
})();
let isSigningIn = false;

export const MASTER_DATABASE_FILE_NAME = 'cuois_master_campus_database.json';

export function isInsufficientScopesError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    err.name === 'InsufficientScopesError' ||
    msg.includes('insufficient authentication scopes') ||
    msg.includes('insufficient permission') ||
    msg.includes('permission_denied') ||
    msg.includes('access_denied')
  );
}

export function isUserCancelledAuthError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = (err.message || String(err)).toLowerCase();
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled' ||
    msg.includes('popup-closed-by-user') ||
    msg.includes('cancelled-popup-request') ||
    msg.includes('user cancelled') ||
    msg.includes('closed by user')
  );
}

export function isUnauthorizedDomainError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = (err.message || String(err)).toLowerCase();
  return (
    code === 'auth/unauthorized-domain' ||
    msg.includes('auth/unauthorized-domain') ||
    msg.includes('unauthorized-domain') ||
    msg.includes('unauthorized domain')
  );
}

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  description?: string;
}

export interface DriveUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export const getDriveAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    const cached = sessionStorage.getItem(DRIVE_TOKEN_SESSION_KEY);
    if (cached) {
      inMemoryAccessToken = cached;
      return cached;
    }
  } catch {
    // ignore
  }
  return null;
};

export const setDriveAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(DRIVE_TOKEN_SESSION_KEY, token);
    } else {
      sessionStorage.removeItem(DRIVE_TOKEN_SESSION_KEY);
    }
  } catch {
    // ignore
  }
};

// Initialize auth state listener
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(firebaseAuth, async (user: User | null) => {
    if (user && inMemoryAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, inMemoryAccessToken);
    } else if (!isSigningIn) {
      inMemoryAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Drive OAuth access token from authorization response.');
    }

    setDriveAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    if (!isUserCancelledAuthError(error)) {
      console.error('[CUOIS Drive Auth] Sign-in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out from Google
export const signOutGoogleDrive = async (): Promise<void> => {
  await signOut(firebaseAuth);
  setDriveAccessToken(null);
};

// --- GOOGLE DRIVE REST API OPERATIONS ---

const DRIVE_FOLDER_NAME = 'CUOIS Campus Data Vault';

// Locate or create the central institutional backup folder
export async function getOrCreateDriveVaultFolder(accessToken: string): Promise<string> {
  // Check if folder exists
  const query = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    const errMessage = errData.error?.message || `Failed to query Google Drive folder: ${searchRes.statusText}`;
    const error = new Error(errMessage);
    if (searchRes.status === 401 || searchRes.status === 403 || errMessage.toLowerCase().includes('insufficient')) {
      error.name = 'InsufficientScopesError';
    }
    throw error;
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Central storage vault for Campus Unified Operations & Intelligence System backups and datasets.',
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    const errMessage = errData.error?.message || `Failed to create Google Drive vault folder: ${createRes.statusText}`;
    const error = new Error(errMessage);
    if (createRes.status === 401 || createRes.status === 403 || errMessage.toLowerCase().includes('insufficient')) {
      error.name = 'InsufficientScopesError';
    }
    throw error;
  }

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

// Upload a full institutional snapshot to Google Drive
export async function uploadSnapshotToDrive(
  accessToken: string,
  snapshotData: any,
  options?: {
    institutionCode?: string;
    customNote?: string;
  }
): Promise<DriveBackupFile> {
  const folderId = await getOrCreateDriveVaultFolder(accessToken);
  const code = (options?.institutionCode || 'CAMPUS').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `cuois_backup_${code}_${timestamp}.json`;

  const serializedData = JSON.stringify(snapshotData, null, 2);
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `CUOIS Institutional Dataset Snapshot. Generated: ${new Date().toLocaleString()}. ${
      options?.customNote ? `Note: ${options.customNote}` : ''
    }`,
    properties: {
      app: 'CUOIS',
      type: 'full_database_snapshot',
      institutionCode: code,
      generatedAt: new Date().toISOString(),
    },
  };

  const boundary = '-------cuois-multipart-boundary-987654321';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    serializedData +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    const errMessage = errData.error?.message || `Failed to upload backup to Google Drive: ${uploadRes.statusText}`;
    const error = new Error(errMessage);
    if (uploadRes.status === 401 || uploadRes.status === 403 || errMessage.toLowerCase().includes('insufficient')) {
      error.name = 'InsufficientScopesError';
    }
    throw error;
  }

  const uploadedFile: DriveBackupFile = await uploadRes.json();
  return uploadedFile;
}

// List all CUOIS backups from Google Drive
export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  try {
    const folderId = await getOrCreateDriveVaultFolder(accessToken);
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=createdTime desc&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&pageSize=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMessage = err.error?.message || 'Failed to list files from Google Drive';
      const error = new Error(errMessage);
      if (res.status === 401 || res.status === 403 || errMessage.toLowerCase().includes('insufficient')) {
        error.name = 'InsufficientScopesError';
      }
      throw error;
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('[CUOIS Drive] Error listing backups:', err);
    throw err;
  }
}

// Download and parse a snapshot backup file from Google Drive
export async function downloadBackupFromDrive(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup from Google Drive (${res.status} ${res.statusText})`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Downloaded backup file is not valid JSON data.');
  }
}

// Delete a backup from Google Drive
export async function deleteBackupFromDrive(accessToken: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive (${res.status})`);
  }
}

// Save or Update the Single Master Live Database file on Google Drive
// Accessible by any device connecting to the Google Drive storage
export async function saveMasterDatabaseToDrive(
  accessToken: string,
  snapshotData: any,
  options?: {
    institutionCode?: string;
    customNote?: string;
  }
): Promise<{ masterFile: DriveBackupFile; backupFile: DriveBackupFile }> {
  const folderId = await getOrCreateDriveVaultFolder(accessToken);
  const code = (options?.institutionCode || 'CUOIS').toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  // 1. Search if cuois_master_campus_database.json already exists in the vault folder
  const query = `'${folderId}' in parents and name='${MASTER_DATABASE_FILE_NAME}' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let existingMasterFile: DriveBackupFile | null = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      existingMasterFile = searchData.files[0];
    }
  }

  const serializedData = JSON.stringify(snapshotData, null, 2);
  const now = new Date();
  const metadata = {
    name: MASTER_DATABASE_FILE_NAME,
    mimeType: 'application/json',
    description: `CUOIS Master Live Campus Database. Synchronized across devices. Last updated: ${now.toLocaleString()}. ${
      options?.customNote ? `Note: ${options.customNote}` : ''
    }`,
    properties: {
      app: 'CUOIS',
      type: 'master_live_database',
      institutionCode: code,
      lastUpdated: now.toISOString(),
    },
  };

  const boundary = '-------cuois-master-boundary-' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    serializedData +
    closeDelimiter;

  let masterFile: DriveBackupFile;

  if (existingMasterFile) {
    // Update existing master file
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingMasterFile.id}?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update master database on Google Drive: ${updateRes.statusText}`);
    }
    masterFile = await updateRes.json();
  } else {
    // Create new master file inside the vault folder
    const createUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description`;
    const createMetadata = {
      ...metadata,
      parents: [folderId],
    };
    const createMultipart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(createMetadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      serializedData +
      closeDelimiter;

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: createMultipart,
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create master database on Google Drive: ${createRes.statusText}`);
    }
    masterFile = await createRes.json();
  }

  // Also create a versioned snapshot for historical rollbacks
  const backupFile = await uploadSnapshotToDrive(accessToken, snapshotData, {
    institutionCode: code,
    customNote: options?.customNote ? `Auto-sync: ${options.customNote}` : 'Automatic System Owner cloud save',
  });

  return { masterFile, backupFile };
}

// Download Master Campus Database from Google Drive for cross-device loading
export async function getMasterDatabaseFromDrive(
  accessToken: string
): Promise<{ data: any; file: DriveBackupFile }> {
  const folderId = await getOrCreateDriveVaultFolder(accessToken);

  // 1. Look for cuois_master_campus_database.json
  const query = `'${folderId}' in parents and name='${MASTER_DATABASE_FILE_NAME}' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to search Google Drive master database');
  }

  const searchData = await searchRes.json();
  let targetFile: DriveBackupFile | null = null;

  if (searchData.files && searchData.files.length > 0) {
    targetFile = searchData.files[0];
  } else {
    // If master file not yet created, pick the latest backup snapshot
    const backups = await listDriveBackups(accessToken);
    if (backups.length > 0) {
      targetFile = backups[0];
    }
  }

  if (!targetFile) {
    throw new Error('No master database or snapshot found in your Google Drive Campus Vault. Please save your campus data from your primary device first.');
  }

  const data = await downloadBackupFromDrive(accessToken, targetFile.id);
  return { data, file: targetFile };
}

// Retrieve metadata info of the Master Database in Google Drive
export async function getMasterDatabaseInfo(accessToken: string): Promise<DriveBackupFile | null> {
  try {
    const folderId = await getOrCreateDriveVaultFolder(accessToken);
    const query = `'${folderId}' in parents and name='${MASTER_DATABASE_FILE_NAME}' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&spaces=drive`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    return searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;
  } catch {
    return null;
  }
}
