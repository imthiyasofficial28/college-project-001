import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, MapPin, Award, BookOpen } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Faculty, Department } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';
import { Table } from '../ui/table.tsx';

export const FacultyView: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Faculty modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specialization, setSpecialization] = useState('');
  const [cabin, setCabin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [f, d] = await Promise.all([api.getFaculty(), api.getDepartments()]);
      setFaculty(f);
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

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dept = departments.find((d) => d.id === deptId);
      await api.addFaculty({
        fullName,
        email,
        employeeCode: empId,
        departmentId: deptId,
        departmentName: dept?.name || 'Department',
        designation: designation as any,
        specialization,
        qualification: cabin || 'Ph.D.',
        joiningDate: new Date().toISOString().split('T')[0],
        workloadHoursPerWeek: 16,
        status: 'ACTIVE',
      });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setEmpId('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'employeeCode',
      header: 'Employee Code',
      render: (f: Faculty) => (
        <span className="font-mono text-cyan-400 font-semibold text-xs">{f.employeeCode}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Faculty Member',
      render: (f: Faculty) => (
        <div>
          <div className="font-semibold text-slate-100 text-xs">{f.fullName}</div>
          <div className="text-[11px] text-slate-400">{f.email}</div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department & Designation',
      render: (f: Faculty) => (
        <div>
          <div className="text-xs text-slate-200">{f.departmentName}</div>
          <div className="text-[10px] text-cyan-400 font-mono">{f.designation.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'specialization',
      header: 'Domain Specialization',
      render: (f: Faculty) => (
        <span className="text-xs text-slate-300 font-sans">{f.specialization || 'General'}</span>
      ),
    },
    {
      key: 'qualification',
      header: 'Qualification',
      render: (f: Faculty) => (
        <span className="text-xs text-slate-400 font-mono">{f.qualification || 'Ph.D.'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Faculty & Academic Staff Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional professors, department chairs, course coordinators, and research fellows.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Faculty Member
        </Button>
      </div>

      <Table columns={columns} data={faculty} keyExtractor={(f) => f.id} isLoading={isLoading} />

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Faculty Member"
        subtitle="Appoint instructor to academic department roster"
        maxWidth="md"
      >
        <form onSubmit={handleAddFaculty} className="space-y-4">
          <Input
            label="Full Name & Academic Title"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Arthur Pendelton"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="arthur.p@apexhorizon.edu"
            />
            <Input
              label="Employee ID"
              required
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder="FAC-2025-0010"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Academic Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              options={[
                { value: 'Professor & Dean', label: 'Professor & Dean' },
                { value: 'Professor', label: 'Professor' },
                { value: 'Associate Professor', label: 'Associate Professor' },
                { value: 'Assistant Professor', label: 'Assistant Professor' },
                { value: 'Lecturer', label: 'Lecturer' },
              ]}
            />
          </div>

          <Input
            label="Research / Domain Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Distributed Consensus & Quantum Networks"
          />

          <Input
            label="Cabin / Office Location"
            value={cabin}
            onChange={(e) => setCabin(e.target.value)}
            placeholder="e.g. Turing Hall, Room 402"
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Faculty
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
