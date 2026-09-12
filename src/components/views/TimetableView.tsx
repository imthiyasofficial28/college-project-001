import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, AlertCircle, Clock, MapPin, User, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { TimetableEntry, Subject, Room, Faculty, Section } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Select, Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const TimetableView: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add slot modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // 1 = Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = [
    { day: 1, label: 'Monday' },
    { day: 2, label: 'Tuesday' },
    { day: 3, label: 'Wednesday' },
    { day: 4, label: 'Thursday' },
    { day: 5, label: 'Friday' },
    { day: 6, label: 'Saturday' },
  ];

  const loadData = async () => {
    try {
      const [t, s, r, f, sec] = await Promise.all([
        api.getTimetable(),
        api.getSubjects(),
        api.getRooms(),
        api.getFaculty(),
        api.getSections(),
      ]);
      setTimetable(t);
      setSubjects(s);
      setRooms(r);
      setFaculty(f);
      setSections(sec);

      if (s.length > 0 && !subjectId) setSubjectId(s[0].id);
      if (r.length > 0 && !roomId) setRoomId(r[0].id);
      if (f.length > 0 && !facultyId) setFacultyId(f[0].id);
      if (sec.length > 0 && !sectionId) setSectionId(sec[0].id);

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setIsSubmitting(true);

    const sub = subjects.find((s) => s.id === subjectId);
    const rm = rooms.find((r) => r.id === roomId);
    const fac = faculty.find((f) => f.id === facultyId);
    const sec = sections.find((s) => s.id === sectionId);

    try {
      await api.addTimetableEntry({
        academicYearId: 'ay_2025_2026',
        sectionId,
        sectionName: sec?.name || 'A',
        subjectId,
        subjectName: sub?.name || 'Subject',
        facultyId,
        facultyName: fac?.fullName || 'Faculty',
        roomId,
        roomNumber: rm?.roomNumber || 'Room',
        dayOfWeek,
        startTime,
        endTime,
        periodIndex: 1,
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setConflictError(err.message || 'Timetable scheduling conflict detected');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await api.deleteTimetableEntry(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            Timetable Matrix & Conflict Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized institutional schedule with automatic room and faculty double-booking detection.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setConflictError(null);
            setIsModalOpen(true);
          }}
        >
          Schedule Class Slot
        </Button>
      </div>

      {/* Timetable Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((d) => {
          const daySlots = timetable
            .filter((t) => t.dayOfWeek === d.day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={d.day}
              className="bg-[#0A101C] border border-slate-800/90 rounded-xl p-4 flex flex-col h-full"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  {d.label}
                </span>
                <Badge variant="neutral" size="sm">
                  {daySlots.length} Sessions
                </Badge>
              </div>

              <div className="space-y-3 flex-1">
                {daySlots.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-mono">
                    No classes scheduled
                  </div>
                ) : (
                  daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-lg bg-[#0E1524] border border-slate-800 hover:border-cyan-500/30 transition-all group relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {slot.subjectName}
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {slot.subjectCode} • Sec {slot.sectionName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-300 font-semibold">{slot.roomNumber}</span>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{slot.facultyName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Class Session"
        subtitle="Automatic validation checks room, instructor, and section availability."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSlot} className="space-y-4">
          {conflictError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{conflictError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label="Day of Week"
                value={String(dayOfWeek)}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                options={days.map((d) => ({ value: String(d.day), label: d.label }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Course Subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                options={subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
              />
            </div>
            <div>
              <Select
                label="Section Cohort"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                options={sections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
              />
            </div>
            <div>
              <Select
                label="Instructor / Faculty"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                options={faculty.map((f) => ({ value: f.id, label: f.fullName }))}
              />
            </div>
            <div>
              <Select
                label="Venue / Classroom"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                options={rooms.map((r) => ({
                  value: r.id,
                  label: `${r.roomNumber} (${r.type}, Cap: ${r.capacity})`,
                }))}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Validate & Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
