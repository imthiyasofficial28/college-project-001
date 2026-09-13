/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Production-Grade Relational In-Memory Database Engine with Disk Persistence
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Institution,
  Campus,
  Building,
  Room,
  Department,
  Program,
  AcademicYear,
  Semester,
  Section,
  Subject,
  User,
  Student,
  Faculty,
  Staff,
  AttendanceRecord,
  TimetableEntry,
  Assignment,
  Examination,
  ExamSchedule,
  Result,
  Announcement,
  Notification,
  Complaint,
  Facility,
  MaintenanceRequest,
  LibraryItem,
  LibraryTransaction,
  Hostel,
  HostelRoom,
  TransportRoute,
  Vehicle,
  Visitor,
  SecurityIncident,
  SecurityZone,
  AuditLog,
  AIInsight,
  RoleDefinition,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  ConfidentialReport,
  StudentRiskIndicator,
  DigitalTwinNode,
} from '../src/types/index.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cuois_database.json');

export interface DatabaseSchema {
  institution: Institution | null;
  campuses: Campus[];
  buildings: Building[];
  rooms: Room[];
  departments: Department[];
  programs: Program[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  sections: Section[];
  subjects: Subject[];
  users: (User & { passwordHash: string; salt: string })[];
  roles: RoleDefinition[];
  students: Student[];
  faculty: Faculty[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  assignments: Assignment[];
  examinations: Examination[];
  examSchedules: ExamSchedule[];
  results: Result[];
  announcements: Announcement[];
  notifications: Notification[];
  complaints: Complaint[];
  facilities: Facility[];
  maintenanceRequests: MaintenanceRequest[];
  libraryItems: LibraryItem[];
  libraryTransactions: LibraryTransaction[];
  hostels: Hostel[];
  hostelRooms: HostelRoom[];
  transportRoutes: TransportRoute[];
  vehicles: Vehicle[];
  visitors: Visitor[];
  securityIncidents: SecurityIncident[];
  securityZones: SecurityZone[];
  auditLogs: AuditLog[];
  aiInsights: AIInsight[];
  surveys: Survey[];
  surveyResponses: SurveyResponse[];
  confidentialReports: ConfidentialReport[];
  digitalTwinNodes: DigitalTwinNode[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return result === hash;
}

class DatabaseService {
  private data: DatabaseSchema;
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.getEmptySchema();
    this.init();
  }

  private getEmptySchema(): DatabaseSchema {
    return {
      institution: null,
      campuses: [],
      buildings: [],
      rooms: [],
      departments: [],
      programs: [],
      academicYears: [],
      semesters: [],
      sections: [],
      subjects: [],
      users: [],
      roles: this.getDefaultRoles(),
      students: [],
      faculty: [],
      staff: [],
      attendance: [],
      timetable: [],
      assignments: [],
      examinations: [],
      examSchedules: [],
      results: [],
      announcements: [],
      notifications: [],
      complaints: [],
      facilities: [],
      maintenanceRequests: [],
      libraryItems: [],
      libraryTransactions: [],
      hostels: [],
      hostelRooms: [],
      transportRoutes: [],
      vehicles: [],
      visitors: [],
      securityIncidents: [],
      securityZones: [],
      auditLogs: [],
      aiInsights: [],
      surveys: [],
      surveyResponses: [],
      confidentialReports: [],
      digitalTwinNodes: this.getDefaultDigitalTwinNodes(),
    };
  }

  private getDefaultRoles(): RoleDefinition[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'role_sys_owner',
        name: 'System Owner',
        code: 'SYSTEM_OWNER',
        description: 'Root authority with unrestricted access to all operations, security, and institutional modules',
        isSystem: true,
        permissions: ['*'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_admin',
        name: 'Administrator',
        code: 'ADMINISTRATOR',
        description: 'Full institutional operations, academic planning, facility management, and staff supervision',
        isSystem: true,
        permissions: [
          'academic:manage',
          'users:manage',
          'attendance:read',
          'facilities:manage',
          'complaints:manage',
          'reports:generate',
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_mgmt',
        name: 'Management',
        code: 'MANAGEMENT',
        description: 'Executive campus analytics, strategic intelligence, accreditation reports, and high-level KPIs',
        isSystem: true,
        permissions: ['analytics:view', 'reports:generate', 'audit:view', 'ai:query'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_faculty',
        name: 'Faculty Member',
        code: 'FACULTY',
        description: 'Course administration, attendance marking, student evaluation, assignments, and academic advisory',
        isSystem: true,
        permissions: [
          'attendance:mark',
          'attendance:read',
          'marks:enter',
          'assignments:manage',
          'students:view',
          'timetable:view',
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_staff',
        name: 'Operational Staff',
        code: 'STAFF',
        description: 'Facility operations, work orders, maintenance execution, lab equipment, and logistics',
        isSystem: true,
        permissions: ['maintenance:update', 'facilities:read', 'inventory:manage'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_security',
        name: 'Campus Security',
        code: 'SECURITY',
        description: 'Security operations center, visitor passes, gate control, incident logging, and emergency protocols',
        isSystem: true,
        permissions: [
          'security:incidents',
          'visitors:manage',
          'zones:monitor',
          'emergency:broadcast',
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role_student',
        name: 'Enrolled Student',
        code: 'STUDENT',
        description: 'Access personal attendance, semester timetable, assignments, exam results, library books, and grievance portal',
        isSystem: true,
        permissions: [
          'profile:self',
          'attendance:self',
          'timetable:self',
          'results:self',
          'complaints:submit',
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.getEmptySchema(), ...parsed };
        if (!this.data.digitalTwinNodes || this.data.digitalTwinNodes.length === 0) {
          this.data.digitalTwinNodes = this.getDefaultDigitalTwinNodes();
        }
        console.log('[CUOIS DB] Loaded database state from disk.');
      } else {
        // First-time empty institution initialization with pre-configured System Owner account ready
        this.data = this.getEmptySchema();
        this.persistImmediate();
        console.log('[CUOIS DB] Initialized clean empty database.');
      }
      // Guarantee Sovereign System Owner account (IMTHIYAS / Imthiyas@12345) exists and is active
      this.ensureSystemOwnerAccount();
      this.isLoaded = true;
    } catch (err) {
      console.error('[CUOIS DB] Initialization error:', err);
      this.data = this.getEmptySchema();
      this.isLoaded = true;
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistImmediate();
    }, 500);
  }

  private persistImmediate() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CUOIS DB] Error persisting database to disk:', err);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  // --- INSTITUTION MANAGEMENT ---
  public getInstitution(): Institution | null {
    return this.data.institution;
  }

  public bootstrapInstitution(payload: {
    institution: Partial<Institution>;
    owner: { fullName: string; email: string; password: string };
    template?: 'UNIVERSITY_ENTERPRISE' | 'BLANK';
  }): { institution: Institution; owner: User } {
    const now = new Date().toISOString();

    const instId = 'inst_01';
    const institution: Institution = {
      id: instId,
      name: payload.institution.name || 'Campus University',
      code: payload.institution.code || 'CUOIS',
      tagline: payload.institution.tagline || 'Unified Operations & Intelligence System • Architected by Imthiyas',
      establishedYear: payload.institution.establishedYear || 2025,
      address: payload.institution.address || 'Campus Command Center',
      timezone: payload.institution.timezone || 'UTC-5 (Eastern Standard Time)',
      academicCalendarType: payload.institution.academicCalendarType || 'SEMESTER',
      contactEmail: payload.institution.contactEmail || payload.owner.email || 'imthiyasofficial28@gmail.com',
      contactPhone: payload.institution.contactPhone || '+1 (555) 019-4820',
      website: payload.institution.website || '',
      accreditation: payload.institution.accreditation || 'Autonomous Sovereign Campus OS',
      isConfigured: true,
      currentAcademicYearId: 'ay_2025_2026',
      createdAt: now,
      updatedAt: now,
    };

    this.data.institution = institution;

    // Create Root System Owner
    const { hash, salt } = hashPassword(payload.owner.password || 'Cuois@2025');
    const ownerId = 'usr_owner_01';
    const ownerUser: User & { passwordHash: string; salt: string } = {
      id: ownerId,
      username: (payload.owner.email ? payload.owner.email.split('@')[0] : 'imthiyas') || 'imthiyas',
      email: payload.owner.email || 'imthiyasofficial28@gmail.com',
      fullName: payload.owner.fullName || 'Imthiyas',
      role: 'SYSTEM_OWNER',
      isActive: true,
      mfaEnabled: true,
      failedLoginAttempts: 0,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
      passwordHash: hash,
      salt: salt,
    };

    this.data.users = [ownerUser];

    // Seed Template Data if requested
    if (payload.template === 'UNIVERSITY_ENTERPRISE') {
      this.seedEnterpriseUniversityData(instId, ownerUser);
    } else {
      // Create bare minimum Academic Year
      this.data.academicYears = [
        {
          id: 'ay_2025_2026',
          name: '2025–2026',
          startDate: '2025-08-15',
          endDate: '2026-06-30',
          isCurrent: true,
          isArchived: false,
        },
      ];
    }

    this.logAudit({
      actorId: ownerUser.id,
      actorName: ownerUser.fullName,
      actorRole: 'SYSTEM_OWNER',
      action: 'BOOTSTRAP_INSTITUTION',
      entity: 'INSTITUTION',
      entityId: institution.id,
      newValue: JSON.stringify({ name: institution.name, template: payload.template || 'BLANK' }),
      ipAddress: '127.0.0.1',
    });

    this.persistImmediate();

    const { passwordHash: _, salt: __, ...cleanOwner } = ownerUser;
    return { institution, owner: cleanOwner };
  }

  // --- POPULATE COMPREHENSIVE UNIVERSITY TEMPLATE ---
  private seedEnterpriseUniversityData(institutionId: string, ownerUser: User) {
    const now = new Date().toISOString();

    // 1. Campus
    this.data.campuses = [
      {
        id: 'camp_main',
        institutionId,
        name: 'Main North Campus',
        code: 'MNC',
        address: '100 University Boulevard, Metro City',
        totalAreaAcres: 145,
        isActive: true,
        buildingsCount: 6,
      },
      {
        id: 'camp_south',
        institutionId,
        name: 'Medical & Health Sciences Campus',
        code: 'MSC',
        address: '45 Health Park Avenue, South District',
        totalAreaAcres: 60,
        isActive: true,
        buildingsCount: 2,
      },
    ];

    // 2. Buildings (configured with 3D coordinates for Digital Campus Twin)
    this.data.buildings = [
      {
        id: 'bld_turing',
        campusId: 'camp_main',
        name: 'Alan Turing School of Computing',
        code: 'CSB',
        floorsCount: 5,
        type: 'ACADEMIC',
        coordinates: { x: -30, y: 0, z: -20, width: 26, depth: 22, height: 28 },
        status: 'OPERATIONAL',
      },
      {
        id: 'bld_raman',
        campusId: 'camp_main',
        name: 'Sir C.V. Raman Science & Research Complex',
        code: 'RSC',
        floorsCount: 4,
        type: 'LABORATORY',
        coordinates: { x: 25, y: 0, z: -25, width: 24, depth: 20, height: 22 },
        status: 'OPERATIONAL',
      },
      {
        id: 'bld_library',
        campusId: 'camp_main',
        name: 'Central Knowledge Repository & Library',
        code: 'CKL',
        floorsCount: 3,
        type: 'LIBRARY',
        coordinates: { x: 0, y: 0, z: 15, width: 32, depth: 24, height: 18 },
        status: 'OPERATIONAL',
      },
      {
        id: 'bld_admin',
        campusId: 'camp_main',
        name: 'Chancellery & Administrative Tower',
        code: 'ADM',
        floorsCount: 6,
        type: 'ADMINISTRATIVE',
        coordinates: { x: -40, y: 0, z: 25, width: 18, depth: 18, height: 35 },
        status: 'OPERATIONAL',
      },
      {
        id: 'bld_hostel_a',
        campusId: 'camp_main',
        name: 'Aryabhata Residential Hall',
        code: 'ARH',
        floorsCount: 6,
        type: 'HOSTEL',
        coordinates: { x: 45, y: 0, z: 20, width: 28, depth: 16, height: 30 },
        status: 'OPERATIONAL',
      },
      {
        id: 'bld_sports',
        campusId: 'camp_main',
        name: 'Olympus Multi-Sport Arena & Gym',
        code: 'SPX',
        floorsCount: 2,
        type: 'SPORTS',
        coordinates: { x: 10, y: 0, z: 60, width: 36, depth: 30, height: 14 },
        status: 'OPERATIONAL',
      },
    ];

    // 3. Rooms
    this.data.rooms = [
      { id: 'rm_cs101', buildingId: 'bld_turing', roomNumber: 'CS-101', floor: 1, type: 'LECTURE_HALL', capacity: 120, hasProjector: true, hasAirConditioning: true, status: 'AVAILABLE' },
      { id: 'rm_cs102', buildingId: 'bld_turing', roomNumber: 'CS-102 (AI Lab)', floor: 1, type: 'LAB', capacity: 45, hasProjector: true, hasAirConditioning: true, status: 'OCCUPIED' },
      { id: 'rm_cs201', buildingId: 'bld_turing', roomNumber: 'CS-201', floor: 2, type: 'LECTURE_HALL', capacity: 90, hasProjector: true, hasAirConditioning: true, status: 'AVAILABLE' },
      { id: 'rm_cs205', buildingId: 'bld_turing', roomNumber: 'CS-205 (Networks Lab)', floor: 2, type: 'LAB', capacity: 50, hasProjector: true, hasAirConditioning: true, status: 'AVAILABLE' },
      { id: 'rm_rs101', buildingId: 'bld_raman', roomNumber: 'RS-101 (Physics Lab)', floor: 1, type: 'LAB', capacity: 40, hasProjector: true, hasAirConditioning: true, status: 'AVAILABLE' },
      { id: 'rm_rs202', buildingId: 'bld_raman', roomNumber: 'RS-202 (Nanotech Lab)', floor: 2, type: 'LAB', capacity: 30, hasProjector: true, hasAirConditioning: true, status: 'MAINTENANCE' },
      { id: 'rm_lib101', buildingId: 'bld_library', roomNumber: 'LIB-Media Center', floor: 1, type: 'SEMINAR_ROOM', capacity: 80, hasProjector: true, hasAirConditioning: true, status: 'AVAILABLE' },
      { id: 'rm_adm301', buildingId: 'bld_admin', roomNumber: 'ADM-Boardroom A', floor: 3, type: 'SEMINAR_ROOM', capacity: 35, hasProjector: true, hasAirConditioning: true, status: 'OCCUPIED' },
    ];

    // 4. Departments
    this.data.departments = [
      { id: 'dept_cs', name: 'Computer Science & Artificial Intelligence', code: 'CSAI', description: 'Department of Computing, Machine Learning, and Software Architecture', buildingId: 'bld_turing', programsCount: 2, facultyCount: 8, studentCount: 240 },
      { id: 'dept_ece', name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Embedded Systems, IoT, Semiconductor design, and Wireless Networks', buildingId: 'bld_turing', programsCount: 1, facultyCount: 5, studentCount: 120 },
      { id: 'dept_mech', name: 'Mechanical & Robotics Engineering', code: 'MRE', description: 'Mechatronics, Autonomous Systems, and Advanced Thermal Engineering', buildingId: 'bld_raman', programsCount: 1, facultyCount: 4, studentCount: 95 },
      { id: 'dept_business', name: 'School of Technology Management', code: 'STM', description: 'Business Analytics, FinTech, and Technology Entrepreneurship', buildingId: 'bld_admin', programsCount: 1, facultyCount: 4, studentCount: 80 },
    ];

    // 5. Programs
    this.data.programs = [
      { id: 'prog_btech_cs', departmentId: 'dept_cs', name: 'B.Tech in Computer Science & Engineering', code: 'BTECH-CS', degreeType: 'UNDERGRADUATE', durationYears: 4, totalSemesters: 8 },
      { id: 'prog_mtech_ai', departmentId: 'dept_cs', name: 'M.Tech in Artificial Intelligence & Robotics', code: 'MTECH-AI', degreeType: 'POSTGRADUATE', durationYears: 2, totalSemesters: 4 },
      { id: 'prog_btech_ece', departmentId: 'dept_ece', name: 'B.Tech in Electronics & VLSI Systems', code: 'BTECH-ECE', degreeType: 'UNDERGRADUATE', durationYears: 4, totalSemesters: 8 },
    ];

    // 6. Academic Years
    this.data.academicYears = [
      { id: 'ay_2024_2025', name: '2024–2025', startDate: '2024-08-15', endDate: '2025-06-25', isCurrent: false, isArchived: true },
      { id: 'ay_2025_2026', name: '2025–2026', startDate: '2025-08-15', endDate: '2026-06-30', isCurrent: true, isArchived: false },
    ];

    // 7. Semesters & Sections
    this.data.semesters = [
      { id: 'sem_f25_cs3', academicYearId: 'ay_2025_2026', programId: 'prog_btech_cs', semesterNumber: 3, name: 'Fall 2025 - Semester 3', startDate: '2025-08-18', endDate: '2025-12-20', isCurrent: true },
      { id: 'sem_f25_cs5', academicYearId: 'ay_2025_2026', programId: 'prog_btech_cs', semesterNumber: 5, name: 'Fall 2025 - Semester 5', startDate: '2025-08-18', endDate: '2025-12-20', isCurrent: true },
    ];

    this.data.sections = [
      { id: 'sec_cs3_a', semesterId: 'sem_f25_cs3', name: 'CS-3A', capacity: 60, academicYearId: 'ay_2025_2026' },
      { id: 'sec_cs3_b', semesterId: 'sem_f25_cs3', name: 'CS-3B', capacity: 60, academicYearId: 'ay_2025_2026' },
      { id: 'sec_cs5_a', semesterId: 'sem_f25_cs5', name: 'CS-5A', capacity: 55, academicYearId: 'ay_2025_2026' },
    ];

    // 8. Subjects
    this.data.subjects = [
      { id: 'sub_cs301', departmentId: 'dept_cs', name: 'Distributed Systems & Cloud Architecture', code: 'CS301', credits: 4, theoryHours: 3, labHours: 2, isElective: false },
      { id: 'sub_cs302', departmentId: 'dept_cs', name: 'Machine Learning & Neural Networks', code: 'CS302', credits: 4, theoryHours: 3, labHours: 2, isElective: false },
      { id: 'sub_cs303', departmentId: 'dept_cs', name: 'Database Internal Systems & Optimization', code: 'CS303', credits: 3, theoryHours: 3, labHours: 0, isElective: false },
      { id: 'sub_cs304', departmentId: 'dept_cs', name: 'Cybersecurity & Cryptographic Protocols', code: 'CS304', credits: 3, theoryHours: 2, labHours: 2, isElective: true },
    ];

    // 9. Faculty & Demo Accounts
    const defaultPw = hashPassword('cuois@Admin2025');

    const demoUsers: (User & { passwordHash: string; salt: string })[] = [
      {
        id: 'usr_admin_01',
        username: 'admin',
        email: 'admin@aust.edu',
        fullName: 'Dr. Evelyn Vance',
        role: 'ADMINISTRATOR',
        isActive: true,
        departmentId: 'dept_cs',
        mfaEnabled: true,
        failedLoginAttempts: 0,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
        passwordHash: defaultPw.hash,
        salt: defaultPw.salt,
      },
      {
        id: 'usr_faculty_01',
        username: 'prof.chen',
        email: 'marcus.chen@aust.edu',
        fullName: 'Prof. Marcus Chen',
        role: 'FACULTY',
        isActive: true,
        departmentId: 'dept_cs',
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
        passwordHash: defaultPw.hash,
        salt: defaultPw.salt,
      },
      {
        id: 'usr_student_01',
        username: 'aravind.sharma',
        email: 'aravind.s@student.aust.edu',
        fullName: 'Aravind Sharma',
        role: 'STUDENT',
        isActive: true,
        departmentId: 'dept_cs',
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
        passwordHash: defaultPw.hash,
        salt: defaultPw.salt,
      },
      {
        id: 'usr_security_01',
        username: 'chief.ramirez',
        email: 'security.lead@aust.edu',
        fullName: 'Chief Hector Ramirez',
        role: 'SECURITY',
        isActive: true,
        mfaEnabled: true,
        failedLoginAttempts: 0,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
        passwordHash: defaultPw.hash,
        salt: defaultPw.salt,
      },
    ];

    this.data.users = [this.data.users[0], ...demoUsers];

    this.data.faculty = [
      {
        id: 'fac_01',
        userId: 'usr_faculty_01',
        employeeCode: 'FAC-1002',
        fullName: 'Prof. Marcus Chen',
        email: 'marcus.chen@aust.edu',
        phone: '+1 (555) 432-1920',
        departmentId: 'dept_cs',
        departmentName: 'Computer Science & AI',
        designation: 'PROFESSOR',
        specialization: 'Distributed Systems & Edge Computing',
        qualification: 'Ph.D. in Computer Science (MIT)',
        joiningDate: '2016-08-01',
        workloadHoursPerWeek: 16,
        status: 'ACTIVE',
      },
      {
        id: 'fac_02',
        userId: 'usr_faculty_02',
        employeeCode: 'FAC-1008',
        fullName: 'Dr. Sarah Lin',
        email: 'sarah.lin@aust.edu',
        phone: '+1 (555) 432-1928',
        departmentId: 'dept_cs',
        departmentName: 'Computer Science & AI',
        designation: 'ASSOCIATE_PROFESSOR',
        specialization: 'Deep Learning & Computer Vision',
        qualification: 'Ph.D. in AI (Stanford)',
        joiningDate: '2018-01-15',
        workloadHoursPerWeek: 14,
        status: 'ACTIVE',
      },
    ];

    // 10. Students
    this.data.students = [
      {
        id: 'stud_01',
        userId: 'usr_student_01',
        registrationNumber: 'AUST2023CS042',
        rollNumber: '23CS042',
        fullName: 'Aravind Sharma',
        email: 'aravind.s@student.aust.edu',
        phone: '+1 (555) 912-8821',
        programId: 'prog_btech_cs',
        programName: 'B.Tech in Computer Science',
        departmentId: 'dept_cs',
        departmentName: 'Computer Science & AI',
        currentSemester: 3,
        sectionId: 'sec_cs3_a',
        sectionName: 'CS-3A',
        admissionDate: '2023-08-20',
        status: 'ACTIVE',
        cgpa: 3.84,
        attendancePercentage: 88.5,
        guardianName: 'Rajesh Sharma',
        guardianPhone: '+1 (555) 912-8800',
      },
      {
        id: 'stud_02',
        userId: 'usr_stud_02',
        registrationNumber: 'AUST2023CS048',
        rollNumber: '23CS048',
        fullName: 'Elena Rostova',
        email: 'elena.r@student.aust.edu',
        phone: '+1 (555) 912-8845',
        programId: 'prog_btech_cs',
        programName: 'B.Tech in Computer Science',
        departmentId: 'dept_cs',
        departmentName: 'Computer Science & AI',
        currentSemester: 3,
        sectionId: 'sec_cs3_a',
        sectionName: 'CS-3A',
        admissionDate: '2023-08-20',
        status: 'ACTIVE',
        cgpa: 3.92,
        attendancePercentage: 94.2,
        guardianName: 'Dmitri Rostov',
        guardianPhone: '+1 (555) 912-8805',
      },
      {
        id: 'stud_03',
        userId: 'usr_stud_03',
        registrationNumber: 'AUST2023CS061',
        rollNumber: '23CS061',
        fullName: 'Jordan Miller',
        email: 'jordan.m@student.aust.edu',
        phone: '+1 (555) 912-8877',
        programId: 'prog_btech_cs',
        programName: 'B.Tech in Computer Science',
        departmentId: 'dept_cs',
        departmentName: 'Computer Science & AI',
        currentSemester: 3,
        sectionId: 'sec_cs3_a',
        sectionName: 'CS-3A',
        admissionDate: '2023-08-20',
        status: 'ACTIVE',
        cgpa: 2.78,
        attendancePercentage: 71.4, // Shortage!
        guardianName: 'Patricia Miller',
        guardianPhone: '+1 (555) 912-8812',
      },
    ];

    // 11. Staff
    this.data.staff = [
      {
        id: 'stf_01',
        userId: 'usr_staff_01',
        employeeCode: 'STF-501',
        fullName: 'Carlos Gomez',
        email: 'carlos.g@aust.edu',
        phone: '+1 (555) 881-2299',
        departmentId: 'dept_cs',
        roleTitle: 'Senior HPC Systems Administrator',
        category: 'LAB_TECHNICIAN',
        status: 'ACTIVE',
      },
      {
        id: 'stf_02',
        userId: 'usr_staff_02',
        employeeCode: 'STF-509',
        fullName: 'Devon Hayes',
        email: 'devon.h@aust.edu',
        phone: '+1 (555) 881-2344',
        roleTitle: 'Facilities & HVAC Lead',
        category: 'FACILITY_MAINTENANCE',
        status: 'ACTIVE',
      },
    ];

    // 12. Attendance Records
    this.data.attendance = [
      { id: 'att_1', academicYearId: 'ay_2025_2026', subjectId: 'sub_cs301', subjectName: 'Distributed Systems', sectionId: 'sec_cs3_a', studentId: 'stud_01', studentName: 'Aravind Sharma', registrationNumber: 'AUST2023CS042', facultyId: 'fac_01', date: '2025-09-10', status: 'PRESENT', createdAt: now },
      { id: 'att_2', academicYearId: 'ay_2025_2026', subjectId: 'sub_cs301', subjectName: 'Distributed Systems', sectionId: 'sec_cs3_a', studentId: 'stud_02', studentName: 'Elena Rostova', registrationNumber: 'AUST2023CS048', facultyId: 'fac_01', date: '2025-09-10', status: 'PRESENT', createdAt: now },
      { id: 'att_3', academicYearId: 'ay_2025_2026', subjectId: 'sub_cs301', subjectName: 'Distributed Systems', sectionId: 'sec_cs3_a', studentId: 'stud_03', studentName: 'Jordan Miller', registrationNumber: 'AUST2023CS061', facultyId: 'fac_01', date: '2025-09-10', status: 'ABSENT', remarks: 'Medical notice pending', createdAt: now },
      { id: 'att_4', academicYearId: 'ay_2025_2026', subjectId: 'sub_cs302', subjectName: 'Machine Learning', sectionId: 'sec_cs3_a', studentId: 'stud_01', studentName: 'Aravind Sharma', registrationNumber: 'AUST2023CS042', facultyId: 'fac_02', date: '2025-09-11', status: 'PRESENT', createdAt: now },
      { id: 'att_5', academicYearId: 'ay_2025_2026', subjectId: 'sub_cs302', subjectName: 'Machine Learning', sectionId: 'sec_cs3_a', studentId: 'stud_03', studentName: 'Jordan Miller', registrationNumber: 'AUST2023CS061', facultyId: 'fac_02', date: '2025-09-11', status: 'ABSENT', remarks: 'Unexcused', createdAt: now },
    ];

    // 13. Timetable (Conflict-free baseline)
    this.data.timetable = [
      { id: 'tt_1', academicYearId: 'ay_2025_2026', sectionId: 'sec_cs3_a', sectionName: 'CS-3A', subjectId: 'sub_cs301', subjectName: 'Distributed Systems', facultyId: 'fac_01', facultyName: 'Prof. Marcus Chen', roomId: 'rm_cs101', roomNumber: 'CS-101', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', periodIndex: 1 },
      { id: 'tt_2', academicYearId: 'ay_2025_2026', sectionId: 'sec_cs3_a', sectionName: 'CS-3A', subjectId: 'sub_cs302', subjectName: 'Machine Learning', facultyId: 'fac_02', facultyName: 'Dr. Sarah Lin', roomId: 'rm_cs102', roomNumber: 'CS-102 (AI Lab)', dayOfWeek: 'MONDAY', startTime: '10:15', endTime: '11:15', periodIndex: 2 },
      { id: 'tt_3', academicYearId: 'ay_2025_2026', sectionId: 'sec_cs3_a', sectionName: 'CS-3A', subjectId: 'sub_cs303', subjectName: 'Database Internals', facultyId: 'fac_01', facultyName: 'Prof. Marcus Chen', roomId: 'rm_cs101', roomNumber: 'CS-101', dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:00', periodIndex: 1 },
      { id: 'tt_4', academicYearId: 'ay_2025_2026', sectionId: 'sec_cs3_a', sectionName: 'CS-3A', subjectId: 'sub_cs304', subjectName: 'Cybersecurity', facultyId: 'fac_02', facultyName: 'Dr. Sarah Lin', roomId: 'rm_cs205', roomNumber: 'CS-205 (Networks Lab)', dayOfWeek: 'WEDNESDAY', startTime: '11:30', endTime: '12:30', periodIndex: 3 },
    ];

    // 14. Library
    this.data.libraryItems = [
      { id: 'lib_01', isbn: '978-0134494166', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', category: 'Computing & Systems', totalCopies: 12, availableCopies: 9, shelfLocation: 'Stack 4-B', callNumber: 'QA76.9 .K54' },
      { id: 'lib_02', isbn: '978-0262035613', title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', category: 'Artificial Intelligence', totalCopies: 8, availableCopies: 4, shelfLocation: 'Stack 3-A', callNumber: 'Q325.5 .G66' },
      { id: 'lib_03', isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Craftsmanship', author: 'Robert C. Martin', category: 'Software Engineering', totalCopies: 15, availableCopies: 11, shelfLocation: 'Stack 2-C', callNumber: 'QA76.76 .M37' },
    ];

    this.data.libraryTransactions = [
      { id: 'tx_lib_01', itemId: 'lib_01', itemTitle: 'Designing Data-Intensive Applications', userId: 'usr_student_01', userName: 'Aravind Sharma', userRole: 'STUDENT', issueDate: '2025-09-01', dueDate: '2025-09-21', returnDate: null, status: 'ISSUED', fineAmount: 0 },
      { id: 'tx_lib_02', itemId: 'lib_02', itemTitle: 'Deep Learning', userId: 'usr_stud_03', userName: 'Jordan Miller', userRole: 'STUDENT', issueDate: '2025-08-15', dueDate: '2025-09-05', returnDate: null, status: 'OVERDUE', fineAmount: 14.0 },
    ];

    // 15. Complaints & Grievances
    this.data.complaints = [
      {
        id: 'cmp_101',
        ticketNumber: 'CMP-2025-0042',
        title: 'Air conditioning malfunction in Turing CS-102 Lab',
        description: 'Server racks and GPU workstations are overheating. Ambient temperature exceeds 82°F.',
        category: 'FACILITIES',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        submittedByUserId: 'usr_faculty_01',
        submittedByName: 'Prof. Marcus Chen',
        assignedToStaffId: 'stf_02',
        assignedToName: 'Devon Hayes',
        resolutionNotes: 'Compressor unit serviced, coolant refill underway.',
        slaHours: 24,
        createdAt: '2025-09-11T08:30:00Z',
        updatedAt: now,
      },
      {
        id: 'cmp_102',
        ticketNumber: 'CMP-2025-0043',
        title: 'Hostel Block A 3rd Floor Wi-Fi Access Point Offline',
        description: 'No network connectivity for students in rooms 301–312 since 21:00 yesterday.',
        category: 'HOSTEL',
        priority: 'MEDIUM',
        status: 'OPEN',
        submittedByUserId: 'usr_student_01',
        submittedByName: 'Aravind Sharma',
        slaHours: 48,
        createdAt: '2025-09-12T07:15:00Z',
        updatedAt: now,
      },
    ];

    // 16. Facilities & Maintenance
    this.data.facilities = [
      { id: 'fac_aud_01', name: 'Grand Centennial Auditorium', type: 'AUDITORIUM', buildingId: 'bld_admin', buildingName: 'Chancellery Tower', capacity: 1200, status: 'OPERATIONAL', equipmentDetails: '4K Christie laser projection, Meyer Sound line array, stage automation' },
      { id: 'fac_gym_01', name: 'Varsity Aquatic & Fitness Center', type: 'GYMNASIUM', buildingId: 'bld_sports', buildingName: 'Olympus Multi-Sport Arena', capacity: 350, status: 'OPERATIONAL', equipmentDetails: 'Olympic lap pool, power racks, cardio rowers' },
      { id: 'fac_srv_01', name: 'Primary Datacenter & HPC Cluster', type: 'SERVER_ROOM', buildingId: 'bld_turing', buildingName: 'Alan Turing School of Computing', capacity: 20, status: 'OPERATIONAL', equipmentDetails: '128-node NVIDIA DGX H100 cluster, dual redundant UPS, FM-200 fire suppression' },
    ];

    this.data.maintenanceRequests = [
      {
        id: 'maint_01',
        code: 'MR-904',
        facilityOrRoomId: 'rm_rs202',
        locationName: 'Raman Complex — Nanotech Lab RS-202',
        issueDescription: 'Cleanroom positive pressure sensor calibration and HEPA filter replacement',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        requestedByUserId: ownerUser.id,
        requestedByName: ownerUser.fullName,
        assignedToStaffId: 'stf_02',
        assignedToStaffName: 'Devon Hayes',
        estimatedCost: 1850,
        createdAt: '2025-09-09T10:00:00Z',
        updatedAt: now,
      },
    ];

    // 17. Hostel
    this.data.hostels = [
      { id: 'hst_01', name: 'Aryabhata Residential Hall', code: 'HST-ARYA', gender: 'MALE', wardenName: 'Dr. Alok Verma', wardenPhone: '+1 (555) 781-9921', totalFloors: 6, totalBeds: 480, occupiedBeds: 442 },
      { id: 'hst_02', name: 'Gargi Hall of Residence', code: 'HST-GARG', gender: 'FEMALE', wardenName: 'Dr. Meera Sen', wardenPhone: '+1 (555) 781-9925', totalFloors: 5, totalBeds: 400, occupiedBeds: 388 },
    ];

    // 18. Transport Fleet
    this.data.vehicles = [
      { id: 'veh_01', registrationNumber: 'AUST-BUS-01', type: 'BUS', capacity: 54, status: 'ACTIVE', fuelLevelPercent: 88, driverName: 'Samuel Brooks', lastServiceDate: '2025-08-28' },
      { id: 'veh_02', registrationNumber: 'AUST-BUS-02', type: 'BUS', capacity: 54, status: 'ACTIVE', fuelLevelPercent: 72, driverName: 'Tariq Al-Mansoor', lastServiceDate: '2025-09-02' },
      { id: 'veh_03', registrationNumber: 'AUST-SEC-01', type: 'CAMPUS_SECURITY', capacity: 5, status: 'ACTIVE', fuelLevelPercent: 95, driverName: 'Officer Miller', lastServiceDate: '2025-09-01' },
    ];

    this.data.transportRoutes = [
      { id: 'rt_01', name: 'Route 1 — Metro West Express', routeCode: 'MWE-1', startPoint: 'West Metro Central', endPoint: 'Main North Campus', stops: ['West Metro', 'Tech Park North', 'Hillside Station', 'Campus Gate 1'], departureTime: '07:30 AM', assignedVehicleId: 'veh_01', assignedVehiclePlate: 'AUST-BUS-01', driverName: 'Samuel Brooks', driverPhone: '+1 (555) 833-1021', totalCapacity: 54, registeredPassengersCount: 52 },
    ];

    // 19. Visitors
    this.data.visitors = [
      { id: 'vis_01', passNumber: 'VP-8491', fullName: 'Dr. Aris Thorne', contactNumber: '+1 (555) 672-9011', purpose: 'ACADEMIC_GUEST', hostUserId: 'usr_faculty_01', hostName: 'Prof. Marcus Chen', entryTimestamp: '2025-09-12T09:15:00Z', exitTimestamp: null, status: 'CHECKED_IN', securityOfficerName: 'Chief Hector Ramirez', vehicleNumber: 'CA-9K23' },
      { id: 'vis_02', passNumber: 'VP-8490', fullName: 'Claire DuPont', contactNumber: '+1 (555) 672-9055', purpose: 'VENDOR', hostUserId: 'usr_staff_02', hostName: 'Devon Hayes', entryTimestamp: '2025-09-12T08:00:00Z', exitTimestamp: '2025-09-12T10:30:00Z', status: 'CHECKED_OUT', securityOfficerName: 'Chief Hector Ramirez' },
    ];

    // 20. Security Operations
    this.data.securityZones = [
      { id: 'sec_z1', name: 'Public Perimeter & Main Gates', code: 'Z-PUBLIC', clearanceLevel: 'PUBLIC', status: 'NORMAL', activeGuardsCount: 6, cameraStreamsCount: 16 },
      { id: 'sec_z2', name: 'Academic Labs & Lecture Complexes', code: 'Z-ACAD', clearanceLevel: 'STUDENT', status: 'NORMAL', activeGuardsCount: 4, cameraStreamsCount: 28 },
      { id: 'sec_z3', name: 'Chancellery & Examination Archives', code: 'Z-EXAM', clearanceLevel: 'ADMIN_RESTRICTED', status: 'NORMAL', activeGuardsCount: 2, cameraStreamsCount: 8 },
      { id: 'sec_z4', name: 'Primary Datacenter & HPC Floor', code: 'Z-HPC', clearanceLevel: 'LEVEL_4_SECURE', status: 'NORMAL', activeGuardsCount: 2, cameraStreamsCount: 6 },
    ];

    this.data.securityIncidents = [
      {
        id: 'inc_01',
        incidentCode: 'SEC-2025-081',
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        location: 'Turing CS-205 Networks Lab',
        description: 'Badge scan attempt with expired guest credentials after 20:00. Door interlock held.',
        status: 'RESOLVED',
        reportedBy: 'Automated Access Control Telemetry',
        assignedOfficer: 'Chief Hector Ramirez',
        reportedAt: '2025-09-11T20:14:00Z',
        resolvedAt: '2025-09-11T20:25:00Z',
      },
    ];

    // 21. Announcements & Notifications
    this.data.announcements = [
      {
        id: 'ann_01',
        title: 'Mid-Term Examination Schedule Published for Fall 2025',
        content: 'Official schedules for all undergraduate and graduate courses have been finalized and are available in the Examinations portal.',
        authorId: ownerUser.id,
        authorName: ownerUser.fullName,
        authorRole: 'SYSTEM_OWNER',
        targetAudience: 'ALL',
        priority: 'HIGH',
        category: 'ACADEMIC',
        isPinned: true,
        createdAt: '2025-09-11T12:00:00Z',
      },
      {
        id: 'ann_02',
        title: 'Scheduled Electrical Grid Diagnostic: Raman Complex',
        content: 'Auxiliary backup generators will undergo switchover testing on Saturday between 06:00 and 08:00 AM. Server loads are isolated.',
        authorId: 'usr_admin_01',
        authorName: 'Dr. Evelyn Vance',
        authorRole: 'ADMINISTRATOR',
        targetAudience: 'FACULTY',
        priority: 'NORMAL',
        category: 'FACILITY',
        isPinned: false,
        createdAt: '2025-09-12T08:00:00Z',
      },
    ];

    this.data.notifications = [
      {
        id: 'notif_01',
        recipientId: 'ALL',
        title: 'System Intelligence Update',
        message: 'Real-time telemetry stream synchronized across 6 campus facilities.',
        priority: 'INFO',
        module: 'COMMAND_CENTER',
        isRead: false,
        createdAt: now,
      },
      {
        id: 'notif_02',
        recipientId: 'usr_faculty_01',
        title: 'Low Attendance Alert: CS-3A',
        message: 'One student has breached the mandatory 75% attendance threshold in CS301.',
        priority: 'WARNING',
        module: 'ATTENDANCE',
        isRead: false,
        createdAt: now,
      },
    ];

    // 22. AI Insights (Fact, Calculation, Prediction, Recommendation)
    this.data.aiInsights = [
      {
        id: 'ai_01',
        type: 'CALCULATION',
        category: 'ATTENDANCE',
        title: 'Attendance Shortage Risk Detected in CS-3A',
        content: 'Student Jordan Miller (23CS061) currently stands at 71.4% attendance across CS301 & CS302. Minimum institutional requirement is 75.0%.',
        metric: '71.4% (Threshold: 75%)',
        confidenceScore: 0.99,
        suggestedAction: 'Issue automated advisory notice to student and academic advisor Prof. Marcus Chen.',
        generatedAt: now,
      },
      {
        id: 'ai_02',
        type: 'FACT',
        category: 'MAINTENANCE',
        title: 'Open Critical Facilities Work Order',
        content: 'Turing CS-102 AI Lab cooling performance is degraded (Ticket CMP-2025-0042 assigned to Devon Hayes).',
        metric: '1 Pending Critical Ticket',
        confidenceScore: 1.0,
        suggestedAction: 'Monitor equipment sensor logs until temperature stabilizes below 72°F.',
        generatedAt: now,
      },
      {
        id: 'ai_03',
        type: 'PREDICTION',
        category: 'PERFORMANCE',
        title: 'Examination Room Saturation Forecast',
        content: 'Based on enrolled cohorts in CS301 and CS302, Lecture Hall CS-101 will reach 98% seating capacity during Mid-Term week.',
        metric: '118/120 Desks Projected',
        confidenceScore: 0.94,
        suggestedAction: 'Split Section CS-3B into Turing CS-201 to maintain comfortable proctoring distance.',
        generatedAt: now,
      },
      {
        id: 'ai_04',
        type: 'RECOMMENDATION',
        category: 'EFFICIENCY',
        title: 'Library Reserve Rebalance for Martin Kleppmann Book',
        content: 'Borrow velocity for "Designing Data-Intensive Applications" increased by 65% following assignment launch.',
        metric: '9 of 12 Copies Circulated',
        confidenceScore: 0.88,
        suggestedAction: 'Place 2 additional digital reference copies on 24-hour reserve in Central Knowledge Repository.',
        generatedAt: now,
      },
    ];

    // 23. Campus Surveys (Anonymous vs Identified)
    this.data.surveys = [
      {
        id: 'srv_01',
        title: 'Fall 2025 Campus Computing & AI Lab Experience',
        description: 'Help us improve compute cluster availability, GPU queues, and lab workstations. Responses are strictly ANONYMOUS.',
        targetAudience: 'STUDENTS',
        isAnonymous: true,
        status: 'ACTIVE',
        startDate: '2025-09-01T00:00:00Z',
        endDate: '2025-10-15T23:59:59Z',
        questions: [
          {
            id: 'q1',
            text: 'How satisfied are you with workstation performance and network latency in Turing Labs?',
            type: 'RATING',
            required: true,
          },
          {
            id: 'q2',
            text: 'Which primary development stack do you utilize for coursework projects?',
            type: 'MULTIPLE_CHOICE',
            options: ['Python / PyTorch', 'TypeScript / Node.js', 'C++ / Systems', 'Java / Kotlin', 'Rust'],
            required: true,
          },
          {
            id: 'q3',
            text: 'Would extended 24-hour weekend access to CS-202 benefit your project workflow?',
            type: 'BOOLEAN',
            required: true,
          },
          {
            id: 'q4',
            text: 'Any additional feedback on lab equipment or climate control?',
            type: 'TEXT',
            required: false,
          },
        ],
        responsesCount: 42,
        authorId: ownerUser.id,
        authorName: ownerUser.fullName,
        createdAt: '2025-09-01T10:00:00Z',
      },
      {
        id: 'srv_02',
        title: 'Faculty Classroom Audiovisual & Smart Podium Feedback',
        description: 'Evaluating classroom smart podiums, digital stylus monitors, and lecture capture systems.',
        targetAudience: 'FACULTY',
        isAnonymous: true,
        status: 'ACTIVE',
        startDate: '2025-09-05T00:00:00Z',
        endDate: '2025-10-30T23:59:59Z',
        questions: [
          {
            id: 'fq1',
            text: 'Rate the reliability of the wireless projection systems in lecture halls',
            type: 'RATING',
            required: true,
          },
          {
            id: 'fq2',
            text: 'What additional software licenses are urgently needed for classroom demonstrations?',
            type: 'TEXT',
            required: false,
          },
        ],
        responsesCount: 18,
        authorId: ownerUser.id,
        authorName: ownerUser.fullName,
        createdAt: '2025-09-05T09:00:00Z',
      },
    ];

    // 24. Confidential Whistleblower & Grievance Reports
    // Note: Identity is encrypted and hidden. Only System Owner can view decrypted reporter details.
    this.data.confidentialReports = [
      {
        id: 'cr_01',
        ticketCode: 'CR-2025-0012',
        category: 'SAFETY_HAZARD',
        subject: 'Improper storage of solvent drums near electrical conduit in Raman Sub-basement',
        description: 'During after-hours lab work, observed chemical containers placed in the auxiliary generator switch room, obstructing emergency shut-off access.',
        priority: 'HIGH',
        status: 'INVESTIGATING',
        reporterUserId: 'usr_student_01',
        reporterName: 'Marcus Chen',
        reporterRole: 'STUDENT',
        reporterRevealed: false,
        createdAt: '2025-09-10T14:32:00Z',
        updatedAt: '2025-09-11T09:15:00Z',
      },
      {
        id: 'cr_02',
        ticketCode: 'CR-2025-0014',
        category: 'ACADEMIC_INTEGRITY',
        subject: 'Unauthorized distribution of preliminary test solutions via private messaging group',
        description: 'Suspected distribution of compromised quiz materials prior to official examination window.',
        priority: 'MEDIUM',
        status: 'UNDER_REVIEW',
        reporterUserId: 'usr_faculty_01',
        reporterName: 'Prof. Marcus Chen',
        reporterRole: 'FACULTY',
        reporterRevealed: false,
        createdAt: '2025-09-11T16:45:00Z',
        updatedAt: '2025-09-11T16:45:00Z',
      },
    ];
  }

  // --- CRUD HELPERS FOR CORE MODULES ---

  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash: _, salt: __, ...user }) => user);
  }

  public ensureSystemOwnerAccount(): void {
    const creds = hashPassword('Imthiyas@12345');
    const now = new Date().toISOString();

    // Check if user with username IMTHIYAS or email imthiyasofficial28@gmail.com or role SYSTEM_OWNER exists
    const existingIndex = this.data.users.findIndex(
      (u) =>
        (u.username && u.username.toUpperCase() === 'IMTHIYAS') ||
        (u.email && u.email.toLowerCase() === 'imthiyasofficial28@gmail.com') ||
        u.role === 'SYSTEM_OWNER'
    );

    if (existingIndex !== -1) {
      this.data.users[existingIndex].username = 'IMTHIYAS';
      this.data.users[existingIndex].email = 'imthiyasofficial28@gmail.com';
      this.data.users[existingIndex].fullName = 'Imthiyas';
      this.data.users[existingIndex].role = 'SYSTEM_OWNER';
      this.data.users[existingIndex].isActive = true;
      this.data.users[existingIndex].passwordHash = creds.hash;
      this.data.users[existingIndex].salt = creds.salt;
      this.data.users[existingIndex].failedLoginAttempts = 0;
      this.data.users[existingIndex].lockedUntil = null;
      this.data.users[existingIndex].updatedAt = now;
      console.log('[CUOIS DB] Sovereign System Owner (IMTHIYAS) account verified and secured.');
    } else {
      const ownerUser: User & { passwordHash: string; salt: string } = {
        id: 'usr_owner_01',
        username: 'IMTHIYAS',
        email: 'imthiyasofficial28@gmail.com',
        fullName: 'Imthiyas',
        role: 'SYSTEM_OWNER',
        isActive: true,
        mfaEnabled: true,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
        passwordHash: creds.hash,
        salt: creds.salt,
      };
      this.data.users.unshift(ownerUser);
      console.log('[CUOIS DB] Created Sovereign System Owner (IMTHIYAS) master account.');
    }
    this.persistImmediate();
  }

  public findUserById(id: string): (User & { passwordHash: string; salt: string }) | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): (User & { passwordHash: string; salt: string }) | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByIdentifier(identifier: string): (User & { passwordHash: string; salt: string }) | undefined {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return undefined;
    return this.data.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.id && u.id.toLowerCase() === clean)
    );
  }

  public createUser(userPayload: Partial<User> & { password?: string }): User {
    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const username = (userPayload.username || (userPayload.email ? userPayload.email.split('@')[0] : `user_${id}`)).trim();
    const email = (userPayload.email || `${username.toLowerCase()}@campus.local`).trim().toLowerCase();

    // Check duplicate username or email
    const duplicate = this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email
    );
    if (duplicate) {
      throw new Error(`A user with Member ID "${username}" or email "${email}" already exists.`);
    }

    const { hash, salt } = hashPassword(userPayload.password || 'Campus@12345');

    const newUser: User & { passwordHash: string; salt: string } = {
      id,
      username,
      email,
      fullName: userPayload.fullName?.trim() || 'Unnamed Member',
      role: userPayload.role || 'STUDENT',
      isActive: userPayload.isActive ?? true,
      departmentId: userPayload.departmentId,
      phone: userPayload.phone,
      bio: userPayload.bio,
      avatarUrl: userPayload.avatarUrl,
      mfaEnabled: userPayload.mfaEnabled ?? false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
      passwordHash: hash,
      salt: salt,
    };

    this.data.users.push(newUser);
    this.scheduleSave();

    const { passwordHash: _, salt: __, ...cleanUser } = newUser;
    return cleanUser;
  }

  public updateUser(id: string, updates: Partial<User> & { password?: string }): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    const existing = this.data.users[idx];

    // If username is being changed, ensure it is unique
    if (updates.username && updates.username.trim().toLowerCase() !== existing.username.toLowerCase()) {
      const duplicate = this.data.users.find(
        (u) => u.id !== id && u.username.toLowerCase() === updates.username!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Member ID "${updates.username}" is already taken by another user.`);
      }
    }

    let newHash = existing.passwordHash;
    let newSalt = existing.salt;

    if (updates.password && updates.password.trim()) {
      const creds = hashPassword(updates.password.trim());
      newHash = creds.hash;
      newSalt = creds.salt;
    }

    const updated: User & { passwordHash: string; salt: string } = {
      ...existing,
      ...updates,
      username: updates.username ? updates.username.trim() : existing.username,
      email: updates.email ? updates.email.trim().toLowerCase() : existing.email,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
      passwordHash: newHash,
      salt: newSalt,
      updatedAt: new Date().toISOString(),
    };

    this.data.users[idx] = updated;
    this.scheduleSave();

    const { passwordHash: _, salt: __, ...cleanUser } = updated;
    return cleanUser;
  }

  public resetUserPassword(userId: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    this.scheduleSave();
    return true;
  }

  public changeUserPassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
    bypassCurrentCheck: boolean = false
  ): { success: boolean; error?: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    if (!bypassCurrentCheck) {
      if (!currentPassword) {
        return { success: false, error: 'Current password is required.' };
      }
      const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isValid) {
        return { success: false, error: 'Current password does not match.' };
      }
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    this.scheduleSave();
    return { success: true };
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    // Don't delete system owner
    if (this.data.users[idx].role === 'SYSTEM_OWNER') {
      return false;
    }
    this.data.users.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  // --- ATTENDANCE ---
  public getAttendance(): AttendanceRecord[] {
    return this.data.attendance;
  }

  public markAttendance(records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]): AttendanceRecord[] {
    const now = new Date().toISOString();
    const created: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att_${Date.now()}_${i}`,
      createdAt: now,
    }));

    this.data.attendance.push(...created);
    this.scheduleSave();
    return created;
  }

  // --- TIMETABLE WITH CONFLICT DETECTION ---
  public getTimetable(): TimetableEntry[] {
    return this.data.timetable;
  }

  public addTimetableEntry(entry: Omit<TimetableEntry, 'id'>): { entry?: TimetableEntry; conflict?: string } {
    // 1. Check Room conflict
    const roomConflict = this.data.timetable.find(
      (t) =>
        t.dayOfWeek === entry.dayOfWeek &&
        t.roomId === entry.roomId &&
        t.periodIndex === entry.periodIndex &&
        t.academicYearId === entry.academicYearId
    );
    if (roomConflict) {
      return { conflict: `Room collision: ${roomConflict.roomNumber || 'Room'} is already booked by ${roomConflict.subjectName || 'another class'} in Period ${entry.periodIndex} on ${entry.dayOfWeek}.` };
    }

    // 2. Check Faculty conflict
    const facultyConflict = this.data.timetable.find(
      (t) =>
        t.dayOfWeek === entry.dayOfWeek &&
        t.facultyId === entry.facultyId &&
        t.periodIndex === entry.periodIndex &&
        t.academicYearId === entry.academicYearId
    );
    if (facultyConflict) {
      return { conflict: `Faculty collision: ${facultyConflict.facultyName || 'Faculty'} is already scheduled with section ${facultyConflict.sectionName || ''} at this time.` };
    }

    // 3. Check Section conflict
    const sectionConflict = this.data.timetable.find(
      (t) =>
        t.dayOfWeek === entry.dayOfWeek &&
        t.sectionId === entry.sectionId &&
        t.periodIndex === entry.periodIndex &&
        t.academicYearId === entry.academicYearId
    );
    if (sectionConflict) {
      return { conflict: `Section collision: ${sectionConflict.sectionName || 'Section'} already has subject ${sectionConflict.subjectName || ''} scheduled in Period ${entry.periodIndex}.` };
    }

    const newEntry: TimetableEntry = {
      ...entry,
      id: `tt_${Date.now()}`,
    };

    this.data.timetable.push(newEntry);
    this.scheduleSave();
    return { entry: newEntry };
  }

  public deleteTimetableEntry(id: string): boolean {
    const idx = this.data.timetable.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.timetable.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  // --- AUDIT LOGGING ---
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Cap audit logs in memory at 1000
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.length = 1000;
    }
    this.scheduleSave();
    return newLog;
  }

  // --- GENERIC ENTITY GETTERS & MUTATORS ---
  public updateInstitution(updates: Partial<Institution>): Institution {
    if (!this.data.institution) {
      throw new Error('Institution not initialized');
    }
    this.data.institution = {
      ...this.data.institution,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.institution;
  }
  public getBuildings(): Building[] { return this.data.buildings; }
  public getRooms(): Room[] { return this.data.rooms; }
  public getDepartments(): Department[] { return this.data.departments; }
  public getPrograms(): Program[] { return this.data.programs; }
  public getAcademicYears(): AcademicYear[] { return this.data.academicYears; }
  public getSemesters(): Semester[] { return this.data.semesters; }
  public getSections(): Section[] { return this.data.sections; }
  public getSubjects(): Subject[] { return this.data.subjects; }
  public getStudents(): Student[] { return this.data.students; }
  public getFaculty(): Faculty[] { return this.data.faculty; }
  public getStaff(): Staff[] { return this.data.staff; }
  public getComplaints(): Complaint[] { return this.data.complaints; }
  public getFacilities(): Facility[] { return this.data.facilities; }
  public getMaintenanceRequests(): MaintenanceRequest[] { return this.data.maintenanceRequests; }
  public getLibraryItems(): LibraryItem[] { return this.data.libraryItems; }
  public getLibraryTransactions(): LibraryTransaction[] { return this.data.libraryTransactions; }
  public getHostels(): Hostel[] { return this.data.hostels; }
  public getVehicles(): Vehicle[] { return this.data.vehicles; }
  public getTransportRoutes(): TransportRoute[] { return this.data.transportRoutes; }
  public getVisitors(): Visitor[] { return this.data.visitors; }
  public getSecurityIncidents(): SecurityIncident[] { return this.data.securityIncidents; }
  public getSecurityZones(): SecurityZone[] { return this.data.securityZones; }
  public getAuditLogs(): AuditLog[] { return this.data.auditLogs; }
  public getAIInsights(): AIInsight[] { return this.data.aiInsights; }
  public getAnnouncements(): Announcement[] { return this.data.announcements; }
  public getNotifications(): Notification[] { return this.data.notifications; }
  public getRoles(): RoleDefinition[] { return this.data.roles; }
  public getAssignments(): Assignment[] { return this.data.assignments || []; }
  public getExaminations(): Examination[] { return this.data.examinations || []; }
  public getExamSchedules(): ExamSchedule[] { return this.data.examSchedules || []; }
  public getResults(): Result[] { return this.data.results || []; }
  public getSurveys(): Survey[] { return this.data.surveys || []; }
  public getConfidentialReports(): ConfidentialReport[] { return this.data.confidentialReports || []; }

  public addAssignment(data: Omit<Assignment, 'id' | 'createdAt'>): Assignment {
    const item: Assignment = {
      ...data,
      id: `asg_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.assignments.unshift(item);
    this.scheduleSave();
    return item;
  }

  public addSurvey(data: Omit<Survey, 'id' | 'createdAt' | 'responsesCount'>): Survey {
    const survey: Survey = {
      ...data,
      id: `srv_${Date.now()}`,
      responsesCount: 0,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.surveys) this.data.surveys = [];
    this.data.surveys.unshift(survey);
    this.scheduleSave();
    return survey;
  }

  public respondSurvey(surveyId: string, response: Omit<SurveyResponse, 'id' | 'submittedAt'>): boolean {
    const survey = (this.data.surveys || []).find((s) => s.id === surveyId);
    if (!survey) return false;

    if (!this.data.surveyResponses) this.data.surveyResponses = [];

    // If survey is anonymous, strip respondent user ID completely to ensure zero possibility of de-anonymization
    const sanitizedResponse: SurveyResponse = {
      ...response,
      id: `sr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      respondentUserId: survey.isAnonymous ? null : response.respondentUserId,
      submittedAt: new Date().toISOString(),
    };

    this.data.surveyResponses.push(sanitizedResponse);
    survey.responsesCount = (survey.responsesCount || 0) + 1;
    this.scheduleSave();
    return true;
  }

  public addConfidentialReport(
    data: Omit<ConfidentialReport, 'id' | 'ticketCode' | 'createdAt' | 'updatedAt' | 'reporterRevealed'>
  ): ConfidentialReport {
    const now = new Date().toISOString();
    const count = (this.data.confidentialReports || []).length + 1;
    const ticketCode = `CR-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    const report: ConfidentialReport = {
      ...data,
      id: `cr_${Date.now()}`,
      ticketCode,
      reporterRevealed: false,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.confidentialReports) this.data.confidentialReports = [];
    this.data.confidentialReports.unshift(report);
    this.scheduleSave();
    return report;
  }

  public revealConfidentialReport(id: string, revealedBy: string): ConfidentialReport | null {
    const report = (this.data.confidentialReports || []).find((r) => r.id === id);
    if (!report) return null;

    report.reporterRevealed = true;
    report.revealedBy = revealedBy;
    report.revealedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();
    this.scheduleSave();
    return report;
  }

  // Early-Warning Student Risk Analytics Engine
  public getStudentRiskIndicators(): StudentRiskIndicator[] {
    const students = this.data.students || [];
    const attendanceRecords = this.data.attendance || [];
    const departments = this.data.departments || [];
    const sections = this.data.sections || [];

    return students.map((student) => {
      const studentAtt = attendanceRecords.filter((a) => a.studentId === student.id);
      const totalSessions = studentAtt.length;
      const presentSessions = studentAtt.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attPercent = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 85;

      const dept = departments.find((d) => d.id === student.departmentId);
      const sec = sections.find((s) => s.id === student.sectionId);

      // Early Warning heuristics
      const riskFactors: string[] = [];
      let calculatedRisk: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

      if (attPercent < 65) {
        calculatedRisk = 'RED';
        riskFactors.push(`Critical attendance deficit (${attPercent}% vs 75% requirement)`);
      } else if (attPercent < 75) {
        calculatedRisk = 'YELLOW';
        riskFactors.push(`Borderline attendance shortfall (${attPercent}%)`);
      }

      const cgpa = student.cgpa || 7.5;
      if (cgpa < 6.0) {
        calculatedRisk = 'RED';
        riskFactors.push(`Cumulative GPA below academic warning threshold (${cgpa.toFixed(2)})`);
      } else if (cgpa < 7.0 && calculatedRisk !== 'RED') {
        calculatedRisk = 'YELLOW';
        riskFactors.push(`Moderate GPA dip (${cgpa.toFixed(2)})`);
      }

      let completionRate = 90;
      if (calculatedRisk === 'RED') completionRate = 58;
      else if (calculatedRisk === 'YELLOW') completionRate = 74;

      let recommendedAction = 'Maintain standard progress tracking';
      if (calculatedRisk === 'RED') {
        recommendedAction = 'Schedule mandatory advisory intervention and faculty counseling session';
      } else if (calculatedRisk === 'YELLOW') {
        recommendedAction = 'Send automated attendance recovery advisory to student and parent';
      }

      return {
        studentId: student.id,
        studentName: student.fullName || 'Student',
        registrationNumber: student.registrationNumber,
        departmentName: dept?.name || 'Computing',
        sectionName: sec?.name || 'Section A',
        riskLevel: calculatedRisk,
        attendancePercentage: attPercent,
        assignmentCompletionRate: completionRate,
        cgpa,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['Optimal academic standing'],
        recommendedAction,
      };
    });
  }

  // Generic mutators
  public addStudent(data: Omit<Student, 'id'>): Student {
    const student: Student = { ...data, id: `stud_${Date.now()}` };
    this.data.students.push(student);
    this.scheduleSave();
    return student;
  }

  public addFaculty(data: Omit<Faculty, 'id'>): Faculty {
    const faculty: Faculty = { ...data, id: `fac_${Date.now()}` };
    this.data.faculty.push(faculty);
    this.scheduleSave();
    return faculty;
  }

  public addDepartment(data: Omit<Department, 'id'>): Department {
    const dept: Department = { ...data, id: `dept_${Date.now()}` };
    this.data.departments.push(dept);
    this.scheduleSave();
    return dept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.departments[idx] = {
      ...this.data.departments[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.departments[idx];
  }

  public deleteDepartment(id: string): boolean {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.departments.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  public updateRolePermissions(roleCode: string, permissions: string[]): RoleDefinition | null {
    const role = this.data.roles.find((r) => r.code === roleCode);
    if (!role) return null;
    role.permissions = permissions;
    this.scheduleSave();
    return role;
  }

  public addLibraryItem(data: Omit<LibraryItem, 'id'>): LibraryItem {
    const item: LibraryItem = {
      ...data,
      id: `lib_${Date.now()}`,
    };
    this.data.libraryItems.unshift(item);
    this.scheduleSave();
    return item;
  }

  public updateLibraryItem(id: string, updates: Partial<LibraryItem>): LibraryItem | null {
    const idx = this.data.libraryItems.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.data.libraryItems[idx] = {
      ...this.data.libraryItems[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.libraryItems[idx];
  }

  public deleteLibraryItem(id: string): boolean {
    const idx = this.data.libraryItems.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.data.libraryItems.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  public addHostel(data: Omit<Hostel, 'id'>): Hostel {
    const hostel: Hostel = {
      ...data,
      id: `hst_${Date.now()}`,
    };
    this.data.hostels.push(hostel);
    this.scheduleSave();
    return hostel;
  }

  public updateHostel(id: string, updates: Partial<Hostel>): Hostel | null {
    const idx = this.data.hostels.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.data.hostels[idx] = {
      ...this.data.hostels[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.hostels[idx];
  }

  public deleteHostel(id: string): boolean {
    const idx = this.data.hostels.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    this.data.hostels.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  public addTransportRoute(data: Omit<TransportRoute, 'id'>): TransportRoute {
    const route: TransportRoute = {
      ...data,
      id: `route_${Date.now()}`,
    };
    this.data.transportRoutes.push(route);
    this.scheduleSave();
    return route;
  }

  public updateTransportRoute(id: string, updates: Partial<TransportRoute>): TransportRoute | null {
    const idx = this.data.transportRoutes.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.transportRoutes[idx] = {
      ...this.data.transportRoutes[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.transportRoutes[idx];
  }

  public deleteTransportRoute(id: string): boolean {
    const idx = this.data.transportRoutes.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.transportRoutes.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  public addVehicle(data: Omit<Vehicle, 'id'>): Vehicle {
    const vehicle: Vehicle = {
      ...data,
      id: `veh_${Date.now()}`,
    };
    this.data.vehicles.push(vehicle);
    this.scheduleSave();
    return vehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    this.data.vehicles[idx] = {
      ...this.data.vehicles[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.vehicles[idx];
  }

  public deleteVehicle(id: string): boolean {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.data.vehicles.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  public addBuilding(data: Omit<Building, 'id'>): Building {
    const building: Building = { ...data, id: `bld_${Date.now()}` };
    this.data.buildings.push(building);
    this.scheduleSave();
    return building;
  }

  public addComplaint(data: Omit<Complaint, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Complaint {
    const now = new Date().toISOString();
    const count = this.data.complaints.length + 1;
    const ticketNumber = `CMP-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const complaint: Complaint = {
      ...data,
      id: `cmp_${Date.now()}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
    };
    this.data.complaints.unshift(complaint);
    this.scheduleSave();
    return complaint;
  }

  public updateComplaint(id: string, updates: Partial<Complaint>): Complaint | null {
    const idx = this.data.complaints.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.complaints[idx] = {
      ...this.data.complaints[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.complaints[idx];
  }

  public addMaintenanceRequest(data: Omit<MaintenanceRequest, 'id' | 'code' | 'createdAt' | 'updatedAt'>): MaintenanceRequest {
    const now = new Date().toISOString();
    const code = `MR-${Math.floor(100 + Math.random() * 900)}`;
    const req: MaintenanceRequest = {
      ...data,
      id: `maint_${Date.now()}`,
      code,
      createdAt: now,
      updatedAt: now,
    };
    this.data.maintenanceRequests.unshift(req);
    this.scheduleSave();
    return req;
  }

  public updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): MaintenanceRequest | null {
    const idx = this.data.maintenanceRequests.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.maintenanceRequests[idx] = {
      ...this.data.maintenanceRequests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.maintenanceRequests[idx];
  }

  public registerVisitor(data: Omit<Visitor, 'id' | 'passNumber' | 'entryTimestamp'>): Visitor {
    const now = new Date().toISOString();
    const passNumber = `VP-${Math.floor(1000 + Math.random() * 9000)}`;
    const visitor: Visitor = {
      ...data,
      id: `vis_${Date.now()}`,
      passNumber,
      entryTimestamp: now,
    };
    this.data.visitors.unshift(visitor);
    this.scheduleSave();
    return visitor;
  }

  public checkoutVisitor(id: string): Visitor | null {
    const visitor = this.data.visitors.find((v) => v.id === id);
    if (!visitor) return null;
    visitor.status = 'CHECKED_OUT';
    visitor.exitTimestamp = new Date().toISOString();
    this.scheduleSave();
    return visitor;
  }

  public logSecurityIncident(data: Omit<SecurityIncident, 'id' | 'incidentCode' | 'reportedAt'>): SecurityIncident {
    const now = new Date().toISOString();
    const code = `SEC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const incident: SecurityIncident = {
      ...data,
      id: `inc_${Date.now()}`,
      incidentCode: code,
      reportedAt: now,
    };
    this.data.securityIncidents.unshift(incident);
    this.scheduleSave();
    return incident;
  }

  public addAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const announcement: Announcement = {
      ...data,
      id: `ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.announcements.unshift(announcement);
    this.scheduleSave();
    return announcement;
  }

  public addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const notification: Notification = {
      ...data,
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notification);
    this.scheduleSave();
    return notification;
  }

  public markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    this.scheduleSave();
    return true;
  }

  public markAllNotificationsRead(userId?: string): void {
    this.data.notifications.forEach((n) => {
      if (!userId || n.recipientId === userId || n.recipientId === 'ALL') {
        n.isRead = true;
      }
    });
    this.scheduleSave();
  }

  // --- BATCH DATA IMPORT ENGINE ---
  public importData(entityType: string, records: any[], mode: 'CREATE' | 'UPDATE' | 'CREATE_UPDATE'): {
    success: boolean;
    createdCount: number;
    updatedCount: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    if (!Array.isArray(records) || records.length === 0) {
      return { success: false, createdCount: 0, updatedCount: 0, errors: ['No data records supplied for import'] };
    }

    try {
      if (entityType === 'STUDENTS') {
        records.forEach((rec, idx) => {
          if (!rec.fullName || !rec.registrationNumber) {
            errors.push(`Row ${idx + 1}: Missing fullName or registrationNumber.`);
            return;
          }
          const existing = this.data.students.find((s) => s.registrationNumber === rec.registrationNumber);
          if (existing) {
            if (mode === 'CREATE') {
              errors.push(`Row ${idx + 1}: Student with Reg # ${rec.registrationNumber} already exists.`);
            } else {
              Object.assign(existing, rec);
              updatedCount++;
            }
          } else {
            this.addStudent({
              userId: `usr_imp_${Date.now()}_${idx}`,
              registrationNumber: rec.registrationNumber,
              rollNumber: rec.rollNumber || rec.registrationNumber,
              fullName: rec.fullName,
              email: rec.email || `${rec.registrationNumber.toLowerCase()}@student.local`,
              phone: rec.phone || '+1 (555) 000-0000',
              programId: rec.programId || (this.data.programs[0]?.id ?? 'prog_default'),
              programName: rec.programName || (this.data.programs[0]?.name ?? 'General Program'),
              departmentId: rec.departmentId || (this.data.departments[0]?.id ?? 'dept_default'),
              departmentName: rec.departmentName || (this.data.departments[0]?.name ?? 'General Department'),
              currentSemester: Number(rec.currentSemester) || 1,
              sectionId: rec.sectionId || (this.data.sections[0]?.id ?? 'sec_default'),
              admissionDate: rec.admissionDate || new Date().toISOString().split('T')[0],
              status: rec.status || 'ACTIVE',
              cgpa: Number(rec.cgpa) || 3.0,
              attendancePercentage: Number(rec.attendancePercentage) || 85.0,
              guardianName: rec.guardianName || 'Guardian',
              guardianPhone: rec.guardianPhone || '+1 (555) 000-0000',
            });
            createdCount++;
          }
        });
      } else if (entityType === 'FACULTY') {
        records.forEach((rec, idx) => {
          if (!rec.fullName || !rec.employeeCode) {
            errors.push(`Row ${idx + 1}: Missing fullName or employeeCode.`);
            return;
          }
          const existing = this.data.faculty.find((f) => f.employeeCode === rec.employeeCode);
          if (existing) {
            if (mode === 'CREATE') {
              errors.push(`Row ${idx + 1}: Faculty with Employee Code ${rec.employeeCode} already exists.`);
            } else {
              Object.assign(existing, rec);
              updatedCount++;
            }
          } else {
            this.addFaculty({
              userId: `usr_fac_imp_${Date.now()}_${idx}`,
              employeeCode: rec.employeeCode,
              fullName: rec.fullName,
              email: rec.email || `${rec.employeeCode.toLowerCase()}@campus.local`,
              phone: rec.phone || '+1 (555) 000-0000',
              departmentId: rec.departmentId || (this.data.departments[0]?.id ?? 'dept_default'),
              departmentName: rec.departmentName || (this.data.departments[0]?.name ?? 'Academic Dept'),
              designation: rec.designation || 'ASSISTANT_PROFESSOR',
              specialization: rec.specialization || 'General',
              qualification: rec.qualification || 'M.Tech / Ph.D.',
              joiningDate: rec.joiningDate || new Date().toISOString().split('T')[0],
              workloadHoursPerWeek: Number(rec.workloadHoursPerWeek) || 14,
              status: 'ACTIVE',
            });
            createdCount++;
          }
        });
      } else if (entityType === 'LIBRARY_ITEMS') {
        records.forEach((rec, idx) => {
          if (!rec.title || !rec.isbn) {
            errors.push(`Row ${idx + 1}: Missing title or ISBN.`);
            return;
          }
          const existing = this.data.libraryItems.find((b) => b.isbn === rec.isbn);
          if (existing) {
            if (mode === 'CREATE') {
              errors.push(`Row ${idx + 1}: ISBN ${rec.isbn} already cataloged.`);
            } else {
              Object.assign(existing, rec);
              updatedCount++;
            }
          } else {
            this.data.libraryItems.push({
              id: `lib_${Date.now()}_${idx}`,
              isbn: rec.isbn,
              title: rec.title,
              author: rec.author || 'Various Authors',
              category: rec.category || 'General Reference',
              totalCopies: Number(rec.totalCopies) || 5,
              availableCopies: Number(rec.availableCopies) || Number(rec.totalCopies) || 5,
              shelfLocation: rec.shelfLocation || 'Main Stack',
              callNumber: rec.callNumber || 'GEN.001',
            });
            createdCount++;
          }
        });
      } else {
        return { success: false, createdCount: 0, updatedCount: 0, errors: [`Unsupported entity type: ${entityType}`] };
      }

      this.scheduleSave();
      return { success: errors.length === 0, createdCount, updatedCount, errors };
    } catch (err: any) {
      return { success: false, createdCount, updatedCount, errors: [err?.message || 'Import processing error'] };
    }
  }

  // --- DIGITAL TWIN ASSET TELEMETRY & CRUD ---
  public getDefaultDigitalTwinNodes(): DigitalTwinNode[] {
    return [
      {
        id: 'node_computing',
        name: 'School of Computing & Artificial Intelligence',
        code: 'BLD-COMP',
        category: 'COMPUTING',
        x: 32,
        y: 35,
        floors: 5,
        capacity: 1200,
        occupancy: 78,
        temperatureF: 70.8,
        powerKw: 142.5,
        airQualityAqi: 24,
        activeLabs: ['AI & Neural Systems Lab', 'Advanced Networks Lab', 'Robotics Innovation Bay', 'Cloud Compute Center'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Primary computational research hub housing high-density servers, GPU clusters, and tiered interactive lecture halls.',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'node_admin',
        name: 'Institutional Administration & Chancellery Tower',
        code: 'BLD-ADMIN',
        category: 'ADMIN',
        x: 62,
        y: 22,
        floors: 8,
        capacity: 650,
        occupancy: 52,
        temperatureF: 72.1,
        powerKw: 88.0,
        airQualityAqi: 19,
        activeLabs: ['Executive Operations Council', 'Registrar Records Vault', 'Academic Senate Hall'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Central institutional administrative command, sovereign ownership office, and executive records.',
        imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'node_science',
        name: 'Applied Sciences & Nanotechnology Center',
        code: 'BLD-SCI',
        category: 'RESEARCH',
        x: 75,
        y: 52,
        floors: 6,
        capacity: 850,
        occupancy: 64,
        temperatureF: 68.5,
        powerKw: 195.3,
        airQualityAqi: 15,
        activeLabs: ['Cleanroom Research Facility', 'Optics & Photonics Lab', 'Materials Characterization Unit'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Physical sciences facility equipped with positive-pressure cleanrooms and precision instrument bays.',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'node_library',
        name: 'Central Knowledge Commons & Digital Library',
        code: 'BLD-LIB',
        category: 'LIBRARY',
        x: 48,
        y: 62,
        floors: 4,
        capacity: 1500,
        occupancy: 86,
        temperatureF: 71.4,
        powerKw: 64.2,
        airQualityAqi: 22,
        activeLabs: ['Digital Media Center', 'Collaborative Study Pods', 'Archives & Special Collections'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Four-level intellectual Commons with digital volumes, open study plazas, and 24-hour reading sanctuaries.',
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'node_sports',
        name: 'Campus Athletics & Wellness Arena',
        code: 'BLD-ATH',
        category: 'SPORTS',
        x: 18,
        y: 68,
        floors: 2,
        capacity: 1800,
        occupancy: 34,
        temperatureF: 73.5,
        powerKw: 78.4,
        airQualityAqi: 28,
        activeLabs: ['Aquatic Pool Complex', 'Biometrics & Fitness Center', 'Indoor Hardwood Courts'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Athletics pavilion, tournament swimming pool, and biomechanics human performance laboratory.',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'node_hostel',
        name: 'University Residential Quarters & Student Living',
        code: 'BLD-RES',
        category: 'HOSTEL',
        x: 82,
        y: 78,
        floors: 6,
        capacity: 880,
        occupancy: 92,
        temperatureF: 72.8,
        powerKw: 112.0,
        airQualityAqi: 31,
        activeLabs: ['Central Dining Refectory', 'Student Commons Hall', 'Residential Study Lounges'],
        maintenanceAlerts: 0,
        securityStatus: 'NORMAL',
        description: 'Student residential quarters housing scholars with integrated dining facilities and collaborative lounges.',
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      },
    ];
  }

  public getDigitalTwinNodes(): DigitalTwinNode[] {
    if (!this.data.digitalTwinNodes || this.data.digitalTwinNodes.length === 0) {
      this.data.digitalTwinNodes = this.getDefaultDigitalTwinNodes();
      this.scheduleSave();
    }
    return this.data.digitalTwinNodes;
  }

  public addDigitalTwinNode(node: Partial<DigitalTwinNode>): DigitalTwinNode {
    const newNode: DigitalTwinNode = {
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: node.name || 'New Campus Building',
      code: node.code || `BLD-${Math.floor(100 + Math.random() * 900)}`,
      category: node.category || 'COMPUTING',
      x: typeof node.x === 'number' ? Math.max(0, Math.min(100, node.x)) : 50,
      y: typeof node.y === 'number' ? Math.max(0, Math.min(100, node.y)) : 50,
      floors: Number(node.floors) || 4,
      capacity: Number(node.capacity) || 500,
      occupancy: typeof node.occupancy === 'number' ? Math.max(0, Math.min(100, Number(node.occupancy))) : 60,
      temperatureF: typeof node.temperatureF === 'number' ? Number(node.temperatureF) : 71.0,
      powerKw: typeof node.powerKw === 'number' ? Number(node.powerKw) : 85.0,
      airQualityAqi: typeof node.airQualityAqi === 'number' ? Number(node.airQualityAqi) : 25,
      activeLabs: Array.isArray(node.activeLabs) ? node.activeLabs : ['Innovation Lab 1'],
      maintenanceAlerts: typeof node.maintenanceAlerts === 'number' ? Number(node.maintenanceAlerts) : 0,
      securityStatus: node.securityStatus || 'NORMAL',
      description: node.description || 'Campus physical facility with IoT telemetry.',
      imageUrl: node.imageUrl || '',
      latitude: typeof node.latitude === 'number' ? node.latitude : 37.7749,
      longitude: typeof node.longitude === 'number' ? node.longitude : -122.4194,
      address: node.address || 'University Innovation Way',
      weatherCondition: node.weatherCondition || 'Partly Cloudy',
      weatherHumidity: typeof node.weatherHumidity === 'number' ? node.weatherHumidity : 52,
      weatherWindMph: typeof node.weatherWindMph === 'number' ? node.weatherWindMph : 8.5,
      weatherLastUpdated: node.weatherLastUpdated || new Date().toISOString(),
      googleMapsUrl: node.googleMapsUrl || '',
    };
    if (!this.data.digitalTwinNodes) {
      this.data.digitalTwinNodes = [];
    }
    this.data.digitalTwinNodes.push(newNode);
    this.scheduleSave();
    return newNode;
  }

  public updateDigitalTwinNode(id: string, updates: Partial<DigitalTwinNode>): DigitalTwinNode | null {
    if (!this.data.digitalTwinNodes) return null;
    const index = this.data.digitalTwinNodes.findIndex((n) => n.id === id);
    if (index === -1) return null;
    this.data.digitalTwinNodes[index] = {
      ...this.data.digitalTwinNodes[index],
      ...updates,
      id: this.data.digitalTwinNodes[index].id, // preserve id
    };
    this.scheduleSave();
    return this.data.digitalTwinNodes[index];
  }

  public deleteDigitalTwinNode(id: string): boolean {
    if (!this.data.digitalTwinNodes) return false;
    const initialLen = this.data.digitalTwinNodes.length;
    this.data.digitalTwinNodes = this.data.digitalTwinNodes.filter((n) => n.id !== id);
    if (this.data.digitalTwinNodes.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // --- INSTITUTION HARD RESET ---
  public resetToEmpty(): void {
    this.data = this.getEmptySchema();
    this.persistImmediate();
  }
}

export const db = new DatabaseService();
