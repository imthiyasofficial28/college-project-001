/**
 * CUOIS — Campus Unified Operations & Intelligence System
 * Primary Production Express Backend & Realtime Event Server
 */

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { Modality, LiveServerMessage } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword } from './server/db.ts';
import {
  authenticate,
  createSession,
  invalidateSession,
  requireRole,
  requirePermission,
  getActiveSessionsCount,
  AuthenticatedRequest,
} from './server/auth.ts';
import {
  getGenAI,
  processCampusIntelligenceQuery,
  processCampusChatQuery,
} from './server/gemini.ts';
import { SystemTelemetry, UserRole } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const SERVER_START_TIME = Date.now();

app.use(express.json({ limit: '10mb' }));

// --- REALTIME SERVER-SENT EVENTS (SSE) BUS ---
interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: UserRole;
}

const sseClients = new Set<SSEClient>();

export function broadcastRealtimeEvent(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, timestamp: new Date().toISOString(), data })}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -------------------------------------------------------------
// API ROUTES FIRST
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CUOIS Enterprise OS Core',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
  });
});

// Telemetry
app.get('/api/telemetry', (req, res) => {
  const mem = process.memoryUsage();
  const inst = db.getInstitution();
  const rawDb = db.getRaw();
  const totalEntities =
    rawDb.students.length +
    rawDb.faculty.length +
    rawDb.attendance.length +
    rawDb.buildings.length +
    rawDb.rooms.length +
    rawDb.complaints.length +
    rawDb.maintenanceRequests.length;

  const telemetry: SystemTelemetry = {
    apiStatus: 'HEALTHY',
    databaseStatus: 'CONNECTED',
    geminiAiStatus: process.env.GEMINI_API_KEY ? 'ONLINE' : 'STANDBY',
    realtimeEngineStatus: 'RUNNING',
    activeUsersCount: getActiveSessionsCount(),
    uptimeSeconds: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
    eventsProcessed: rawDb.auditLogs.length + 15,
    databaseEntitiesCount: totalEntities,
    lastAuditTimestamp: rawDb.auditLogs[0]?.timestamp || new Date().toISOString(),
  };

  res.json(telemetry);
});

// Realtime SSE stream
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const client: SSEClient = { id: clientId, res };
  sseClients.add(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// --- BOOTSTRAP & INSTITUTION SETUP ---
app.get('/api/bootstrap/status', (req, res) => {
  const institution = db.getInstitution();
  res.json({
    isConfigured: institution?.isConfigured || false,
    institution,
  });
});

app.post('/api/bootstrap/initialize', (req, res) => {
  try {
    const { institution, owner, template } = req.body;

    if (!owner || !owner.email || !owner.password || !owner.fullName) {
      res.status(400).json({ error: 'System Owner full name, email, and password are required.' });
      return;
    }

    const currentInst = db.getInstitution();
    if (currentInst && currentInst.isConfigured) {
      res.status(400).json({ error: 'Institution is already configured. Reset is required to re-bootstrap.' });
      return;
    }

    const result = db.bootstrapInstitution({
      institution: institution || {},
      owner,
      template: template || 'UNIVERSITY_ENTERPRISE',
    });

    const session = createSession(result.owner, req.ip || '127.0.0.1', req.headers['user-agent']);

    broadcastRealtimeEvent('INSTITUTION_INITIALIZED', { name: result.institution.name });

    res.json({
      success: true,
      message: 'Institution successfully initialized.',
      institution: result.institution,
      session,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initialize institution' });
  }
});

app.post('/api/bootstrap/reset', authenticate, requireRole(['SYSTEM_OWNER']), (req: AuthenticatedRequest, res) => {
  db.resetToEmpty();
  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: 'SYSTEM_OWNER',
    action: 'RESET_INSTITUTION_TO_EMPTY',
    entity: 'INSTITUTION',
    entityId: 'ALL',
    ipAddress: req.ip || '127.0.0.1',
  });
  broadcastRealtimeEvent('INSTITUTION_RESET', {});
  res.json({ success: true, message: 'Institution has been reset to an empty state.' });
});

// --- AUTHENTICATION & SESSION ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const userWithSecrets = db.findUserByEmail(email) || db.getRaw().users.find((u) => u.username === email);

  if (!userWithSecrets) {
    res.status(401).json({ error: 'Invalid credentials provided.' });
    return;
  }

  // Check account lockout
  if (userWithSecrets.lockedUntil && new Date(userWithSecrets.lockedUntil).getTime() > Date.now()) {
    const remainingMins = Math.ceil((new Date(userWithSecrets.lockedUntil).getTime() - Date.now()) / 60000);
    res.status(403).json({
      error: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMins} minute(s).`,
    });
    return;
  }

  const isValid = verifyPassword(password, userWithSecrets.passwordHash, userWithSecrets.salt);
  if (!isValid) {
    userWithSecrets.failedLoginAttempts = (userWithSecrets.failedLoginAttempts || 0) + 1;
    if (userWithSecrets.failedLoginAttempts >= 5) {
      userWithSecrets.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lock
      db.logAudit({
        actorId: userWithSecrets.id,
        actorName: userWithSecrets.fullName,
        actorRole: userWithSecrets.role,
        action: 'ACCOUNT_LOCKOUT_TRIGGERED',
        entity: 'USER_SECURITY',
        entityId: userWithSecrets.id,
        reason: '5 consecutive failed password attempts',
        ipAddress: req.ip || '127.0.0.1',
      });
    }
    res.status(401).json({
      error: 'Invalid credentials.',
      attemptsRemaining: Math.max(0, 5 - userWithSecrets.failedLoginAttempts),
    });
    return;
  }

  if (!userWithSecrets.isActive) {
    res.status(403).json({ error: 'Account has been deactivated by administrator.' });
    return;
  }

  // Reset failed attempts
  userWithSecrets.failedLoginAttempts = 0;
  userWithSecrets.lockedUntil = null;
  userWithSecrets.lastLoginAt = new Date().toISOString();

  const { passwordHash: _, salt: __, ...user } = userWithSecrets;
  const session = createSession(user, req.ip || '127.0.0.1', req.headers['user-agent']);

  db.logAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    action: 'USER_LOGIN_SUCCESS',
    entity: 'AUTH_SESSION',
    entityId: session.token.substring(0, 8),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ session });
});

app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user,
    rolePermissions: req.rolePermissions,
    sessionToken: req.sessionToken,
  });
});

app.post('/api/auth/logout', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.sessionToken) {
    invalidateSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Role Switcher / Impersonation (for testing different perspectives)
app.post('/api/auth/switch-role', authenticate, (req: AuthenticatedRequest, res) => {
  const { targetRole } = req.body;
  if (!targetRole) {
    res.status(400).json({ error: 'Target role is required.' });
    return;
  }

  // In testing/demo mode, update current user role in memory
  const user = req.user!;
  user.role = targetRole;

  const roles = db.getRoles();
  const matchedRole = roles.find((r) => r.code === targetRole);
  const rolePermissions = targetRole === 'SYSTEM_OWNER' ? ['*'] : (matchedRole?.permissions || []);

  db.logAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: targetRole,
    action: 'ROLE_PERSPECTIVE_SWITCH',
    entity: 'USER_ROLE',
    entityId: user.id,
    newValue: targetRole,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    user,
    rolePermissions,
  });
});

// --- CORE MODULE APIS ---

// Institution & Campus
app.get('/api/institution', (req, res) => {
  res.json(db.getInstitution());
});

app.get('/api/campuses', (req, res) => {
  res.json(db.getRaw().campuses);
});

app.get('/api/buildings', (req, res) => {
  res.json(db.getBuildings());
});

app.post('/api/buildings', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const building = db.addBuilding(req.body);
  broadcastRealtimeEvent('BUILDING_ADDED', building);
  res.status(201).json(building);
});

app.get('/api/rooms', (req, res) => {
  res.json(db.getRooms());
});

// Academic Structure
app.get('/api/departments', (req, res) => {
  res.json(db.getDepartments());
});

app.post('/api/departments', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const dept = db.addDepartment(req.body);
  broadcastRealtimeEvent('DEPARTMENT_ADDED', dept);
  res.status(201).json(dept);
});

app.put('/api/departments/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateDepartment(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Department not found' });
    return;
  }
  broadcastRealtimeEvent('DEPARTMENT_UPDATED', updated);
  res.json(updated);
});

app.delete('/api/departments/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteDepartment(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Department not found' });
    return;
  }
  broadcastRealtimeEvent('DEPARTMENT_DELETED', { id: req.params.id });
  res.json({ success: true });
});

app.get('/api/programs', (req, res) => {
  res.json(db.getPrograms());
});

app.get('/api/academic-years', (req, res) => {
  res.json(db.getAcademicYears());
});

app.get('/api/semesters', (req, res) => {
  res.json(db.getSemesters());
});

app.get('/api/sections', (req, res) => {
  res.json(db.getSections());
});

app.get('/api/subjects', (req, res) => {
  res.json(db.getSubjects());
});

// Users & RBAC
app.get('/api/users', authenticate, (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  try {
    const user = db.createUser(req.body);
    db.logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: req.user!.role,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: user.id,
      newValue: JSON.stringify({ email: user.email, role: user.role }),
      ipAddress: req.ip || '127.0.0.1',
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'USER_UPDATED',
    entity: 'USER',
    entityId: updated.id,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json(updated);
});

app.delete('/api/users/:id', authenticate, requireRole(['SYSTEM_OWNER']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteUser(req.params.id);
  if (!success) {
    res.status(400).json({ error: 'Could not delete user or cannot delete System Owner.' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/roles', (req, res) => {
  res.json(db.getRoles());
});

app.put('/api/roles/:code/permissions', authenticate, requireRole(['SYSTEM_OWNER']), (req: AuthenticatedRequest, res) => {
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    res.status(400).json({ error: 'Permissions must be an array of strings' });
    return;
  }
  const updatedRole = db.updateRolePermissions(req.params.code, permissions);
  if (!updatedRole) {
    res.status(404).json({ error: 'Role not found' });
    return;
  }
  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'ROLE_PERMISSIONS_CONFIGURED',
    entity: 'RBAC_ROLE',
    entityId: req.params.code,
    newValue: JSON.stringify(permissions),
    ipAddress: req.ip || '127.0.0.1',
  });
  broadcastRealtimeEvent('ROLE_PERMISSIONS_UPDATED', updatedRole);
  res.json(updatedRole);
});

// Students
app.get('/api/students', (req, res) => {
  res.json(db.getStudents());
});

app.post('/api/students', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const student = db.addStudent(req.body);
  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'STUDENT_ENROLLED',
    entity: 'STUDENT',
    entityId: student.id,
    newValue: student.registrationNumber,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.status(201).json(student);
});

// Faculty & Staff
app.get('/api/faculty', (req, res) => {
  res.json(db.getFaculty());
});

app.get('/api/staff', (req, res) => {
  res.json(db.getStaff());
});

// Attendance
app.get('/api/attendance', (req, res) => {
  res.json(db.getAttendance());
});

app.post('/api/attendance', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'FACULTY']), (req: AuthenticatedRequest, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records)) {
    res.status(400).json({ error: 'Array of attendance records required.' });
    return;
  }
  const created = db.markAttendance(records);
  broadcastRealtimeEvent('ATTENDANCE_RECORDED', { count: created.length, date: records[0]?.date });

  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'ATTENDANCE_RECORDED',
    entity: 'ATTENDANCE',
    entityId: `batch_${created.length}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, count: created.length, records: created });
});

// Timetable with Conflict Detection
app.get('/api/timetable', (req, res) => {
  res.json(db.getTimetable());
});

app.post('/api/timetable', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const result = db.addTimetableEntry(req.body);
  if (result.conflict) {
    res.status(409).json({ error: result.conflict, isConflict: true });
    return;
  }
  broadcastRealtimeEvent('TIMETABLE_UPDATED', result.entry);
  res.status(201).json(result.entry);
});

app.delete('/api/timetable/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req, res) => {
  const success = db.deleteTimetableEntry(req.params.id);
  res.json({ success });
});

// Complaints & Grievances
app.get('/api/complaints', (req, res) => {
  res.json(db.getComplaints());
});

app.post('/api/complaints', authenticate, (req: AuthenticatedRequest, res) => {
  const complaint = db.addComplaint({
    ...req.body,
    submittedByUserId: req.user!.id,
    submittedByName: req.user!.fullName,
  });
  broadcastRealtimeEvent('COMPLAINT_FILED', complaint);
  res.status(201).json(complaint);
});

app.patch('/api/complaints/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const updated = db.updateComplaint(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }
  broadcastRealtimeEvent('COMPLAINT_UPDATED', updated);
  res.json(updated);
});

// Facilities & Maintenance
app.get('/api/facilities', (req, res) => {
  res.json(db.getFacilities());
});

app.get('/api/maintenance', (req, res) => {
  res.json(db.getMaintenanceRequests());
});

app.post('/api/maintenance', authenticate, (req: AuthenticatedRequest, res) => {
  const maint = db.addMaintenanceRequest({
    ...req.body,
    requestedByUserId: req.user!.id,
    requestedByName: req.user!.fullName,
  });
  broadcastRealtimeEvent('MAINTENANCE_LOGGED', maint);
  res.status(201).json(maint);
});

app.patch('/api/maintenance/:id', authenticate, (req, res) => {
  const updated = db.updateMaintenanceRequest(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Maintenance request not found' });
    return;
  }
  broadcastRealtimeEvent('MAINTENANCE_UPDATED', updated);
  res.json(updated);
});

// Library
app.get('/api/library/items', (req, res) => {
  res.json(db.getLibraryItems());
});

app.post('/api/library/items', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const item = db.addLibraryItem(req.body);
  broadcastRealtimeEvent('LIBRARY_ITEM_ADDED', item);
  res.status(201).json(item);
});

app.put('/api/library/items/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateLibraryItem(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Library item not found' });
    return;
  }
  broadcastRealtimeEvent('LIBRARY_ITEM_UPDATED', updated);
  res.json(updated);
});

app.delete('/api/library/items/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteLibraryItem(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Library item not found' });
    return;
  }
  broadcastRealtimeEvent('LIBRARY_ITEM_DELETED', { id: req.params.id });
  res.json({ success: true });
});

app.get('/api/library/transactions', (req, res) => {
  res.json(db.getLibraryTransactions());
});

// Hostels & Transport
app.get('/api/hostels', (req, res) => {
  res.json(db.getHostels());
});

app.post('/api/hostels', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const hostel = db.addHostel(req.body);
  broadcastRealtimeEvent('HOSTEL_ADDED', hostel);
  res.status(201).json(hostel);
});

app.put('/api/hostels/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateHostel(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Hostel not found' });
    return;
  }
  broadcastRealtimeEvent('HOSTEL_UPDATED', updated);
  res.json(updated);
});

app.delete('/api/hostels/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteHostel(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Hostel not found' });
    return;
  }
  broadcastRealtimeEvent('HOSTEL_DELETED', { id: req.params.id });
  res.json({ success: true });
});

app.get('/api/transport/routes', (req, res) => {
  res.json(db.getTransportRoutes());
});

app.post('/api/transport/routes', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const route = db.addTransportRoute(req.body);
  broadcastRealtimeEvent('TRANSPORT_ROUTE_ADDED', route);
  res.status(201).json(route);
});

app.put('/api/transport/routes/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateTransportRoute(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }
  broadcastRealtimeEvent('TRANSPORT_ROUTE_UPDATED', updated);
  res.json(updated);
});

app.delete('/api/transport/routes/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteTransportRoute(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }
  broadcastRealtimeEvent('TRANSPORT_ROUTE_DELETED', { id: req.params.id });
  res.json({ success: true });
});

app.get('/api/transport/vehicles', (req, res) => {
  res.json(db.getVehicles());
});

app.post('/api/transport/vehicles', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const vehicle = db.addVehicle(req.body);
  broadcastRealtimeEvent('VEHICLE_ADDED', vehicle);
  res.status(201).json(vehicle);
});

app.put('/api/transport/vehicles/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'STAFF']), (req: AuthenticatedRequest, res) => {
  const updated = db.updateVehicle(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  broadcastRealtimeEvent('VEHICLE_UPDATED', updated);
  res.json(updated);
});

app.delete('/api/transport/vehicles/:id', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteVehicle(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  broadcastRealtimeEvent('VEHICLE_DELETED', { id: req.params.id });
  res.json({ success: true });
});

// Visitors
app.get('/api/visitors', (req, res) => {
  res.json(db.getVisitors());
});

app.post('/api/visitors', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'SECURITY']), (req: AuthenticatedRequest, res) => {
  const visitor = db.registerVisitor(req.body);
  broadcastRealtimeEvent('VISITOR_REGISTERED', visitor);
  res.status(201).json(visitor);
});

app.post('/api/visitors/:id/checkout', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'SECURITY']), (req, res) => {
  const visitor = db.checkoutVisitor(req.params.id);
  if (!visitor) {
    res.status(404).json({ error: 'Visitor not found' });
    return;
  }
  broadcastRealtimeEvent('VISITOR_CHECKED_OUT', visitor);
  res.json(visitor);
});

// Security
app.get('/api/security/zones', (req, res) => {
  res.json(db.getSecurityZones());
});

app.get('/api/security/incidents', (req, res) => {
  res.json(db.getSecurityIncidents());
});

app.post('/api/security/incidents', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'SECURITY']), (req: AuthenticatedRequest, res) => {
  const incident = db.logSecurityIncident(req.body);
  broadcastRealtimeEvent('SECURITY_INCIDENT_LOGGED', incident);
  res.status(201).json(incident);
});

// Announcements & Notifications
app.get('/api/announcements', (req, res) => {
  res.json(db.getAnnouncements());
});

app.post('/api/announcements', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'MANAGEMENT']), (req: AuthenticatedRequest, res) => {
  const ann = db.addAnnouncement({
    ...req.body,
    authorId: req.user!.id,
    authorName: req.user!.fullName,
    authorRole: req.user!.role,
  });
  broadcastRealtimeEvent('NEW_ANNOUNCEMENT', ann);
  res.status(201).json(ann);
});

app.get('/api/notifications', (req, res) => {
  res.json(db.getNotifications());
});

app.patch('/api/notifications/:id/read', (req, res) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

// Audit Logs
app.get('/api/audit-logs', authenticate, (req, res) => {
  res.json(db.getAuditLogs());
});

// AI Intelligence
app.get('/api/ai/insights', (req, res) => {
  res.json(db.getAIInsights());
});

app.post('/api/ai/query', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query prompt is required.' });
      return;
    }

    const result = await processCampusIntelligenceQuery(query, req.user!);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI Query evaluation failed' });
  }
});

app.post('/api/ai/chat', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { messages, model, systemInstruction, enableSearchGrounding } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Valid messages array is required.' });
      return;
    }

    const result = await processCampusChatQuery(
      {
        messages,
        model,
        systemInstruction,
        enableSearchGrounding,
      },
      req.user!
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// Data Import & Export Engine
app.post('/api/data/import', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR']), (req: AuthenticatedRequest, res) => {
  const { entityType, records, mode } = req.body;
  const result = db.importData(entityType, records, mode || 'CREATE_UPDATE');

  db.logAudit({
    actorId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'BATCH_DATA_IMPORT',
    entity: entityType,
    entityId: `records_${records?.length || 0}`,
    newValue: JSON.stringify({ created: result.createdCount, updated: result.updatedCount }),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json(result);
});

app.get('/api/data/export', authenticate, requireRole(['SYSTEM_OWNER', 'ADMINISTRATOR', 'MANAGEMENT']), (req, res) => {
  res.json(db.getRaw());
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & HTTP / LIVE WEBSOCKET SERVER SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // Mount WebSocket server for Gemini 3.1 Flash Live Preview Voice Streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[CUOIS Live] Client connected to Live Voice WebSocket');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: 'info',
          message:
            'GEMINI_API_KEY is not configured in environment. The interface will simulate voice telemetry locally until configured.',
        })
      );
    }

    let liveSession: any = null;

    try {
      const ai = getGenAI();
      if (ai) {
        liveSession = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction:
              'You are CUOIS Voice Assistant, the intelligent real-time conversational audio intelligence for the campus. Speak concisely, clearly, and authoritatively on university affairs, facilities, attendance, and campus safety.',
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const audio =
                message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ type: 'audio', audio }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            },
            onerror: (err: any) => {
              console.error('[CUOIS Live] Live session error:', err);
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message: err.message || 'Live session experienced an error',
                })
              );
            },
            onclose: () => {
              clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
            },
          },
        });

        clientWs.send(
          JSON.stringify({
            type: 'ready',
            model: 'gemini-3.1-flash-live-preview',
          })
        );
      }
    } catch (err: any) {
      console.error('[CUOIS Live] Error initiating Gemini Live session:', err);
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: err.message || 'Failed to initialize Gemini Live session',
        })
      );
    }

    clientWs.on('message', (data: any) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text && liveSession) {
          liveSession.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('[CUOIS Live] Malformed message from client:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[CUOIS Live] Client disconnected');
      try {
        liveSession?.close();
      } catch {}
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[CUOIS OS] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
