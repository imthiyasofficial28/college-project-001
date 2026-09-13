/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Core Data Models & Type System
 */

export type UserRole =
  | 'SYSTEM_OWNER'
  | 'ADMINISTRATOR'
  | 'EDITOR'
  | 'MANAGEMENT'
  | 'FACULTY'
  | 'STAFF'
  | 'SECURITY'
  | 'STUDENT'
  | 'CUSTOM';

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve';
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  code: UserRole;
  description: string;
  isSystem: boolean;
  permissions: string[]; // Permission IDs or '*' for all
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  customRoleId?: string;
  isActive: boolean;
  departmentId?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
  rolePermissions: string[];
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  tagline: string;
  motto?: string;
  chancellorName?: string;
  domain?: string;
  establishedYear: number;
  address: string;
  timezone: string;
  academicCalendarType: 'SEMESTER' | 'TRIMESTER' | 'ANNUAL';
  currentAcademicYearId?: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  accreditation: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campus {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  address: string;
  totalAreaAcres: number;
  isActive: boolean;
  buildingsCount?: number;
}

export interface Building {
  id: string;
  campusId: string;
  name: string;
  code: string;
  floorsCount: number;
  type: 'ACADEMIC' | 'ADMINISTRATIVE' | 'LABORATORY' | 'LIBRARY' | 'HOSTEL' | 'SPORTS' | 'UTILITY';
  coordinates: { x: number; y: number; z: number; width: number; depth: number; height: number };
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'RESTRICTED';
}

export interface Room {
  id: string;
  buildingId: string;
  buildingName?: string;
  roomNumber: string;
  floor: number;
  type: 'LECTURE_HALL' | 'LAB' | 'FACULTY_CABIN' | 'SEMINAR_ROOM' | 'OFFICE' | 'RESTROOM' | 'SERVER_ROOM';
  capacity: number;
  hasProjector: boolean;
  hasAirConditioning: boolean;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  hodName?: string;
  description: string;
  buildingId?: string;
  programsCount?: number;
  facultyCount?: number;
  studentCount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Program {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  degreeType: 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DOCTORAL' | 'DIPLOMA';
  durationYears: number;
  totalSemesters: number;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
}

export interface Semester {
  id: string;
  academicYearId: string;
  programId: string;
  semesterNumber: number;
  name: string; // e.g. "Fall 2025 - Sem 3"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Section {
  id: string;
  semesterId: string;
  name: string; // "Section A"
  capacity: number;
  academicYearId: string;
}

export interface Subject {
  id: string;
  departmentId: string;
  name: string;
  code: string; // e.g. "CS301"
  credits: number;
  theoryHours: number;
  labHours: number;
  isElective: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Student {
  id: string;
  userId: string;
  registrationNumber: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  programId: string;
  programName?: string;
  departmentId: string;
  departmentName?: string;
  currentSemester: number;
  sectionId: string;
  sectionName?: string;
  admissionDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'ALUMNI';
  cgpa: number;
  attendancePercentage: number;
  guardianName: string;
  guardianPhone: string;
}

export interface Faculty {
  id: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName?: string;
  designation: 'PROFESSOR' | 'ASSOCIATE_PROFESSOR' | 'ASSISTANT_PROFESSOR' | 'LECTURER' | 'RESEARCH_FELLOW';
  specialization: string;
  qualification: string;
  joiningDate: string;
  workloadHoursPerWeek: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
}

export interface Staff {
  id: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId?: string;
  roleTitle: string;
  category: 'ADMIN' | 'LAB_TECHNICIAN' | 'FACILITY_MAINTENANCE' | 'SECURITY' | 'LIBRARIAN' | 'TRANSPORT';
  status: 'ACTIVE' | 'ON_LEAVE';
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ComplaintCategory = 'ACADEMIC' | 'HOSTEL' | 'FACILITIES' | 'TRANSPORT' | 'DISCIPLINARY' | 'OTHER';

export interface AttendanceRecord {
  id: string;
  academicYearId: string;
  subjectId: string;
  subjectName?: string;
  sectionId: string;
  studentId: string;
  studentName?: string;
  registrationNumber?: string;
  facultyId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  createdAt: string;
}

export interface TimetableEntry {
  id: string;
  academicYearId: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  facultyId: string;
  facultyName?: string;
  roomId: string;
  roomNumber?: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  periodIndex: number;
}

export interface Assignment {
  id: string;
  subjectId: string;
  subjectName?: string;
  sectionId: string;
  facultyId: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  status: 'ACTIVE' | 'EVALUATED' | 'ARCHIVED';
  submissionsCount?: number;
  createdAt?: string;
}

export interface Examination {
  id: string;
  academicYearId: string;
  name: string; // "Mid-Term Examinations Fall 2025"
  type: 'MID_TERM' | 'FINAL_EXAM' | 'QUIZ' | 'LAB_EXAM';
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED';
}

export interface ExamSchedule {
  id: string;
  examinationId: string;
  subjectId: string;
  subjectName?: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomNumber?: string;
  invigilatorFacultyId: string;
  invigilatorName?: string;
  maxMarks: number;
}

export interface Result {
  id: string;
  examinationId: string;
  studentId: string;
  studentName?: string;
  registrationNumber?: string;
  subjectId: string;
  subjectName?: string;
  marksObtained: number;
  maxMarks: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  gpa: number;
  published: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  targetAudience: 'ALL' | 'STUDENTS' | 'FACULTY' | 'STAFF' | 'SECURITY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'ACADEMIC' | 'ADMINISTRATIVE' | 'EMERGENCY' | 'EVENT' | 'FACILITY';
  isPinned: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string; // User ID or 'ALL'
  title: string;
  message: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  module: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'ACADEMIC' | 'HOSTEL' | 'FACILITIES' | 'TRANSPORT' | 'DISCIPLINARY' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  submittedByUserId: string;
  submittedByName: string;
  assignedToStaffId?: string;
  assignedToName?: string;
  resolutionNotes?: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'AUDITORIUM' | 'CONFERENCE_ROOM' | 'GYMNASIUM' | 'SPORTS_GROUND' | 'SPECIAL_LAB' | 'SERVER_ROOM';
  buildingId: string;
  buildingName?: string;
  capacity: number;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'RESERVED';
  equipmentDetails: string;
}

export interface MaintenanceRequest {
  id: string;
  code: string;
  facilityOrRoomId: string;
  locationName: string;
  issueDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFIED' | 'CLOSED';
  requestedByUserId: string;
  requestedByName: string;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  callNumber: string;
}

export interface LibraryTransaction {
  id: string;
  itemId: string;
  itemTitle?: string;
  userId: string;
  userName?: string;
  userRole: UserRole;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  fineAmount: number;
}

export interface Hostel {
  id: string;
  name: string;
  code: string;
  gender: 'MALE' | 'FEMALE' | 'CO_ED';
  type?: 'BOYS' | 'GIRLS' | 'CO_ED' | 'MALE' | 'FEMALE';
  wardenName: string;
  wardenPhone: string;
  wardenContact?: string;
  totalFloors: number;
  totalBeds: number;
  totalCapacity?: number;
  occupiedBeds: number;
  buildingId?: string;
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'FULL';
}

export interface HostelRoom {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupiedCount: number;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
}

export interface TransportRoute {
  id: string;
  name: string;
  routeCode: string;
  startPoint: string;
  endPoint: string;
  stops: string[];
  departureTime: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  totalCapacity: number;
  registeredPassengersCount: number;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  plateNumber?: string;
  model?: string;
  type: 'BUS' | 'MINIBUS' | 'VAN' | 'AMBULANCE' | 'CAMPUS_SECURITY';
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'IDLE';
  fuelLevelPercent: number;
  fuelLevel?: number;
  driverName: string;
  driverPhone?: string;
  lastServiceDate: string;
}

export interface Visitor {
  id: string;
  passNumber: string;
  fullName: string;
  contactNumber: string;
  purpose: 'ACADEMIC_GUEST' | 'PARENT' | 'VENDOR' | 'INTERVIEWEE' | 'OFFICIAL' | 'OTHER';
  hostUserId: string;
  hostName: string;
  entryTimestamp: string;
  exitTimestamp?: string | null;
  status: 'APPROVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'DENIED';
  securityOfficerName: string;
  vehicleNumber?: string;
}

export interface SecurityIncident {
  id: string;
  incidentCode: string;
  type: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'MEDICAL_EMERGENCY' | 'THEFT' | 'INFRASTRUCTURE_FAILURE' | 'DISPUTE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  description: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_ALARM';
  reportedBy: string;
  assignedOfficer: string;
  reportedAt: string;
  resolvedAt?: string | null;
}

export interface SecurityZone {
  id: string;
  name: string;
  code: string;
  clearanceLevel: 'PUBLIC' | 'STUDENT' | 'FACULTY_ONLY' | 'ADMIN_RESTRICTED' | 'LEVEL_4_SECURE';
  status: 'NORMAL' | 'ELEVATED_WATCH' | 'LOCKDOWN';
  activeGuardsCount: number;
  cameraStreamsCount: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  reason?: string;
  ipAddress: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  type: 'FACT' | 'CALCULATION' | 'PREDICTION' | 'RECOMMENDATION';
  category: 'ATTENDANCE' | 'PERFORMANCE' | 'MAINTENANCE' | 'SECURITY' | 'EFFICIENCY';
  title: string;
  content: string;
  metric?: string;
  confidenceScore: number;
  suggestedAction?: string;
  generatedAt: string;
}

export interface SystemTelemetry {
  apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  databaseStatus: 'CONNECTED' | 'DISCONNECTED';
  geminiAiStatus: 'ONLINE' | 'STANDBY' | 'RATE_LIMITED';
  realtimeEngineStatus: 'RUNNING' | 'HALTED';
  activeUsersCount: number;
  uptimeSeconds: number;
  memoryUsageMb: number;
  eventsProcessed: number;
  databaseEntitiesCount: number;
  lastAuditTimestamp: string;
}

export type GeminiModelChoice =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  error?: boolean;
}

export interface ChatRolePreset {
  id: string;
  label: string;
  roleTag: string;
  description: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

// --- SURVEY SYSTEM (Anonymous vs Identified) ---
export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'RATING' | 'MULTIPLE_CHOICE' | 'TEXT' | 'BOOLEAN';
  options?: string[];
  required: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentRole: UserRole;
  // If isAnonymous is true on the survey, respondentUserId is null and never recorded
  respondentUserId?: string | null;
  answers: {
    questionId: string;
    value: string | number | boolean;
  }[];
  submittedAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetAudience: 'ALL' | 'STUDENTS' | 'FACULTY' | 'STAFF' | 'DEPARTMENT';
  targetDepartmentId?: string;
  isAnonymous: boolean; // ANONYMOUS: identity cannot be viewed by ANY role, including System Owner
  status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
  startDate: string;
  endDate: string;
  expiresAt?: string;
  questions: SurveyQuestion[];
  responsesCount: number;
  authorId: string;
  authorName: string;
  createdAt: string;
}

// --- CONFIDENTIAL REPORTING / PRIVATE GRIEVANCES ---
// Distinct from anonymous survey: reporter identity is encrypted and hidden from normal staff/faculty/students.
// ONLY System Owner can decrypt & view reporter identity with audited reason.
export interface ConfidentialReport {
  id: string;
  ticketCode: string;
  category: 'HARASSMENT' | 'ACADEMIC_INTEGRITY' | 'SAFETY_HAZARD' | 'FINANCIAL_FRAUD' | 'MISCONDUCT' | 'OTHER';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  reporterUserId: string;
  reporterName: string;
  reporterRole: UserRole;
  reporterRevealed: boolean;
  revealedBy?: string;
  revealedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- STUDENT ACADEMIC RISK INTELLIGENCE ---
export interface StudentRiskIndicator {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  departmentName: string;
  sectionName: string;
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  attendancePercentage: number;
  assignmentCompletionRate: number;
  cgpa: number;
  riskFactors: string[];
  recommendedAction: string;
}

// --- DIGITAL TWIN PHYSICAL ASSET TELEMETRY ---
export interface DigitalTwinNode {
  id: string;
  name: string;
  code: string;
  category: 'COMPUTING' | 'ADMIN' | 'RESEARCH' | 'LIBRARY' | 'SPORTS' | 'HOSTEL' | 'PERIMETER';
  x: number; // percentage on isometric map (0-100)
  y: number; // percentage on isometric map (0-100)
  floors: number;
  capacity: number;
  occupancy: number; // percentage (0-100)
  temperatureF: number;
  powerKw: number;
  airQualityAqi: number;
  activeLabs: string[];
  maintenanceAlerts: number;
  securityStatus: 'NORMAL' | 'ELEVATED' | 'LOCKED';
  description: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  weatherCondition?: string;
  weatherHumidity?: number;
  weatherWindMph?: number;
  weatherLastUpdated?: string;
  googleMapsUrl?: string;
}

