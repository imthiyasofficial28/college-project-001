import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Mail,
  Phone,
  Building,
  FileText,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Save,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Fingerprint,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';

interface ProfileViewProps {
  onNavigate?: (view: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { user, activeRole, rolePermissions, updateFullProfile, changePassword, institution } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Maintenance State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const isSystemOwner = activeRole === 'SYSTEM_OWNER' || user?.username?.toUpperCase() === 'IMTHIYAS';

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg('Full Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateFullProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      setProfileSuccessMsg('Your profile dossier has been successfully updated and saved.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (!isSystemOwner && !currentPassword) {
      setPasswordErrorMsg('Please provide your current password for security verification.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setPasswordSuccessMsg('Security password successfully updated! Use your new password on next sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please authenticate to inspect your personal profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0E1729] via-[#0D1933] to-[#0A101C] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-[#090F1C] rounded-[14px] flex items-center justify-center font-bold text-2xl text-cyan-400 font-serif">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                  {user.fullName}
                </h1>
                <Badge variant={isSystemOwner ? 'accent' : 'info'} size="sm">
                  {isSystemOwner ? 'SOVEREIGN OWNER' : user.role}
                </Badge>
                {user.isActive && (
                  <Badge variant="success" size="sm">
                    ACTIVE MEMBER
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Fingerprint className="w-3.5 h-3.5" />
                  ID: <strong className="text-cyan-300 font-bold">{user.username || user.id}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {isSystemOwner && onNavigate && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={ShieldCheck}
                onClick={() => onNavigate('users-rbac')}
              >
                Manage All Members & Passwords
              </Button>
            </div>
          )}
        </div>

        {isSystemOwner && (
          <div className="mt-4 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-medium">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Completely Developed & Architected by Imthiyas • Root Governance Key</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Support: <a href="mailto:imthiyasofficial28@gmail.com" className="text-cyan-400 underline">imthiyasofficial28@gmail.com</a>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Dossier & Role Matrix */}
        <div className="space-y-6">
          {/* Identity Credentials Card */}
          <div className="p-5 rounded-2xl bg-[#0A101C] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Member Access Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-500">Assigned Member ID</div>
                <div className="font-mono text-cyan-300 font-bold text-sm tracking-wide">
                  {user.username || user.id}
                </div>
                <div className="text-[10px] text-slate-500">
                  Compulsory identifier used to enter the campus and Digital Twin.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-500">Campus Role & Permissions</div>
                <div className="text-slate-200 font-medium">{user.role}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isSystemOwner
                    ? 'Holds sovereign master permissions (*) with full user, twin, and telemetry authority.'
                    : `${rolePermissions.length} operational permissions assigned.`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-500">Institution & Scope</div>
                <div className="text-slate-200 font-medium">{institution?.name || 'CUOIS Enterprise'}</div>
                <div className="text-[10px] text-slate-500">
                  {institution?.code || 'CAMPUS'} • Sovereign Unified Model
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Last Active
                </span>
                <span className="text-slate-300 font-mono">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Active Now'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Authority Badges */}
          <div className="p-5 rounded-2xl bg-[#0A101C] border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Operational Privileges
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {isSystemOwner ? (
                <>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-medium">
                    * Root Governance
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-medium">
                    Digital Twin Telemetry Master
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-medium">
                    User Credential Provisioning
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-medium">
                    System Architecture Root
                  </span>
                </>
              ) : (
                rolePermissions.slice(0, 8).map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Columns (2-wide): Profile Details & Password Maintenance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Maintain Profile Information */}
          <div className="p-6 rounded-2xl bg-[#0A101C] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  Maintain Personal Profile
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your contact information, display name, and academic dossier.
                </p>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Legal Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@campus.edu"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Member ID (Read Only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.username || user.id}
                    className="w-full bg-[#080D18] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-cyan-400 font-mono opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Academic / Professional Biography
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Provide a brief summary of your role, research focus, or background..."
                  className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  isLoading={isSavingProfile}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Section 2: Maintain Security Password */}
          <div className="p-6 rounded-2xl bg-[#0A101C] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Security Password Maintenance
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your personal login password. Next sign in will mandate these credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            {passwordSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {!isSystemOwner && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Current Password <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Security Password <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm New Password <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-[#0E1524] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500">
                  Encrypted using salted PBKDF2 with SHA-512.
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Key}
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
