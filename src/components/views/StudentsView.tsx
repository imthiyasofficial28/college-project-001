import React, { useState, useEffect } from 'react';
import { Search, Plus, GraduationCap, Filter, UserCheck } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Student, Department } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';
import { Table } from '../ui/table.tsx';

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Enroll modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [s, d] = await Promise.all([api.getStudents(), api.getDepartments()]);
      setStudents(s);
      setDepartments(d);
      if (d.length > 0 && !deptId) setDeptId(d[0].id);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedDept = departments.find((d) => d.id === deptId);
      await api.addStudent({
        fullName,
        email,
        registrationNumber: regNo,
        departmentId: deptId,
        departmentName: selectedDept?.name || 'Department',
        programId: 'prog_cs_btech',
        programName: 'Bachelor of Technology',
        currentSemester: parseInt(semester, 10),
        sectionId: 'sec_1',
        sectionName: section,
        guardianName,
        guardianPhone: guardianEmail,
        cgpa: 3.5,
        attendancePercentage: 100,
        status: 'ACTIVE',
      });
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRegNo('');
    setSemester('1');
    setSection('A');
    setGuardianName('');
    setGuardianEmail('');
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || s.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  const columns = [
    {
      key: 'registrationNumber',
      header: 'Reg Number',
      render: (s: Student) => (
        <span className="font-mono text-cyan-400 font-semibold text-xs">{s.registrationNumber}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Student Name',
      render: (s: Student) => (
        <div>
          <div className="font-semibold text-slate-100 text-xs">{s.fullName}</div>
          <div className="text-[11px] text-slate-400">{s.email}</div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Program / Dept',
      render: (s: Student) => (
        <div>
          <div className="text-xs text-slate-200">{s.departmentName}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            Sem {s.currentSemester} • Sec {s.sectionName}
          </div>
        </div>
      ),
    },
    {
      key: 'cgpa',
      header: 'Academic CGPA',
      render: (s: Student) => (
        <span className="font-mono font-bold text-xs text-slate-200">
          {s.cgpa ? s.cgpa.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance Rate',
      render: (s: Student) => {
        const rate = s.attendancePercentage;
        const isLow = rate < 75;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, rate)}%` }}
              />
            </div>
            <Badge variant={isLow ? 'danger' : 'success'} size="sm">
              {rate}%
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <Badge
          variant={s.status === 'ACTIVE' ? 'success' : s.status === 'ALUMNI' ? 'info' : 'danger'}
          size="sm"
        >
          {s.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            Students Directory & Cohort Standings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time enrollment rosters, academic performance, and attendance thresholds.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Enroll Student
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, reg number, or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
        <div className="ml-auto text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredStudents.length}</span> records
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredStudents}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
      />

      {/* Enroll Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Student"
        subtitle="Register a student directly into institutional records"
        maxWidth="lg"
      >
        <form onSubmit={handleEnroll} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Full Student Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
              />
            </div>
            <div>
              <Input
                label="University Email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya.lin@student.apexhorizon.edu"
              />
            </div>
            <div>
              <Input
                label="Registration / Roll Number"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. STU-2025-0099"
              />
            </div>
            <div>
              <Select
                label="Department"
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: String(s), label: `Sem ${s}` }))}
              />
              <Select
                label="Section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                options={['A', 'B', 'C'].map((sec) => ({ value: sec, label: `Sec ${sec}` }))}
              />
            </div>
            <div>
              <Input
                label="Guardian Full Name"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Parent / Guardian Name"
              />
            </div>
            <div>
              <Input
                label="Guardian Email"
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="guardian@example.com"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Complete Enrollment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
