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

const TOKEN_KEY = 'cuois_auth_token';
export const LAST_SAVED_KEY = 'cuois_last_saved_timestamp';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (options.method || 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (isMutation) {
    recordLocalMemorySync();
  }
  return data;
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
    const eventSource = new EventSource('/api/realtime/stream');
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch {
        // ignore parse error
      }
    };
    return () => eventSource.close();
  },
};
