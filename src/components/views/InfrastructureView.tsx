import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Layers,
  MapPin,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  GraduationCap,
  Users,
  BookOpen,
  Edit2,
  Trash2,
  Briefcase,
  Search,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { Building, Room, Department } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const InfrastructureView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'buildings' | 'departments'>('buildings');

  // Buildings & Rooms state
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Building modal
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [bldName, setBldName] = useState('');
  const [bldCode, setBldCode] = useState('');
  const [bldFloors, setBldFloors] = useState('4');
  const [bldType, setBldType] = useState('ACADEMIC');
  const [isSubmittingBuilding, setIsSubmittingBuilding] = useState(false);

  // Department Modals (Add & Edit)
  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptBuildingId, setDeptBuildingId] = useState('');
  const [deptHODName, setDeptHODName] = useState('');
  const [deptProgramsCount, setDeptProgramsCount] = useState('2');
  const [deptFacultyCount, setDeptFacultyCount] = useState('8');
  const [deptStudentCount, setDeptStudentCount] = useState('120');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  const loadData = async () => {
    try {
      const [b, r, d] = await Promise.all([
        api.getBuildings(),
        api.getRooms(),
        api.getDepartments(),
      ]);
      setBuildings(b);
      setRooms(r);
      setDepartments(d);
      if (b.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(b[0].id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBuilding(true);
    try {
      await api.addBuilding({
        campusId: 'campus_main',
        name: bldName,
        code: bldCode.toUpperCase(),
        floorsCount: parseInt(bldFloors, 10),
        type: bldType as any,
        status: 'OPERATIONAL',
        coordinates: { x: 0, y: 0, z: 0, width: 50, depth: 30, height: 20 },
      });
      setIsBuildingModalOpen(false);
      setBldName('');
      setBldCode('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add building');
    } finally {
      setIsSubmittingBuilding(false);
    }
  };

  // Open Department Modal for Create
  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptDescription('');
    setDeptBuildingId(buildings[0]?.id || '');
    setDeptHODName('');
    setDeptProgramsCount('2');
    setDeptFacultyCount('8');
    setDeptStudentCount('120');
    setIsDeptModalOpen(true);
  };

  // Open Department Modal for Edit
  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDescription(dept.description);
    setDeptBuildingId(dept.buildingId || buildings[0]?.id || '');
    setDeptHODName(dept.headOfDepartmentName || '');
    setDeptProgramsCount(String(dept.programsCount || 1));
    setDeptFacultyCount(String(dept.facultyCount || 5));
    setDeptStudentCount(String(dept.studentCount || 80));
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      alert('Department name and code are required.');
      return;
    }
    setIsSubmittingDept(true);
    try {
      const payload: Partial<Department> = {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDescription.trim(),
        buildingId: deptBuildingId || undefined,
        headOfDepartmentName: deptHODName.trim() || undefined,
        programsCount: parseInt(deptProgramsCount, 10) || 1,
        facultyCount: parseInt(deptFacultyCount, 10) || 1,
        studentCount: parseInt(deptStudentCount, 10) || 0,
      };

      if (editingDept) {
        await api.updateDepartment(editingDept.id, payload);
      } else {
        await api.addDepartment(payload);
      }

      setIsDeptModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save department');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the department "${name}"?`)) return;
    try {
      await api.deleteDepartment(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const buildingRooms = rooms.filter((r) => r.buildingId === selectedBuildingId);

  const filteredDepartments = departments.filter((d) => {
    const q = deptSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.headOfDepartmentName && d.headOfDepartmentName.toLowerCase().includes(q)) ||
      d.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Campus Infrastructure & Academic Departments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical facilities directory, classroom capacity metrics, and academic departments management.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#0A101C] border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'buildings'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Facilities & Venues ({buildings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'departments'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Departments ({departments.length})</span>
            </button>
          </div>

          {activeTab === 'buildings' ? (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsBuildingModalOpen(true)}
            >
              Add Facility
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreateDept}
            >
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Buildings & Rooms */}
      {activeTab === 'buildings' && (
        <div className="space-y-6">
          {/* Buildings Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buildings.map((b) => {
              const count = rooms.filter((r) => r.buildingId === b.id).length;
              const isSelected = selectedBuildingId === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBuildingId(b.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0E1524] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0A101C] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-cyan-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <Badge variant={b.status === 'OPERATIONAL' ? 'success' : 'warning'} size="sm">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm text-slate-100">{b.name}</h3>
                    <p className="text-[11px] font-mono text-cyan-400 mt-0.5">Code: {b.code}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{b.floorsCount} Floors</span>
                    <span>{count} Registered Rooms</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Room Inventory for Selected Building */}
          {selectedBuilding && (
            <div className="p-6 rounded-2xl bg-[#0A101C] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    {selectedBuilding.name} — Venues & Capacity Inventory
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live room allocations, seating capacities, and multimedia readiness.
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  {buildingRooms.length} Rooms Indexed
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {buildingRooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {r.roomNumber}
                      </span>
                      <Badge
                        variant={
                          r.status === 'AVAILABLE'
                            ? 'success'
                            : r.status === 'OCCUPIED'
                            ? 'neutral'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-200 font-medium">{r.type.replace('_', ' ')}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                      <span>Floor {r.floor}</span>
                      <span>Capacity: {r.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                      {r.hasProjector && <span className="text-emerald-400">✓ AV Projector</span>}
                      {r.hasAirConditioning && <span className="text-cyan-400">✓ HVAC</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Academic Departments Directory & Editor */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Search bar & quick filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search departments, HODs, or codes..."
                icon={Search}
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
            <div className="text-xs font-mono text-slate-400">
              Showing {filteredDepartments.length} of {departments.length} Academic Departments
            </div>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDepartments.map((dept) => {
              const bld = buildings.find((b) => b.id === dept.buildingId);
              return (
                <div
                  key={dept.id}
                  className="p-5 rounded-2xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                          {dept.code}
                        </span>
                        <h3 className="text-base font-semibold text-slate-100">{dept.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{dept.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDept(dept)}
                        title="Edit Department"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                        title="Delete Department"
                        className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0E1524] border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">Programs</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {dept.programsCount || 1}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">Faculty</div>
                      <div className="text-sm font-bold text-cyan-400 mt-0.5">
                        {dept.facultyCount || 6}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">Students</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {dept.studentCount || 100}
                      </div>
                    </div>
                  </div>

                  {/* Location & HOD Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        HOD: <strong className="text-slate-300">{dept.headOfDepartmentName || 'Assigned Dean'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{bld ? bld.name : 'Main Campus Complex'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      <Modal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        title="Add Campus Facility"
        subtitle="Registers physical building entity for 3D Twin & Facilities Operations"
        maxWidth="md"
      >
        <form onSubmit={handleAddBuilding} className="space-y-4">
          <Input
            label="Facility Name"
            required
            value={bldName}
            onChange={(e) => setBldName(e.target.value)}
            placeholder="e.g. Nikola Tesla Power Engineering Complex"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Building Code"
              required
              value={bldCode}
              onChange={(e) => setBldCode(e.target.value)}
              placeholder="e.g. TEC"
            />
            <Input
              label="Floors Count"
              required
              type="number"
              value={bldFloors}
              onChange={(e) => setBldFloors(e.target.value)}
            />
          </div>

          <Select
            label="Facility Purpose"
            value={bldType}
            onChange={(e) => setBldType(e.target.value)}
            options={[
              { value: 'ACADEMIC', label: 'Academic Classrooms' },
              { value: 'LABORATORY', label: 'Research & Computing Labs' },
              { value: 'LIBRARY', label: 'Knowledge Repository' },
              { value: 'ADMINISTRATIVE', label: 'Administration & Governance' },
              { value: 'HOSTEL', label: 'Residential Halls' },
              { value: 'SPORTS', label: 'Athletics & Recreation' },
            ]}
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBuildingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingBuilding}>
              Register Facility
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Academic Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? 'Edit Academic Department' : 'Add Academic Department'}
        subtitle="Manage degree departments, allocated faculty, and assigned campus facilities"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4">
          <Input
            label="Department Name"
            required
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="e.g. Computer Science & Artificial Intelligence"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code"
              required
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. CSAI"
            />
            <Select
              label="Assigned Campus Building"
              value={deptBuildingId}
              onChange={(e) => setDeptBuildingId(e.target.value)}
              options={buildings.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          <Input
            label="Head of Department (HOD) Name"
            value={deptHODName}
            onChange={(e) => setDeptHODName(e.target.value)}
            placeholder="e.g. Prof. Marcus Chen, Ph.D."
          />

          <Input
            label="Department Scope & Description"
            value={deptDescription}
            onChange={(e) => setDeptDescription(e.target.value)}
            placeholder="e.g. High-performance computing, neural networks, and embedded systems"
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Programs Count"
              type="number"
              value={deptProgramsCount}
              onChange={(e) => setDeptProgramsCount(e.target.value)}
            />
            <Input
              label="Faculty Count"
              type="number"
              value={deptFacultyCount}
              onChange={(e) => setDeptFacultyCount(e.target.value)}
            />
            <Input
              label="Student Capacity"
              type="number"
              value={deptStudentCount}
              onChange={(e) => setDeptStudentCount(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingDept}>
              {editingDept ? 'Save Department Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
