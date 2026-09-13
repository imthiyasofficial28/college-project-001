import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  UserX,
  UserCheck,
  Key,
  Shield,
  User,
  Lock,
  Unlock,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Info,
  Save,
  RotateCcw,
  Sparkles,
  Edit3,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Phone,
  Building,
  Fingerprint,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { User as UserType, UserRole, RoleDefinition } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';
import { Table } from '../ui/table.tsx';

// All standard institutional permission definitions grouped by category
interface PermissionItem {
  code: string;
  label: string;
  description: string;
}

const PERMISSION_GROUPS: { category: string; permissions: PermissionItem[] }[] = [
  {
    category: 'Academic Operations & Classes',
    permissions: [
      { code: 'academic:manage', label: 'Academic Structure', description: 'Create and modify semesters, programs, courses & academic years' },
      { code: 'departments:manage', label: 'Departments & HODs', description: 'Configure academic departments, allocations and facilities' },
      { code: 'attendance:mark', label: 'Mark Attendance', description: 'Record student attendance rosters and session tallies' },
      { code: 'attendance:read', label: 'View Attendance Stats', description: 'Campus-wide attendance percentages, thresholds & debarment lists' },
      { code: 'marks:enter', label: 'Gradebook & Exams', description: 'Enter examination marks, grade points, and publish GPA' },
      { code: 'timetable:manage', label: 'Timetable Scheduling', description: 'Assign rooms, faculty periods and detect timetable collisions' },
      { code: 'students:view', label: 'Student Directory', description: 'Inspect student rosters, enrollment data, and contact records' },
    ],
  },
  {
    category: 'Facilities, Hostels & Library',
    permissions: [
      { code: 'facilities:manage', label: 'Facility Management', description: 'Campus infrastructure setup, room reservations and maintenance' },
      { code: 'facilities:read', label: 'Inspect Venues', description: 'Browse physical buildings, venues, and classroom capacities' },
      { code: 'library:manage', label: 'Library Accessions', description: 'Add, update and circulate library monographs and stock' },
      { code: 'library:read', label: 'Library Catalog', description: 'Search library shelf locations and copy availability' },
      { code: 'hostel:manage', label: 'Hostel Administration', description: 'Configure residential blocks, rooms and bed allocations' },
      { code: 'hostel:read', label: 'Hostel Directory', description: 'View student hostel occupancies and resident registries' },
      { code: 'transport:manage', label: 'Transit Fleet', description: 'Dispatch buses, assign transit drivers and scheduled routes' },
    ],
  },
  {
    category: 'Identity, Security & Governance',
    permissions: [
      { code: 'users:manage', label: 'User Directory', description: 'Provision user accounts, reset passcodes and deactivate logins' },
      { code: 'security:incidents', label: 'Security Operations', description: 'Log perimeter breaches, gate incidents and surveillance alerts' },
      { code: 'visitors:manage', label: 'Visitor Passes', description: 'Issue digital gate passes and process visitor check-in/out' },
      { code: 'zones:monitor', label: 'Perimeter Monitoring', description: 'Inspect live zone sensors, gates, and biometric checkpoints' },
      { code: 'emergency:broadcast', label: 'Emergency Lockdown', description: 'Broadcast campus-wide lockdown and emergency notifications' },
      { code: 'audit:view', label: 'Sovereign Audit Trail', description: 'Audit all cryptographic records, logins, and permission changes' },
    ],
  },
  {
    category: 'Student Portal & Self-Services',
    permissions: [
      { code: 'complaints:submit', label: 'Submit Grievances', description: 'Lodge maintenance tickets, appeals, and formal feedback' },
      { code: 'complaints:manage', label: 'Resolve Grievances', description: 'Process, investigate, and close student and faculty complaints' },
      { code: 'profile:self', label: 'Self Profile', description: 'Access personal profile, contact info, and ID credentials' },
      { code: 'attendance:self', label: 'Personal Attendance', description: 'View individual attendance history and shortage notices' },
      { code: 'timetable:self', label: 'Personal Timetable', description: 'View enrolled class schedule and exam seat allocations' },
      { code: 'results:self', label: 'Personal Results', description: 'View published semester marks, grades, and transcripts' },
    ],
  },
  {
    category: 'AI Intelligence & Executive Oversight',
    permissions: [
      { code: 'ai:query', label: 'AI Deep Inference', description: 'Run operational intelligence queries and 4-quadrant analyses' },
      { code: 'ai:voice', label: 'Gemini Live Voice', description: 'Real-time conversational Live API streaming via WebSocket' },
      { code: 'analytics:view', label: 'Executive Analytics', description: 'Inspect institutional KPIs, attrition risks and heat maps' },
      { code: 'reports:generate', label: 'Generate Reports', description: 'Export regulatory datasets, accreditation matrices and summaries' },
    ],
  },
];

interface UsersRbacViewProps {
  onNavigate?: (view: any) => void;
}

export const UsersRbacView: React.FC<UsersRbacViewProps> = ({ onNavigate }) => {
  const { user: currentUser, activeRole, refreshState } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // System Owner status check
  const isSystemOwner = activeRole === 'SYSTEM_OWNER' || currentUser?.username?.toUpperCase() === 'IMTHIYAS';

  // Permission matrix state
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('ADMINISTRATOR');
  const [activeRolePerms, setActiveRolePerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [matrixSaveSuccess, setMatrixSaveSuccess] = useState(false);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('STUDENT');
  const [addPhone, setAddPhone] = useState('');
  const [addBio, setAddBio] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Reset Password Modal State
  const [resettingUser, setResettingUser] = useState<UserType | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Delete User Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status banners
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(u);
      setRoles(r);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const r = roles.find((item) => item.code === selectedRoleCode);
    if (r) {
      setActiveRolePerms([...r.permissions]);
    }
  }, [selectedRoleCode, roles]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !addPassword.trim() || !addFullName.trim()) {
      showNotice('error', 'Member ID, Initial Password, and Full Name are compulsory.');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await api.createUser({
        fullName: addFullName.trim(),
        username: addUsername.trim(),
        email: addEmail.trim() || `${addUsername.trim().toLowerCase()}@campus.edu`,
        password: addPassword.trim(),
        role: addRole,
        phone: addPhone.trim(),
        bio: addBio.trim(),
        isActive: true,
      });
      setIsAddModalOpen(false);
      setAddFullName('');
      setAddUsername('');
      setAddEmail('');
      setAddPassword('');
      setAddPhone('');
      setAddBio('');
      await loadData();
      showNotice('success', `Member account successfully created with ID: ${addUsername.trim()}`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create user account');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // 2. Open Edit User
  const handleOpenEdit = (u: UserType) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditRole(u.role);
    setEditPhone(u.phone || '');
    setEditBio(u.bio || '');
  };

  // Save Edited User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFullName.trim() || !editUsername.trim()) {
      showNotice('error', 'Full Name and Member ID cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await api.updateUser(editingUser.id, {
        fullName: editFullName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        phone: editPhone.trim(),
        bio: editBio.trim(),
      });
      setEditingUser(null);
      await loadData();
      await refreshState();
      showNotice('success', `Account ${editUsername.trim()} updated successfully.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update user account');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 3. Reset Password for User
  const handleOpenResetPassword = (u: UserType) => {
    setResettingUser(u);
    setNewPasswordForUser('');
    setShowResetPassword(false);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (!newPasswordForUser.trim() || newPasswordForUser.length < 6) {
      showNotice('error', 'New password must be at least 6 characters long.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      await api.resetUserPassword(resettingUser.id, newPasswordForUser.trim());
      setResettingUser(null);
      showNotice('success', `Password for member ID ${resettingUser.username || resettingUser.id} was successfully changed.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to reset user password');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // 4. Delete User
  const handleOpenDelete = (u: UserType) => {
    if (u.role === 'SYSTEM_OWNER' || u.username?.toUpperCase() === 'IMTHIYAS') {
      showNotice('error', 'The Sovereign System Owner account is strictly protected and cannot be deleted.');
      return;
    }
    setDeletingUser(u);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api.deleteUser(deletingUser.id);
      showNotice('success', `Account for ${deletingUser.fullName} (${deletingUser.username}) permanently deleted.`);
      setDeletingUser(null);
      await loadData();
      await refreshState();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. Toggle Active / Deactivate
  const handleToggleActive = async (targetUser: UserType) => {
    if (targetUser.role === 'SYSTEM_OWNER' || targetUser.username?.toUpperCase() === 'IMTHIYAS') {
      showNotice('error', 'Cannot deactivate the Sovereign System Owner account.');
      return;
    }
    try {
      await api.updateUser(targetUser.id, { isActive: !targetUser.isActive });
      await loadData();
      showNotice('success', `Account status toggled for ${targetUser.fullName}.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update user status');
    }
  };

  // Permission Matrix Handlers
  const handleTogglePerm = (permCode: string) => {
    if (!isSystemOwner) {
      showNotice('error', 'Access Restricted: Only the System Owner can modify role permissions.');
      return;
    }
    if (selectedRoleCode === 'SYSTEM_OWNER') {
      showNotice('error', 'System Owner role inherently retains unrestricted root permissions (*).');
      return;
    }

    setActiveRolePerms((prev) => {
      if (prev.includes(permCode)) {
        return prev.filter((p) => p !== permCode);
      } else {
        return [...prev, permCode];
      }
    });
  };

  const handleSelectAllCategory = (permissions: PermissionItem[]) => {
    if (!isSystemOwner || selectedRoleCode === 'SYSTEM_OWNER') return;
    const codes = permissions.map((p) => p.code);
    setActiveRolePerms((prev) => Array.from(new Set([...prev, ...codes])));
  };

  const handleClearCategory = (permissions: PermissionItem[]) => {
    if (!isSystemOwner || selectedRoleCode === 'SYSTEM_OWNER') return;
    const codes = new Set(permissions.map((p) => p.code));
    setActiveRolePerms((prev) => prev.filter((p) => !codes.has(p)));
  };

  const handleGrantFullAccess = () => {
    if (!isSystemOwner || selectedRoleCode === 'SYSTEM_OWNER') return;
    const allCodes = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.code));
    setActiveRolePerms(allCodes);
  };

  const handleResetToDefault = () => {
    if (!isSystemOwner) return;
    const original = roles.find((r) => r.code === selectedRoleCode);
    if (original) {
      setActiveRolePerms([...original.permissions]);
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!isSystemOwner) {
      showNotice('error', 'Access Restricted: Only the System Owner can save position access policies.');
      return;
    }
    setIsSavingPerms(true);
    setMatrixSaveSuccess(false);
    try {
      await api.updateRolePermissions(selectedRoleCode, activeRolePerms);
      setMatrixSaveSuccess(true);
      await loadData();
      await refreshState();
      setTimeout(() => setMatrixSaveSuccess(false), 3500);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update role permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const roleColors: Record<UserRole, 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'> = {
    SYSTEM_OWNER: 'accent',
    ADMINISTRATOR: 'danger',
    EDITOR: 'warning',
    MANAGEMENT: 'warning',
    FACULTY: 'info',
    STUDENT: 'neutral',
    SECURITY: 'danger',
    STAFF: 'neutral',
    CUSTOM: 'neutral',
  };

  // Filter users by search and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userColumns = [
    {
      key: 'username',
      header: 'Member ID',
      render: (u: UserType) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Fingerprint className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold text-cyan-300">{u.username || u.id}</span>
          {u.username?.toUpperCase() === 'IMTHIYAS' && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
              OWNER
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fullName',
      header: 'Full Name & Email',
      render: (u: UserType) => (
        <div>
          <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
            <span>{u.fullName}</span>
            {u.role === 'SYSTEM_OWNER' && (
              <span className="text-[10px] text-amber-400 font-mono font-bold">★ ROOT SOVEREIGN</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Position / Role',
      render: (u: UserType) => (
        <Badge variant={roleColors[u.role] || 'neutral'} size="sm">
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u: UserType) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Sign In',
      render: (u: UserType) => (
        <span className="text-xs text-slate-400 font-mono">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (u: UserType) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Edit / Modify User */}
          {isSystemOwner && (
            <Button
              size="sm"
              variant="outline"
              icon={Edit3}
              onClick={() => handleOpenEdit(u)}
              title="Edit Member ID, Name, Email, or Role"
            >
              Edit
            </Button>
          )}

          {/* Reset Password */}
          {isSystemOwner && (
            <Button
              size="sm"
              variant="secondary"
              icon={Key}
              onClick={() => handleOpenResetPassword(u)}
              title="Set new password for this Member ID"
            >
              Password
            </Button>
          )}

          {/* Deactivate/Reactivate toggle */}
          {u.role !== 'SYSTEM_OWNER' && u.username?.toUpperCase() !== 'IMTHIYAS' && isSystemOwner && (
            <Button
              size="sm"
              variant={u.isActive ? 'ghost' : 'secondary'}
              onClick={() => handleToggleActive(u)}
            >
              {u.isActive ? 'Suspend' : 'Activate'}
            </Button>
          )}

          {/* Delete User */}
          {u.role !== 'SYSTEM_OWNER' && u.username?.toUpperCase() !== 'IMTHIYAS' && isSystemOwner && (
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => handleOpenDelete(u)}
              title="Permanently remove member"
            />
          )}
        </div>
      ),
    },
  ];

  const currentRoleDef = roles.find((r) => r.code === selectedRoleCode);

  return (
    <div className="space-y-6">
      {/* Sovereign Authority Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0E1524] via-[#10192D] to-[#0A101C] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 font-serif">
                System Owner Sovereign ID & Credential Governance
              </h2>
              <Badge variant={isSystemOwner ? 'accent' : 'warning'} size="sm">
                {isSystemOwner ? 'ROOT PRIVILEGES ACTIVE' : 'READ-ONLY MATRIX'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              System Owner (Imthiyas) possesses full governance to create, delete, add, modify, and set passwords for every member ID.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'users' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('users')}
          >
            User Accounts ({users.length})
          </Button>
          <Button
            variant={activeTab === 'matrix' ? 'primary' : 'outline'}
            size="sm"
            icon={Sliders}
            onClick={() => setActiveTab('matrix')}
          >
            Role Permissions Matrix
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-mono transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Tab 1: User Directory & Credential Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Institutional Member Directory
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Every member has a compulsory Member ID and Password created and maintained by System Owner Imthiyas.
              </p>
            </div>
            {isSystemOwner && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsAddModalOpen(true)}
              >
                Create New Member Account
              </Button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Member ID, Full Name, Email, or Phone..."
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none w-full sm:w-auto"
              >
                <option value="ALL">All Roles ({users.length})</option>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {roles.map((r) => {
              const count = users.filter((u) => u.role === r.code).length;
              return (
                <div
                  key={r.code}
                  onClick={() => setRoleFilter(r.code)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    roleFilter === r.code
                      ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50'
                      : 'bg-[#0A101C] hover:bg-[#0E1524] border-slate-800'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-200 truncate">{r.name}</div>
                  <div className="text-base font-bold text-cyan-400 mt-1">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <Table
            columns={userColumns}
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Tab 2: Role Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Role Permissions Architecture
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure fine-grained operational access across roles.
              </p>
            </div>

            {isSystemOwner && (
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={isSavingPerms}
                onClick={handleSaveRolePermissions}
              >
                Save Permissions
              </Button>
            )}
          </div>

          {matrixSaveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Role permissions matrix updated successfully across all campus nodes.</span>
            </div>
          )}

          {/* Role selector tabs */}
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.code}
                onClick={() => setSelectedRoleCode(r.code)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedRoleCode === r.code
                    ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 font-semibold'
                    : 'bg-[#0A101C] hover:bg-[#0E1524] border border-slate-800 text-slate-400'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Permission groups */}
          <div className="space-y-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.category} className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    {group.category}
                  </h3>
                  {isSystemOwner && selectedRoleCode !== 'SYSTEM_OWNER' && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleSelectAllCategory(group.permissions)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => handleClearCategory(group.permissions)}
                        className="text-slate-400 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.permissions.map((p) => {
                    const isChecked =
                      selectedRoleCode === 'SYSTEM_OWNER' || activeRolePerms.includes(p.code);
                    return (
                      <div
                        key={p.code}
                        onClick={() => handleTogglePerm(p.code)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-200'
                            : 'bg-[#0E1524] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isChecked
                              ? 'bg-cyan-500 text-slate-950'
                              : 'border border-slate-700 bg-[#0A101C]'
                          }`}
                        >
                          {isChecked && '✓'}
                        </div>
                        <div>
                          <div className="font-semibold">{p.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Modal: Create / Provision New Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Campus Member"
        subtitle="System Owner Governance: Create a compulsory Member ID and Password"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Compulsory access credentials created here allow members to enter CUOIS and the Digital Twin.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Member ID / Username <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="e.g. STU_2025_001 or FAC_JOHN"
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Unique campus identifier used at login.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Initial Security Password <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="e.g. SecurePass@2025"
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Member will use this password to enter.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Legal Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="e.g. Dr. Alex Vance"
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assigned Position / Role <span className="text-cyan-400">*</span>
              </label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as UserRole)}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty / Professor</option>
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="SECURITY">Campus Security</option>
                <option value="STAFF">Staff / Operations</option>
                <option value="MANAGEMENT">Management</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Institutional Email
              </label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Biography / Dossier Note
            </label>
            <textarea
              rows={2}
              value={addBio}
              onChange={(e) => setAddBio(e.target.value)}
              placeholder="Initial profile dossier notes..."
              className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingAdd}>
              Provision Member ID & Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Edit / Modify Member */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Modify Member Details"
        subtitle={`Edit credentials and details for ${editingUser?.fullName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Member ID / Username <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={editingUser?.username?.toUpperCase() === 'IMTHIYAS'}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono disabled:opacity-60"
              />
              {editingUser?.username?.toUpperCase() === 'IMTHIYAS' && (
                <p className="text-[10px] text-amber-400 mt-1">Sovereign Owner ID is permanent.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Legal Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Institutional Email
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assigned Position / Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                disabled={editingUser?.username?.toUpperCase() === 'IMTHIYAS'}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none disabled:opacity-60"
              >
                <option value="SYSTEM_OWNER">System Owner (Root Sovereign)</option>
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="FACULTY">Faculty / Professor</option>
                <option value="STUDENT">Student</option>
                <option value="SECURITY">Campus Security</option>
                <option value="STAFF">Staff / Operations</option>
                <option value="MANAGEMENT">Management</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Bio / Dossier
              </label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingEdit}>
              Save Member Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Reset / Set User Password */}
      <Modal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        title="Reset Member Password"
        subtitle={`System Owner Authority: Set new security password for ${resettingUser?.fullName} (${resettingUser?.username})`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmResetPassword} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Direct Credential Reset</span>
            </div>
            <p className="text-[11px] text-slate-300">
              As System Owner, you can directly override the password for Member ID{' '}
              <strong className="text-amber-300 font-mono">{resettingUser?.username}</strong> without needing their previous passcode.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                New Security Password <span className="text-cyan-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showResetPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showResetPassword ? 'text' : 'password'}
              required
              autoFocus
              value={newPasswordForUser}
              onChange={(e) => setNewPasswordForUser(e.target.value)}
              placeholder="Enter at least 6 characters..."
              className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setResettingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingReset}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Delete User Confirmation */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Delete Member Account"
        subtitle="Permanent removal from institutional database"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">Are you sure you want to delete this member?</div>
              <p className="text-[11px] text-slate-300">
                This will permanently delete the account of{' '}
                <strong className="text-white">{deletingUser?.fullName}</strong> (Member ID:{' '}
                <code className="text-cyan-300 font-mono">{deletingUser?.username}</code>). All associated access sessions will be terminated.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
