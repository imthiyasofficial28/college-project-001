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

export const UsersRbacView: React.FC = () => {
  const { user, activeRole, refreshState } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // System Owner permission matrix editor state
  const isSystemOwner = activeRole === 'SYSTEM_OWNER';
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('ADMINISTRATOR');
  const [activeRolePerms, setActiveRolePerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [matrixSaveSuccess, setMatrixSaveSuccess] = useState(false);

  // Add User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Cuois@2025');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Position Modal (System Owner sovereignty)
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<UserRole>('STUDENT');
  const [isSavingUserRole, setIsSavingUserRole] = useState(false);

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

  // Update activeRolePerms when selectedRoleCode changes or roles load
  useEffect(() => {
    const r = roles.find((item) => item.code === selectedRoleCode);
    if (r) {
      setActiveRolePerms([...r.permissions]);
    }
  }, [selectedRoleCode, roles]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createUser({
        fullName,
        email,
        username: username || email.split('@')[0],
        password,
        role,
        isActive: true,
      });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setUsername('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser: UserType) => {
    if (targetUser.role === 'SYSTEM_OWNER') {
      alert('Cannot deactivate System Owner');
      return;
    }
    try {
      await api.updateUser(targetUser.id, { isActive: !targetUser.isActive });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Matrix Permission toggle
  const handleTogglePerm = (permCode: string) => {
    if (!isSystemOwner) {
      alert('Access Restricted: Only the System Owner can modify role permissions.');
      return;
    }
    if (selectedRoleCode === 'SYSTEM_OWNER') {
      alert('System Owner role inherently retains unrestricted root permissions (*).');
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
    if (!isSystemOwner) return;
    if (selectedRoleCode === 'SYSTEM_OWNER') return;
    const codes = permissions.map((p) => p.code);
    setActiveRolePerms((prev) => Array.from(new Set([...prev, ...codes])));
  };

  const handleClearCategory = (permissions: PermissionItem[]) => {
    if (!isSystemOwner) return;
    if (selectedRoleCode === 'SYSTEM_OWNER') return;
    const codes = new Set(permissions.map((p) => p.code));
    setActiveRolePerms((prev) => prev.filter((p) => !codes.has(p)));
  };

  const handleGrantFullAccess = () => {
    if (!isSystemOwner) return;
    if (selectedRoleCode === 'SYSTEM_OWNER') return;
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
      alert('Access Restricted: Only the System Owner can save position access policies.');
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
      alert(err.message || 'Failed to update role permissions');
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

  const handleOpenEditUserRole = (u: UserType) => {
    setEditingUser(u);
    setNewRoleForUser(u.role);
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUserRole(true);
    try {
      await api.updateUser(editingUser.id, { role: newRoleForUser });
      setEditingUser(null);
      await loadData();
      await refreshState();
    } catch (err: any) {
      alert(err.message || 'Failed to update user position');
    } finally {
      setIsSavingUserRole(false);
    }
  };

  const userColumns = [
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
          <div className="text-[11px] text-slate-400">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Position',
      render: (u: UserType) => (
        <Badge variant={roleColors[u.role] || 'neutral'} size="sm">
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Account Status',
      render: (u: UserType) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Authentication',
      render: (u: UserType) => (
        <span className="text-xs text-slate-400 font-mono">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (u: UserType) => (
        <div className="flex items-center justify-end gap-2">
          {isSystemOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEditUserRole(u)}
            >
              Change Position
            </Button>
          )}
          {u.role !== 'SYSTEM_OWNER' && isSystemOwner && (
            <Button
              size="sm"
              variant={u.isActive ? 'ghost' : 'secondary'}
              onClick={() => handleToggleActive(u)}
            >
              {u.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const currentRoleDef = roles.find((r) => r.code === selectedRoleCode);

  return (
    <div className="space-y-6">
      {/* Sovereign Authority Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0E1524] via-[#10192D] to-[#0A101C] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 font-serif">
                System Owner Sovereign Access Architecture
              </h2>
              <Badge variant={isSystemOwner ? 'accent' : 'warning'} size="sm">
                {isSystemOwner ? 'ROOT PRIVILEGES ACTIVE' : 'READ-ONLY MATRIX'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Only the System Owner holds root authority (<code className="text-cyan-300 font-mono">*</code>) and can allocate, restrict, or revoke permissions across all campus positions.
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

      {/* Tab 1: User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Institutional User Directory
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Active credential holders, PBKDF2 authentication records, and assigned operational roles.
              </p>
            </div>
            {isSystemOwner && (
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
                Provision User Account
              </Button>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roles.map((r) => {
              const count = users.filter((u) => u.role === r.code).length;
              return (
                <div
                  key={r.code}
                  onClick={() => {
                    setSelectedRoleCode(r.code);
                    setActiveTab('matrix');
                  }}
                  className="p-3.5 rounded-xl bg-[#0A101C] hover:bg-[#0E1524] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{r.name}</span>
                    <Badge variant={roleColors[r.code as UserRole] || 'neutral'} size="sm">
                      {count} Users
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {r.permissions.length} active permissions • Click to inspect matrix
                  </p>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <Table columns={userColumns} data={users} keyExtractor={(u) => u.id} isLoading={isLoading} />
        </div>
      )}

      {/* Tab 2: Position Permissions Matrix Configurator */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Position Access Control & Permissions Matrix
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure granular functional capabilities for each campus position. All changes are enforced in real-time.
              </p>
            </div>

            {isSystemOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleResetToDefault}
                  disabled={selectedRoleCode === 'SYSTEM_OWNER'}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  isLoading={isSavingPerms}
                  onClick={handleSaveRolePermissions}
                  disabled={selectedRoleCode === 'SYSTEM_OWNER'}
                >
                  Save Access Policy
                </Button>
              </div>
            )}
          </div>

          {matrixSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Access policy for <strong>{currentRoleDef?.name}</strong> successfully updated and enforced system-wide.
              </span>
            </div>
          )}

          {/* Role selector pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#0A101C] border border-slate-800">
            {roles.map((r) => {
              const isSelected = selectedRoleCode === r.code;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setSelectedRoleCode(r.code)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{r.name}</span>
                  {r.code === 'SYSTEM_OWNER' ? (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">ROOT</span>
                  ) : (
                    <span className="text-[10px] font-mono opacity-70">
                      ({r.permissions.length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Role Meta Card */}
          <div className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  Target Position:
                </span>
                <span className="text-sm font-bold text-slate-100">{currentRoleDef?.name}</span>
                <Badge variant={roleColors[selectedRoleCode as UserRole] || 'neutral'} size="sm">
                  {selectedRoleCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{currentRoleDef?.description}</p>
            </div>

            {selectedRoleCode !== 'SYSTEM_OWNER' && isSystemOwner && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleGrantFullAccess}>
                  Grant Full Access
                </Button>
              </div>
            )}
          </div>

          {/* If System Owner is selected */}
          {selectedRoleCode === 'SYSTEM_OWNER' ? (
            <div className="p-8 rounded-2xl bg-[#0A101C] border border-amber-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-base font-serif font-bold text-slate-100">
                System Owner Root Sovereignty
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                The System Owner position possesses universal root privileges (<code className="text-amber-400 font-mono">*</code>) across every subsystem, API, and database entity. Root privileges cannot be modified or degraded to prevent institutional lockout.
              </p>
            </div>
          ) : (
            /* Permission Groups Grid */
            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group) => {
                const activeInGroupCount = group.permissions.filter((p) =>
                  activeRolePerms.includes(p.code)
                ).length;
                return (
                  <div
                    key={group.category}
                    className="p-5 rounded-2xl bg-[#0A101C] border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-200">{group.category}</h3>
                        <Badge variant="info" size="sm">
                          {activeInGroupCount} / {group.permissions.length} Enabled
                        </Badge>
                      </div>

                      {isSystemOwner && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllCategory(group.permissions)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
                          >
                            Select All
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={() => handleClearCategory(group.permissions)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 font-mono"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.permissions.map((perm) => {
                        const isChecked = activeRolePerms.includes(perm.code);
                        return (
                          <div
                            key={perm.code}
                            onClick={() => isSystemOwner && handleTogglePerm(perm.code)}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isSystemOwner ? 'cursor-pointer' : 'cursor-default'
                            } ${
                              isChecked
                                ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-200 shadow-sm'
                                : 'bg-[#0E1524] border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => isSystemOwner && handleTogglePerm(perm.code)}
                                disabled={!isSystemOwner}
                                className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                              />
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                                  <span>{perm.label}</span>
                                </div>
                                <div className="text-[10px] font-mono text-cyan-400/80">
                                  {perm.code}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Bottom Sticky Save Bar for System Owner */}
              {isSystemOwner && (
                <div className="p-4 rounded-xl bg-[#0E1524] border border-cyan-500/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Saving will enforce {activeRolePerms.length} capabilities for{' '}
                      <strong>{currentRoleDef?.name}</strong>.
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Save}
                    isLoading={isSavingPerms}
                    onClick={handleSaveRolePermissions}
                  >
                    Save Access Policy
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision User Account"
        subtitle="Registers user credentials and binds security roles"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Jordan Bell"
          />

          <Input
            label="Institutional Email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan.bell@apexhorizon.edu"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jbell"
            />
            <Select
              label="Assigned Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'ADMINISTRATOR', label: 'Administrator' },
                { value: 'EDITOR', label: 'Editor / Content Publisher' },
                { value: 'MANAGEMENT', label: 'Management' },
                { value: 'FACULTY', label: 'Faculty' },
                { value: 'STUDENT', label: 'Student' },
                { value: 'SECURITY', label: 'Security Officer' },
                { value: 'STAFF', label: 'Staff / Facilities' },
              ]}
            />
          </div>

          <Input
            label="Initial Access Passcode"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Encrypted via cryptographic PBKDF2 with unique salt."
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Position Modal (System Owner Sovereign Access) */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Reassign User Position"
        subtitle={`System Owner Sovereignty: Configure access position for ${editingUser?.fullName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUserRole} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Target User:</span>
              <span className="font-semibold text-slate-100">{editingUser?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Position:</span>
              <span className="font-mono text-cyan-400">{editingUser?.role}</span>
            </div>
          </div>

          <Select
            label="Select New Position / Role"
            value={newRoleForUser}
            onChange={(e) => setNewRoleForUser(e.target.value as UserRole)}
            options={[
              { value: 'SYSTEM_OWNER', label: 'System Owner (Root Sovereign)' },
              { value: 'ADMINISTRATOR', label: 'Administrator' },
              { value: 'EDITOR', label: 'Editor / Content Publisher' },
              { value: 'MANAGEMENT', label: 'Management' },
              { value: 'FACULTY', label: 'Faculty' },
              { value: 'STUDENT', label: 'Student' },
              { value: 'SECURITY', label: 'Security Officer' },
              { value: 'STAFF', label: 'Staff / Facilities' },
            ]}
            helperText="As System Owner, you determine the exact operational position and privileges."
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingUserRole}>
              Update User Position
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
