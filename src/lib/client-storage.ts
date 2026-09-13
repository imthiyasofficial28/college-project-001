/**
 * CUOIS — Client-side Standalone Storage Fallback
 * Provides full offline and static hosting functionality (Vercel, GitHub Pages, Netlify)
 * where the Node.js Express backend server is not running or returns 404 for /api endpoints.
 */

import { Institution, User, DigitalTwinNode } from '../types/index.ts';
import seedDatabase from '../../data/cuois_database.json';

const STORAGE_PREFIX = 'cuois_standalone_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('[CUOIS Standalone] Storage write warning:', err);
  }
}

export const standaloneStorage = {
  get: getStorage,
  set: setStorage,

  initDefault() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
      const defaultInstitution: Institution = (seedDatabase as any).institution || {
        id: 'inst-cuois-primary',
        name: 'Apex Institute of Science & Technology',
        code: 'AIST-CAMPUS',
        tagline: 'Sovereign Campus Intelligence & Operations Platform',
        address: 'Knowledge Corridor, Innovation Tech Park',
        contactEmail: 'imthiyasofficial28@gmail.com',
        contactPhone: '+1 (800) 555-CUOIS',
        website: 'https://cuois.internal',
        establishedYear: 2018,
        timezone: 'UTC',
        academicCalendarType: 'SEMESTER',
        accreditation: 'Tier-1 Sovereign Technical Institution',
        isConfigured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const defaultOwner: User = {
        id: 'usr-imthiyas-sovereign',
        username: 'IMTHIYAS',
        fullName: 'Imthiyas',
        email: 'imthiyasofficial28@gmail.com',
        role: 'SYSTEM_OWNER',
        phone: '+91 98765 43210',
        bio: 'Lead Architect and Sovereign Creator of CUOIS. Architect of campus digital twin, spatial telemetry and unified governance.',
        avatarUrl: '',
        isActive: true,
        mfaEnabled: true,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingUsers: User[] = (seedDatabase as any).users?.map((u: any) => {
        const { passwordHash, salt, ...safeUser } = u;
        return safeUser;
      }) || [defaultOwner];

      // Ensure Imthiyas is in users
      if (!existingUsers.some((u) => u.username?.toUpperCase() === 'IMTHIYAS')) {
        existingUsers.unshift(defaultOwner);
      }

      setStorage('institution', defaultInstitution);
      setStorage('users', existingUsers);
      setStorage('digitalTwinNodes', (seedDatabase as any).digitalTwinNodes || []);
      setStorage('departments', (seedDatabase as any).departments || []);
      setStorage('programs', (seedDatabase as any).programs || []);
      setStorage('academicYears', (seedDatabase as any).academicYears || []);
      setStorage('semesters', (seedDatabase as any).semesters || []);
      setStorage('sections', (seedDatabase as any).sections || []);
      setStorage('subjects', (seedDatabase as any).subjects || []);
      setStorage('students', (seedDatabase as any).students || []);
      setStorage('faculty', (seedDatabase as any).faculty || []);
      setStorage('staff', (seedDatabase as any).staff || []);
      setStorage('attendance', (seedDatabase as any).attendance || []);
      setStorage('timetable', (seedDatabase as any).timetable || []);
      setStorage('assignments', (seedDatabase as any).assignments || []);
      setStorage('examinations', (seedDatabase as any).examinations || []);
      setStorage('examSchedules', (seedDatabase as any).examSchedules || []);
      setStorage('results', (seedDatabase as any).results || []);
      setStorage('announcements', (seedDatabase as any).announcements || []);
      setStorage('notifications', (seedDatabase as any).notifications || []);
      setStorage('complaints', (seedDatabase as any).complaints || []);
      setStorage('facilities', (seedDatabase as any).facilities || []);
      setStorage('maintenanceRequests', (seedDatabase as any).maintenanceRequests || []);
      setStorage('libraryItems', (seedDatabase as any).libraryItems || []);
      setStorage('libraryTransactions', (seedDatabase as any).libraryTransactions || []);
      setStorage('hostels', (seedDatabase as any).hostels || []);
      setStorage('transportRoutes', (seedDatabase as any).transportRoutes || []);
      setStorage('vehicles', (seedDatabase as any).vehicles || []);
      setStorage('visitors', (seedDatabase as any).visitors || []);
      setStorage('securityZones', (seedDatabase as any).securityZones || []);
      setStorage('securityIncidents', (seedDatabase as any).securityIncidents || []);
      setStorage('auditLogs', (seedDatabase as any).auditLogs || []);
      setStorage('aiInsights', (seedDatabase as any).aiInsights || []);
      setStorage('surveys', (seedDatabase as any).surveys || []);
      setStorage('confidentialReports', (seedDatabase as any).confidentialReports || []);

      setStorage('isConfigured', true);
      setStorage('credentials', {
        'usr-imthiyas-sovereign': 'Imthiyas@12345',
        'usr_owner_01': 'Imthiyas@12345',
        'IMTHIYAS': 'Imthiyas@12345',
        'imthiyasofficial28@gmail.com': 'Imthiyas@12345',
      });
      setStorage('initialized', true);
    } else {
      // Ensure credentials map is populated even if already initialized
      const creds = getStorage<Record<string, string>>('credentials', {});
      if (!creds['IMTHIYAS'] && !creds['usr-imthiyas-sovereign']) {
        creds['usr-imthiyas-sovereign'] = 'Imthiyas@12345';
        creds['usr_owner_01'] = 'Imthiyas@12345';
        creds['IMTHIYAS'] = 'Imthiyas@12345';
        creds['imthiyasofficial28@gmail.com'] = 'Imthiyas@12345';
        setStorage('credentials', creds);
      }
    }
  },

  findUserByIdentifier(identifier: string): User | undefined {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return undefined;
    const users = getStorage<User[]>('users', []);
    return users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.id && u.id.toLowerCase() === clean)
    );
  },

  verifyCredentials(identifier: string, password: string): { user: User } | null {
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();
    if (!cleanId || !cleanPass) return null;

    const user = this.findUserByIdentifier(cleanId);
    if (!user) return null;

    const creds = getStorage<Record<string, string>>('credentials', {});
    const expectedPassword =
      creds[user.id] ||
      creds[user.username.toUpperCase()] ||
      creds[user.username.toLowerCase()] ||
      creds[user.email.toLowerCase()] ||
      (user.role === 'SYSTEM_OWNER' ? 'Imthiyas@12345' : 'Campus@12345');

    if (cleanPass !== expectedPassword) {
      return null;
    }

    return { user };
  },

  setUserPassword(userId: string, username: string, email: string, newPassword: string): void {
    const creds = getStorage<Record<string, string>>('credentials', {});
    creds[userId] = newPassword;
    if (username) {
      creds[username] = newPassword;
      creds[username.toUpperCase()] = newPassword;
      creds[username.toLowerCase()] = newPassword;
    }
    if (email) {
      creds[email.toLowerCase()] = newPassword;
    }
    setStorage('credentials', creds);
  },
};
