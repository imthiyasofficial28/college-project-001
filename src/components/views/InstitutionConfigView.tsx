import React, { useState, useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  Layers,
  Calendar,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Archive,
  CheckCircle2,
  Search,
  Download,
  Save,
  ShieldCheck,
  Sparkles,
  MapPin,
  School,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import {
  Institution,
  Department,
  Program,
  AcademicYear,
  Semester,
  Section,
  Subject,
  Building,
  Room,
} from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Modal } from '../ui/modal.tsx';
import { Input, Textarea, Select } from '../ui/input.tsx';

type MasterTab = 'INSTITUTION' | 'DEPARTMENTS' | 'PROGRAMS' | 'ACADEMIC_YEARS' | 'BUILDINGS_ROOMS' | 'SUBJECTS';

export const InstitutionConfigView: React.FC = () => {
  const { markDataSaved } = useAuth();

  const [activeTab, setActiveTab] = useState<MasterTab>('INSTITUTION');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Master records
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Institution form
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [instChancellor, setInstChancellor] = useState('');
  const [instMotto, setInstMotto] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instDomain, setInstDomain] = useState('');

  // Department modal state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHod, setDeptHod] = useState('');

  // Subject modal state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subCredits, setSubCredits] = useState('4');
  const [subDeptId, setSubDeptId] = useState('');

  // Room modal state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomBuildingId, setRoomBuildingId] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('60');
  const [roomType, setRoomType] = useState<'CLASSROOM' | 'LABORATORY' | 'AUDITORIUM' | 'CONFERENCE'>('CLASSROOM');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inst, depts, progs, ays, sems, blds, rms, subs] = await Promise.all([
        api.getInstitution(),
        api.getDepartments(),
        api.getPrograms(),
        api.getAcademicYears(),
        api.getSemesters(),
        api.getBuildings(),
        api.getRooms(),
        api.getSubjects(),
      ]);
      setInstitution(inst);
      if (inst) {
        setInstName(inst.name || '');
        setInstCode(inst.code || '');
        setInstChancellor(inst.chancellorName || 'Dr. Eleanor Vance, Ph.D');
        setInstMotto(inst.motto || 'Knowledge, Sovereign Intellect, & Humanity');
        setInstAddress(inst.address || '742 Cambridge Innovation Corridor');
        setInstDomain(inst.domain || 'cuois.edu');
      }
      setDepartments(depts);
      setPrograms(progs);
      setAcademicYears(ays);
      setSemesters(sems);
      setBuildings(blds);
      setRooms(rms);
      setSubjects(subs);
    } catch (err) {
      console.error('Failed to load institution master data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateInstitution({
        name: instName,
        code: instCode,
        chancellorName: instChancellor,
        motto: instMotto,
        address: instAddress,
        domain: instDomain,
      });
      setInstitution(updated);
      markDataSaved();
      setSaveSuccessMsg('Institution profile configuration updated and saved to local memory.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        // Edit existing
        const updated = departments.map((d) =>
          d.id === editingDeptId ? { ...d, name: deptName, code: deptCode, hodName: deptHod } : d
        );
        setDepartments(updated);
      } else {
        // Create new
        const newDept: Department = {
          id: `dept_${Date.now()}`,
          name: deptName,
          code: deptCode.toUpperCase(),
          hodName: deptHod,
          description: `Department of ${deptName}`,
          status: 'ACTIVE',
        };
        setDepartments([...departments, newDept]);
      }
      markDataSaved();
      setIsDeptModalOpen(false);
      setEditingDeptId(null);
      setDeptName('');
      setDeptCode('');
      setDeptHod('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      name: subName,
      code: subCode.toUpperCase(),
      credits: parseInt(subCredits, 10) || 4,
      departmentId: subDeptId || departments[0]?.id || 'dept_cs',
      theoryHours: 3,
      labHours: 1,
      isElective: false,
      status: 'ACTIVE',
    };
    setSubjects([...subjects, newSub]);
    markDataSaved();
    setIsSubModalOpen(false);
    setSubName('');
    setSubCode('');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: Room = {
      id: `rm_${Date.now()}`,
      roomNumber,
      buildingId: roomBuildingId || buildings[0]?.id || 'bld_01',
      capacity: parseInt(roomCapacity, 10) || 60,
      type: roomType,
      floor: 1,
      status: 'AVAILABLE',
      hasProjector: true,
      hasAirConditioning: true,
    };
    setRooms([...rooms, newRoom]);
    markDataSaved();
    setIsRoomModalOpen(false);
    setRoomNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1524] border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              Institution Data Control & Academic Registry
            </h1>
            <Badge variant="cyan" className="font-mono text-[10px]">
              MASTER GOVERNANCE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain institutional metadata, academic calendar cycles, department faculties, buildings, rooms, and courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Save}
            onClick={() => {
              markDataSaved();
              setSaveSuccessMsg('All master configurations synchronized and saved.');
              setTimeout(() => setSaveSuccessMsg(null), 2500);
            }}
          >
            Persist to Memory
          </Button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Master Configuration Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#080E1A] border border-slate-800">
        {[
          { id: 'INSTITUTION' as MasterTab, label: 'Institution Profile', icon: School },
          { id: 'DEPARTMENTS' as MasterTab, label: `Departments (${departments.length})`, icon: Layers },
          { id: 'PROGRAMS' as MasterTab, label: `Programs & Degrees (${programs.length})`, icon: GraduationCap },
          { id: 'ACADEMIC_YEARS' as MasterTab, label: `Academic Calendar (${academicYears.length})`, icon: Calendar },
          { id: 'BUILDINGS_ROOMS' as MasterTab, label: `Buildings & Rooms (${rooms.length})`, icon: Building2 },
          { id: 'SUBJECTS' as MasterTab, label: `Course Catalog (${subjects.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Institution Profile & Sovereign Metadata */}
      {activeTab === 'INSTITUTION' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6">
          <h2 className="text-base font-serif font-bold text-slate-100 mb-1">
            University Identity, Accreditation & Branding
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Configure institutional naming, accreditation, chancellor details, and official domain routing.
          </p>

          <form onSubmit={handleSaveInstitution} className="space-y-5 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution Official Name"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Apex Institute of Technology & Advanced Science"
              />
              <Input
                label="Institutional Code / Acronym"
                required
                value={instCode}
                onChange={(e) => setInstCode(e.target.value)}
                placeholder="e.g. CUOIS-TECH"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Chancellor / President Name"
                value={instChancellor}
                onChange={(e) => setInstChancellor(e.target.value)}
                placeholder="e.g. Dr. Eleanor Vance, Ph.D"
              />
              <Input
                label="Institutional Domain Name"
                value={instDomain}
                onChange={(e) => setInstDomain(e.target.value)}
                placeholder="e.g. cuois.edu"
              />
            </div>

            <Input
              label="Institutional Motto / Sovereign Doctrine"
              value={instMotto}
              onChange={(e) => setInstMotto(e.target.value)}
              placeholder="e.g. Knowledge, Sovereign Intellect, & Humanity"
            />

            <Textarea
              label="Physical Campus Address & Coordinates"
              value={instAddress}
              onChange={(e) => setInstAddress(e.target.value)}
              placeholder="e.g. 742 Cambridge Innovation Corridor, Sector 4, Silicon Valley Campus"
              rows={2}
            />

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="primary" type="submit" icon={Save}>
                Save Institution Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Departments Master */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                Academic Departments Registry
              </h2>
              <p className="text-xs text-slate-400">
                Manage schools, departmental heads, and academic faculties
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingDeptId(null);
                setDeptName('');
                setDeptCode('');
                setDeptHod('');
                setIsDeptModalOpen(true);
              }}
            >
              Add Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="cyan" className="font-mono text-[10px]">
                      {dept.code}
                    </Badge>
                    <Badge variant={dept.status === 'ACTIVE' ? 'emerald' : 'outline'} className="text-[9px]">
                      {dept.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{dept.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    HOD: <strong className="text-slate-300">{dept.hodName || 'Dr. Arthur Pendelton'}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit2}
                    onClick={() => {
                      setEditingDeptId(dept.id);
                      setDeptName(dept.name);
                      setDeptCode(dept.code);
                      setDeptHod(dept.hodName || '');
                      setIsDeptModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Programs & Degrees */}
      {activeTab === 'PROGRAMS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                Programs, Degrees & Majors
              </h2>
              <p className="text-xs text-slate-400">
                Undergraduate, Postgraduate, and Doctoral degree tracks
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Program Code</th>
                  <th className="py-2.5 px-3">Degree Title</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {programs.map((prog) => (
                  <tr key={prog.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{prog.code}</td>
                    <td className="py-3 px-3 text-slate-200 font-sans font-semibold">{prog.name}</td>
                    <td className="py-3 px-3 text-slate-400">Computer Science</td>
                    <td className="py-3 px-3 text-slate-300">{prog.durationSemesters} Semesters (4 Yrs)</td>
                    <td className="py-3 px-3 text-slate-300">{prog.totalCredits} Credits</td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" className="text-[10px]">ACTIVE</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Academic Calendar Cycles */}
      {activeTab === 'ACADEMIC_YEARS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-100">
              Academic Calendar Cycles & Semesters
            </h2>
            <p className="text-xs text-slate-400">
              Active operational semesters and term dates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {academicYears.map((ay) => (
              <div key={ay.id} className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100 font-mono">{ay.name}</span>
                  {ay.isCurrent && <Badge variant="emerald">CURRENT ACTIVE</Badge>}
                </div>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>Start Date: {ay.startDate}</div>
                  <div>End Date: {ay.endDate}</div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                  Includes Fall & Spring semesters with examination windows.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Buildings & Rooms */}
      {activeTab === 'BUILDINGS_ROOMS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                Classroom, Laboratory & Facility Directory
              </h2>
              <p className="text-xs text-slate-400">
                Manage room capacities, equipment specifications, and venue assignments
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsRoomModalOpen(true)}
            >
              Add Room
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {rooms.map((room) => (
              <div key={room.id} className="p-3.5 rounded-xl bg-[#080E1A] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{room.roomNumber}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{room.type}</Badge>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Capacity: <strong>{room.capacity} seats</strong> • Floor {room.floor}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 truncate">
                  Equipment: {room.equipment?.join(', ') || 'Smartboard, AV Projector'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Course Catalog */}
      {activeTab === 'SUBJECTS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                Subject & Course Catalog
              </h2>
              <p className="text-xs text-slate-400">
                Courses, course codes, and assigned credit units
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsSubModalOpen(true)}
            >
              Add Course
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{sub.code}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{sub.name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{sub.credits} Credits</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="emerald" className="text-[10px]">{sub.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDeptId ? 'Edit Department' : 'Add New Department'}
        subtitle="Department will be persisted to institutional data memory"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4">
          <Input
            label="Department Name"
            required
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="e.g. Department of Mechanical Engineering"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code"
              required
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. MECH"
            />
            <Input
              label="Head of Department"
              value={deptHod}
              onChange={(e) => setDeptHod(e.target.value)}
              placeholder="e.g. Prof. David Miller"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Course Modal */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title="Add Course to Master Catalog"
        subtitle="Specify course code, credits and title"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <Input
            label="Course Title"
            required
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="e.g. Cryptography and Quantum Security"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Course Code"
              required
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
              placeholder="e.g. CS410"
            />
            <Input
              label="Credits"
              type="number"
              value={subCredits}
              onChange={(e) => setSubCredits(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsSubModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title="Add Campus Room or Laboratory"
        subtitle="Register new physical classroom"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <Input
            label="Room Code / Number"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. Turing CS-305"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Seating Capacity"
              type="number"
              value={roomCapacity}
              onChange={(e) => setRoomCapacity(e.target.value)}
            />
            <Select
              label="Room Category"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as any)}
              options={[
                { value: 'CLASSROOM', label: 'Lecture Classroom' },
                { value: 'LABORATORY', label: 'Computing / Hardware Lab' },
                { value: 'AUDITORIUM', label: 'Auditorium' },
                { value: 'CONFERENCE', label: 'Seminar Room' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Room
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
