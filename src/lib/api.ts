/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Typed API Client & Real-time Event Stream Connector
 */

import {
  Institution,
  User,
  AuthSession,
  Building,
  Room,
  Department,
  Program,
  AcademicYear,
  Semester,
  Section,
  Subject,
  Student,
  Faculty,
  Staff,
  AttendanceRecord,
  TimetableEntry,
  Complaint,
  Facility,
  MaintenanceRequest,
  LibraryItem,
  LibraryTransaction,
  Hostel,
  Vehicle,
  TransportRoute,
  Visitor,
  SecurityIncident,
  SecurityZone,
  Announcement,
  Notification,
  AuditLog,
  AIInsight,
  SystemTelemetry,
  RoleDefinition,
  UserRole,
  GeminiModelChoice,
  GroundingSource,
  Assignment,
  Examination,
  ExamSchedule,
  Result,
  Survey,
  SurveyResponse,
  ConfidentialReport,
  StudentRiskIndicator,
  DigitalTwinNode,
} from '../types/index.ts';
import { standaloneStorage } from './client-storage.ts';

const TOKEN_KEY = 'cuois_auth_token';
export const LAST_SAVED_KEY = 'cuois_last_saved_timestamp';

// Initialize standalone defaults once in browser
if (typeof window !== 'undefined') {
  standaloneStorage.initDefault();
}

let isStandaloneMode = false;

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getLastSavedTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_SAVED_KEY);
  } catch {
    return null;
  }
}

export function recordLocalMemorySync(customIso?: string): string {
  const timestamp = customIso || new Date().toISOString();
  try {
    localStorage.setItem(LAST_SAVED_KEY, timestamp);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cuois:data-saved', {
          detail: { timestamp, source: 'local_memory' },
        })
      );
    }
  } catch {
    // ignore
  }
  return timestamp;
}

function handleStandaloneFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  let body: any = {};
  try {
    if (options.body) body = JSON.parse(options.body as string);
  } catch {}

  if (endpoint === '/api/bootstrap/status') {
    const inst = standaloneStorage.get<Institution | null>('institution', null);
    return { isConfigured: true, institution: inst } as unknown as T;
  }
  if (endpoint === '/api/institution') {
    if (method === 'PUT') {
      const existing = standaloneStorage.get<Institution | null>('institution', null) || ({} as Institution);
      const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
      standaloneStorage.set('institution', updated);
      recordLocalMemorySync();
      return updated as unknown as T;
    }
    return standaloneStorage.get<Institution | null>('institution', null) as unknown as T;
  }
  if (endpoint === '/api/auth/login') {
    const { identifier, username, email, password } = body;
    const cleanId = (identifier || username || email || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error('Compulsory Requirement: You must enter both your assigned Member ID and Password.');
    }

    // STRICT: Check if user exists in registered database
    const user = standaloneStorage.findUserByIdentifier(cleanId);
    if (!user) {
      throw new Error('Invalid Member ID or Password. Only registered campus accounts can enter.');
    }

    // STRICT: Check if password matches
    const verified = standaloneStorage.verifyCredentials(cleanId, cleanPass);
    if (!verified) {
      throw new Error('Invalid credentials. The password you entered is incorrect.');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated by administrator.');
    }

    const session: AuthSession = {
      token: 'standalone-token-' + Date.now(),
      user: verified.user,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      rolePermissions: verified.user.role === 'SYSTEM_OWNER' ? ['*'] : ['READ_CAMPUS'],
    };
    standaloneStorage.set('current_session_user_id', verified.user.id);
    setStoredToken(session.token);
    recordLocalMemorySync();
    return { session } as unknown as T;
  }
  if (endpoint === '/api/auth/me') {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Authentication required. No active session token.');
    }
    const currentUserId = standaloneStorage.get<string | null>('current_session_user_id', null);
    const users = standaloneStorage.get<User[]>('users', []);
    const user = currentUserId ? users.find((u) => u.id === currentUserId) : null;
    if (!user) {
      setStoredToken('');
      throw new Error('Session invalid or user not found.');
    }
    return {
      user,
      sessionToken: token,
      rolePermissions: user.role === 'SYSTEM_OWNER' ? ['*'] : ['READ_CAMPUS'],
    } as unknown as T;
  }
  if (endpoint === '/api/auth/logout') {
    standaloneStorage.set('current_session_user_id', null);
    setStoredToken('');
    return { success: true, message: 'Logged out successfully.' } as unknown as T;
  }
  if (endpoint === '/api/auth/personalized-entry') {
    throw new Error('Direct entry without password verification is strictly disabled. Please enter your Member ID and Password.');
  }
  if (endpoint === '/api/auth/update-profile') {
    const currentUserId = standaloneStorage.get<string | null>('current_session_user_id', null);
    const users = standaloneStorage.get<User[]>('users', []);
    const idx = users.findIndex((u) => u.id === currentUserId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...body, updatedAt: new Date().toISOString() };
      standaloneStorage.set('users', users);
      recordLocalMemorySync();
      return { success: true, user: users[idx] } as unknown as T;
    }
    return { success: true, user: body } as unknown as T;
  }
  if (endpoint === '/api/auth/change-password') {
    const currentUserId = standaloneStorage.get<string | null>('current_session_user_id', null);
    if (!currentUserId) {
      throw new Error('Authentication required.');
    }
    const { currentPassword, newPassword } = body;
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const users = standaloneStorage.get<User[]>('users', []);
    const user = users.find((u) => u.id === currentUserId);
    if (!user) {
      throw new Error('User not found.');
    }
    if (currentPassword) {
      const verified = standaloneStorage.verifyCredentials(user.id, currentPassword);
      if (!verified) {
        throw new Error('Current password does not match.');
      }
    }
    standaloneStorage.setUserPassword(user.id, user.username, user.email, newPassword);
    recordLocalMemorySync();
    return { success: true, message: 'Password updated successfully.' } as unknown as T;
  }
  if (endpoint === '/api/digital-twin/nodes') {
    if (method === 'POST') {
      const nodes = standaloneStorage.get<DigitalTwinNode[]>('digitalTwinNodes', []);
      const newNode: DigitalTwinNode = {
        ...body,
        id: 'twin-node-' + Date.now(),
        lastTelemetryUpdate: new Date().toISOString(),
      };
      nodes.push(newNode);
      standaloneStorage.set('digitalTwinNodes', nodes);
      recordLocalMemorySync();
      return newNode as unknown as T;
    }
    return standaloneStorage.get<DigitalTwinNode[]>('digitalTwinNodes', []) as unknown as T;
  }
  if (endpoint.startsWith('/api/digital-twin/nodes/')) {
    const parts = endpoint.split('/');
    const id = parts[parts.length - 1];
    const nodes = standaloneStorage.get<DigitalTwinNode[]>('digitalTwinNodes', []);
    if (method === 'PUT') {
      const idx = nodes.findIndex(n => n.id === id);
      if (idx >= 0) {
        nodes[idx] = { ...nodes[idx], ...body, lastTelemetryUpdate: new Date().toISOString() };
        standaloneStorage.set('digitalTwinNodes', nodes);
        recordLocalMemorySync();
        return nodes[idx] as unknown as T;
      }
    }
    if (method === 'DELETE') {
      const filtered = nodes.filter(n => n.id !== id);
      standaloneStorage.set('digitalTwinNodes', filtered);
      recordLocalMemorySync();
      return { success: true } as unknown as T;
    }
  }
  if (endpoint === '/api/users') {
    if (method === 'POST') {
      const users = standaloneStorage.get<User[]>('users', []);
      const newUser: User = {
        ...body,
        id: 'usr-' + Date.now(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(newUser);
      standaloneStorage.set('users', users);
      if (body.password) {
        standaloneStorage.setUserPassword(newUser.id, newUser.username, newUser.email, body.password);
      }
      recordLocalMemorySync();
      return newUser as unknown as T;
    }
    return standaloneStorage.get<User[]>('users', []) as unknown as T;
  }
  if (endpoint.startsWith('/api/users/')) {
    const parts = endpoint.split('/');
    const id = parts[3];
    const subAction = parts[4];
    const users = standaloneStorage.get<User[]>('users', []);
    const idx = users.findIndex(u => u.id === id);
    if (subAction === 'reset-password') {
      return { success: true, message: 'Password reset successfully' } as unknown as T;
    }
    if (method === 'PUT' && idx >= 0) {
      users[idx] = { ...users[idx], ...body, updatedAt: new Date().toISOString() };
      standaloneStorage.set('users', users);
      recordLocalMemorySync();
      return users[idx] as unknown as T;
    }
    if (method === 'DELETE') {
      const filtered = users.filter(u => u.id !== id);
      standaloneStorage.set('users', filtered);
      recordLocalMemorySync();
      return { success: true } as unknown as T;
    }
  }

  // Fallback defaults
  if (endpoint === '/api/notifications') return [] as unknown as T;
  if (endpoint === '/api/telemetry') {
    return {
      activeConnections: 1,
      totalRequestsToday: 12,
      databaseSizeBytes: 204800,
      memoryUsageMb: 85,
      cpuLoadPercent: 4.2,
      uptimeSeconds: 3600,
      systemHealth: 'HEALTHY',
    } as unknown as T;
  }

  return ([] as unknown) as T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (options.method || 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';

  // If hosted on GitHub Pages static hosting or offline, use standalone storage
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  if (isStandaloneMode || isGitHubPages) {
    return handleStandaloneFallback<T>(endpoint, options);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // Only switch to standalone if a static web server responded with HTML for an /api/ endpoint
    if (isHtml && endpoint.startsWith('/api/')) {
      console.warn(`[CUOIS] Backend returned HTML for ${endpoint} (static web server detected). Switching to standalone mode.`);
      isStandaloneMode = true;
      return handleStandaloneFallback<T>(endpoint, options);
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (isMutation) {
      recordLocalMemorySync();
    }
    return data;
  } catch (err: any) {
    // If fetch failed completely (network disconnected or DNS failure)
    if (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
      console.warn('[CUOIS] Network unreachable, activating standalone mode:', err.message);
      isStandaloneMode = true;
      return handleStandaloneFallback<T>(endpoint, options);
    }
    throw err;
  }
}

export const api = {
  // Bootstrap & Institution
  getBootstrapStatus: () => request<{ isConfigured: boolean; institution: Institution | null }>('/api/bootstrap/status'),
  getInstitution: () => request<Institution | null>('/api/institution'),
  updateInstitution: (data: Partial<Institution>) =>
    request<Institution>('/api/institution', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  initializeInstitution: (payload: { institution: any; owner: any; template?: string }) =>
    request<{ success: boolean; institution: Institution; session: AuthSession }>('/api/bootstrap/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetInstitution: () => request<{ success: boolean }>('/api/bootstrap/reset', { method: 'POST' }),

  // Auth
  login: (credentials: { identifier?: string; email?: string; username?: string; password: string }) =>
    request<{ session: AuthSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  personalizedEntry: (payload: { fullName: string; role: UserRole; password?: string }) =>
    request<{ session: AuthSession }>('/api/auth/personalized-entry', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: User; rolePermissions: string[]; sessionToken: string }>('/api/auth/me'),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  switchRole: (targetRole: UserRole) =>
    request<{ success: boolean; user: User; rolePermissions: string[] }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    }),

  // Telemetry & Health
  getTelemetry: () => request<SystemTelemetry>('/api/telemetry'),

  // Campuses & Buildings
  getCampuses: () => request<any[]>('/api/campuses'),
  getBuildings: () => request<Building[]>('/api/buildings'),
  addBuilding: (data: Partial<Building>) => request<Building>('/api/buildings', { method: 'POST', body: JSON.stringify(data) }),
  getRooms: () => request<Room[]>('/api/rooms'),

  // Digital Twin Nodes & Spatial Telemetry
  getDigitalTwinNodes: () => request<DigitalTwinNode[]>('/api/digital-twin/nodes'),
  addDigitalTwinNode: (data: Partial<DigitalTwinNode>) => request<DigitalTwinNode>('/api/digital-twin/nodes', { method: 'POST', body: JSON.stringify(data) }),
  updateDigitalTwinNode: (id: string, data: Partial<DigitalTwinNode>) => request<DigitalTwinNode>(`/api/digital-twin/nodes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDigitalTwinNode: (id: string) => request<{ success: boolean }>(`/api/digital-twin/nodes/${id}`, { method: 'DELETE' }),
  syncDigitalTwinWeather: (id: string) => request<DigitalTwinNode>(`/api/digital-twin/nodes/${id}/weather-sync`, { method: 'POST' }),
  getLiveWeather: (lat: number, lng: number) =>
    request<{
      latitude: number;
      longitude: number;
      temperatureF: number;
      feelsLikeF: number;
      humidity: number;
      windSpeedMph: number;
      weatherCode: number;
      condition: string;
      timestamp: string;
      source: string;
    }>(`/api/digital-twin/weather?lat=${lat}&lng=${lng}`),

  // Academic Structure
  getDepartments: () => request<Department[]>('/api/departments'),
  addDepartment: (data: Partial<Department>) => request<Department>('/api/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: string, data: Partial<Department>) => request<Department>(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: string) => request<{ success: boolean }>(`/api/departments/${id}`, { method: 'DELETE' }),
  getPrograms: () => request<Program[]>('/api/programs'),
  getAcademicYears: () => request<AcademicYear[]>('/api/academic-years'),
  getSemesters: () => request<Semester[]>('/api/semesters'),
  getSections: () => request<Section[]>('/api/sections'),
  getSubjects: () => request<Subject[]>('/api/subjects'),

  // Users & RBAC
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: Partial<User> & { password?: string }) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<User> & { password?: string }) => request<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetUserPassword: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  deleteUser: (id: string) => request<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),
  getRoles: () => request<RoleDefinition[]>('/api/roles'),
  updateRolePermissions: (roleCode: string, permissions: string[]) =>
    request<RoleDefinition>(`/api/roles/${roleCode}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Students & Faculty & Staff
  getStudents: () => request<Student[]>('/api/students'),
  addStudent: (data: Partial<Student>) => request<Student>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  getFaculty: () => request<Faculty[]>('/api/faculty'),
  addFaculty: (data: Partial<Faculty>) => request<Faculty>('/api/faculty', { method: 'POST', body: JSON.stringify(data) }),
  getStaff: () => request<Staff[]>('/api/staff'),

  // Attendance
  getAttendance: () => request<AttendanceRecord[]>('/api/attendance'),
  recordAttendance: (records: any[]) => request<{ success: boolean; count: number }>('/api/attendance', { method: 'POST', body: JSON.stringify({ records }) }),

  // Timetable
  getTimetable: () => request<TimetableEntry[]>('/api/timetable'),
  addTimetableEntry: (entry: Partial<TimetableEntry>) => request<TimetableEntry>('/api/timetable', { method: 'POST', body: JSON.stringify(entry) }),
  deleteTimetableEntry: (id: string) => request<{ success: boolean }>(`/api/timetable/${id}`, { method: 'DELETE' }),

  // Complaints
  getComplaints: () => request<Complaint[]>('/api/complaints'),
  addComplaint: (data: Partial<Complaint>) => request<Complaint>('/api/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: string, data: Partial<Complaint>) => request<Complaint>(`/api/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Facilities & Maintenance
  getFacilities: () => request<Facility[]>('/api/facilities'),
  getMaintenanceRequests: () => request<MaintenanceRequest[]>('/api/maintenance'),
  addMaintenanceRequest: (data: Partial<MaintenanceRequest>) => request<MaintenanceRequest>('/api/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenanceRequest: (id: string, data: Partial<MaintenanceRequest>) => request<MaintenanceRequest>(`/api/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Library
  getLibraryItems: () => request<LibraryItem[]>('/api/library/items'),
  addLibraryItem: (data: Partial<LibraryItem>) => request<LibraryItem>('/api/library/items', { method: 'POST', body: JSON.stringify(data) }),
  updateLibraryItem: (id: string, data: Partial<LibraryItem>) => request<LibraryItem>(`/api/library/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLibraryItem: (id: string) => request<{ success: boolean }>(`/api/library/items/${id}`, { method: 'DELETE' }),
  getLibraryTransactions: () => request<LibraryTransaction[]>('/api/library/transactions'),

  // Hostel & Transport
  getHostels: () => request<Hostel[]>('/api/hostels'),
  addHostel: (data: Partial<Hostel>) => request<Hostel>('/api/hostels', { method: 'POST', body: JSON.stringify(data) }),
  updateHostel: (id: string, data: Partial<Hostel>) => request<Hostel>(`/api/hostels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHostel: (id: string) => request<{ success: boolean }>(`/api/hostels/${id}`, { method: 'DELETE' }),
  getVehicles: () => request<Vehicle[]>('/api/transport/vehicles'),
  addVehicle: (data: Partial<Vehicle>) => request<Vehicle>('/api/transport/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, data: Partial<Vehicle>) => request<Vehicle>(`/api/transport/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: string) => request<{ success: boolean }>(`/api/transport/vehicles/${id}`, { method: 'DELETE' }),
  getTransportRoutes: () => request<TransportRoute[]>('/api/transport/routes'),
  addTransportRoute: (data: Partial<TransportRoute>) => request<TransportRoute>('/api/transport/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateTransportRoute: (id: string, data: Partial<TransportRoute>) => request<TransportRoute>(`/api/transport/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransportRoute: (id: string) => request<{ success: boolean }>(`/api/transport/routes/${id}`, { method: 'DELETE' }),

  // Visitors
  getVisitors: () => request<Visitor[]>('/api/visitors'),
  registerVisitor: (data: Partial<Visitor>) => request<Visitor>('/api/visitors', { method: 'POST', body: JSON.stringify(data) }),
  checkoutVisitor: (id: string) => request<Visitor>(`/api/visitors/${id}/checkout`, { method: 'POST' }),

  // Security
  getSecurityZones: () => request<SecurityZone[]>('/api/security/zones'),
  getSecurityIncidents: () => request<SecurityIncident[]>('/api/security/incidents'),
  logSecurityIncident: (data: Partial<SecurityIncident>) => request<SecurityIncident>('/api/security/incidents', { method: 'POST', body: JSON.stringify(data) }),

  // Announcements & Notifications
  getAnnouncements: () => request<Announcement[]>('/api/announcements'),
  addAnnouncement: (data: Partial<Announcement>) => request<Announcement>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
  getNotifications: () => request<Notification[]>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),

  // AI Command Center
  getAIInsights: () => request<AIInsight[]>('/api/ai/insights'),
  queryAI: (query: string) =>
    request<{
      query: string;
      response: string;
      breakdown: {
        facts: string[];
        calculations: string[];
        predictions: string[];
        recommendations: string[];
      };
      groundedEntities: string[];
      confidence: number;
    }>('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  chatWithAI: (payload: {
    messages: { role: 'user' | 'model'; content: string }[];
    model?: GeminiModelChoice;
    systemInstruction?: string;
    enableSearchGrounding?: boolean;
  }) =>
    request<{
      reply: string;
      modelUsed: string;
      groundingSources: GroundingSource[];
      searchQueries: string[];
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Data Import & Export
  importData: (entityType: string, records: any[], mode?: string) =>
    request<{ success: boolean; createdCount: number; updatedCount: number; errors: string[] }>('/api/data/import', {
      method: 'POST',
      body: JSON.stringify({ entityType, records, mode }),
    }),
  exportData: () => request<any>('/api/data/export'),

  // Academic Modules: Assignments & Examinations
  getAssignments: () => request<Assignment[]>('/api/assignments'),
  addAssignment: (data: Partial<Assignment>) =>
    request<Assignment>('/api/assignments', { method: 'POST', body: JSON.stringify(data) }),
  getExaminations: () => request<Examination[]>('/api/examinations'),
  getExamSchedules: () => request<ExamSchedule[]>('/api/exam-schedules'),
  getResults: () => request<Result[]>('/api/results'),

  // Surveys (Anonymous & Targeted)
  getSurveys: () => request<Survey[]>('/api/surveys'),
  addSurvey: (data: Partial<Survey>) =>
    request<Survey>('/api/surveys', { method: 'POST', body: JSON.stringify(data) }),
  respondSurvey: (surveyId: string, answers: { questionId: string; value: any }[]) =>
    request<{ success: boolean; message: string }>(`/api/surveys/${surveyId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Confidential Reporting & Whistleblower Grievance
  getConfidentialReports: () => request<ConfidentialReport[]>('/api/confidential-reports'),
  submitConfidentialReport: (data: Partial<ConfidentialReport>) =>
    request<ConfidentialReport>('/api/confidential-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revealConfidentialReport: (id: string, reason: string) =>
    request<ConfidentialReport>(`/api/confidential-reports/${id}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Student Risk Early-Warning Intelligence
  getStudentRiskIndicators: () => request<StudentRiskIndicator[]>('/api/academic-risk/students'),

  // SSE Stream
  subscribeRealtimeEvents: (onEvent: (event: { type: string; timestamp: string; data: any }) => void) => {
    if (typeof window === 'undefined' || isStandaloneMode) {
      return () => {};
    }
    try {
      const eventSource = new EventSource('/api/realtime/stream');
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch {
          // ignore parse error
        }
      };
      eventSource.onerror = () => {
        // If SSE fails (e.g., on GitHub Pages or static hosting), close gracefully
        eventSource.close();
      };
      return () => eventSource.close();
    } catch {
      return () => {};
    }
  },
};
