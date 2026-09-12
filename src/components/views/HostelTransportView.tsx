import React, { useState, useEffect } from 'react';
import {
  Bus,
  Hotel,
  MapPin,
  User,
  Fuel,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Bed,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { Hostel, Vehicle, TransportRoute } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Modal } from '../ui/modal.tsx';

export const HostelTransportView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Hostel Modal State
  const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [hostelName, setHostelName] = useState('');
  const [hostelCode, setHostelCode] = useState('');
  const [hostelGender, setHostelGender] = useState<'MALE' | 'FEMALE' | 'CO_ED'>('MALE');
  const [hostelWardenName, setHostelWardenName] = useState('');
  const [hostelWardenPhone, setHostelWardenPhone] = useState('');
  const [hostelTotalFloors, setHostelTotalFloors] = useState('4');
  const [hostelTotalBeds, setHostelTotalBeds] = useState('300');
  const [hostelOccupiedBeds, setHostelOccupiedBeds] = useState('250');
  const [isSubmittingHostel, setIsSubmittingHostel] = useState(false);

  // Add Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehRegNumber, setVehRegNumber] = useState('');
  const [vehType, setVehType] = useState('BUS');
  const [vehCapacity, setVehCapacity] = useState('54');
  const [vehDriverName, setVehDriverName] = useState('');
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  // Add Route Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routeStops, setRouteStops] = useState('');
  const [routeTime, setRouteTime] = useState('07:30 AM');
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);

  const loadData = async () => {
    try {
      const [h, v, r] = await Promise.all([
        api.getHostels(),
        api.getVehicles(),
        api.getTransportRoutes(),
      ]);
      setHostels(h);
      setVehicles(v);
      setRoutes(r);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Create Hostel
  const handleOpenCreateHostel = () => {
    setEditingHostel(null);
    setHostelName('');
    setHostelCode('');
    setHostelGender('MALE');
    setHostelWardenName('');
    setHostelWardenPhone('');
    setHostelTotalFloors('5');
    setHostelTotalBeds('400');
    setHostelOccupiedBeds('320');
    setIsHostelModalOpen(true);
  };

  // Open Edit Hostel
  const handleOpenEditHostel = (h: Hostel) => {
    setEditingHostel(h);
    setHostelName(h.name);
    setHostelCode(h.code || '');
    setHostelGender((h.gender as any) || (h.type as any) || 'MALE');
    setHostelWardenName(h.wardenName);
    setHostelWardenPhone(h.wardenPhone || h.wardenContact || '');
    setHostelTotalFloors(String(h.totalFloors || 4));
    setHostelTotalBeds(String(h.totalBeds || h.totalCapacity || 300));
    setHostelOccupiedBeds(String(h.occupiedBeds || 0));
    setIsHostelModalOpen(true);
  };

  // Save Hostel
  const handleSaveHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName.trim() || !hostelWardenName.trim()) {
      alert('Hostel name and warden name are required.');
      return;
    }

    setIsSubmittingHostel(true);
    try {
      const totalBedsNum = parseInt(hostelTotalBeds, 10) || 100;
      const occupiedBedsNum = parseInt(hostelOccupiedBeds, 10) || 0;
      const floorsNum = parseInt(hostelTotalFloors, 10) || 1;

      const payload: Partial<Hostel> = {
        name: hostelName.trim(),
        code: hostelCode.trim().toUpperCase() || `HST-${hostelName.slice(0, 3).toUpperCase()}`,
        gender: hostelGender,
        type: hostelGender as any,
        wardenName: hostelWardenName.trim(),
        wardenPhone: hostelWardenPhone.trim() || '+1 (555) 019-2831',
        wardenContact: hostelWardenPhone.trim() || '+1 (555) 019-2831',
        totalFloors: floorsNum,
        totalBeds: totalBedsNum,
        totalCapacity: totalBedsNum,
        occupiedBeds: Math.min(occupiedBedsNum, totalBedsNum),
      };

      if (editingHostel) {
        await api.updateHostel(editingHostel.id, payload);
      } else {
        await api.addHostel(payload);
      }

      setIsHostelModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save hostel');
    } finally {
      setIsSubmittingHostel(false);
    }
  };

  // Delete Hostel
  const handleDeleteHostel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove residential hall "${name}"?`)) return;
    try {
      await api.deleteHostel(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete hostel');
    }
  };

  // Quick Bed Allocation +/-
  const handleQuickAdjustOccupancy = async (h: Hostel, delta: number) => {
    const total = h.totalBeds || h.totalCapacity || 100;
    const current = h.occupiedBeds || 0;
    const next = Math.max(0, Math.min(total, current + delta));
    try {
      await api.updateHostel(h.id, { occupiedBeds: next });
      setHostels((prev) =>
        prev.map((item) => (item.id === h.id ? { ...item, occupiedBeds: next } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Save Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehRegNumber.trim() || !vehDriverName.trim()) {
      alert('Vehicle registration number and driver name are required.');
      return;
    }
    setIsSubmittingVehicle(true);
    try {
      await api.addVehicle({
        registrationNumber: vehRegNumber.trim().toUpperCase(),
        plateNumber: vehRegNumber.trim().toUpperCase(),
        model: vehType === 'BUS' ? 'Ashok Leyland Viking Coach' : 'Ford Interceptor SUV',
        type: vehType as any,
        capacity: parseInt(vehCapacity, 10) || 40,
        status: 'ACTIVE',
        fuelLevelPercent: 90,
        driverName: vehDriverName.trim(),
        driverPhone: '+1 (555) 777-1092',
      });
      setIsVehicleModalOpen(false);
      setVehRegNumber('');
      setVehDriverName('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register transit vehicle');
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  // Save Transport Route
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim() || !routeStart.trim() || !routeEnd.trim()) {
      alert('Route name, start and end points are required.');
      return;
    }
    setIsSubmittingRoute(true);
    try {
      const stopsArray = routeStops
        ? routeStops.split(',').map((s) => s.trim()).filter(Boolean)
        : [routeStart, routeEnd];

      await api.addTransportRoute({
        name: routeName.trim(),
        routeCode: routeCode.trim().toUpperCase() || 'RT-EXP',
        startPoint: routeStart.trim(),
        endPoint: routeEnd.trim(),
        stops: stopsArray,
        departureTime: routeTime.trim(),
        totalCapacity: 54,
        registeredPassengersCount: 0,
      });
      setIsRouteModalOpen(false);
      setRouteName('');
      setRouteStart('');
      setRouteEnd('');
      setRouteStops('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to configure transport route');
    } finally {
      setIsSubmittingRoute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-cyan-400" />
            Campus Residential Hostels & Transit Fleet
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student residential block capacities, bed allocations, bus telemetry, and transit routes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Bus}
            onClick={() => setIsRouteModalOpen(true)}
          >
            Add Transit Route
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setIsVehicleModalOpen(true)}
          >
            Register Bus / Vehicle
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateHostel}
          >
            Add Residential Hostel
          </Button>
        </div>
      </div>

      {/* Hostels Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-cyan-400" />
            <span>Student Residential Halls ({hostels.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Total Beds:{' '}
            <strong className="text-slate-200">
              {hostels.reduce((acc, h) => acc + (h.totalBeds || h.totalCapacity || 0), 0)}
            </strong>{' '}
            • Occupied:{' '}
            <strong className="text-cyan-400">
              {hostels.reduce((acc, h) => acc + (h.occupiedBeds || 0), 0)}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hostels.map((h) => {
            const total = h.totalBeds || h.totalCapacity || 100;
            const occupied = h.occupiedBeds || 0;
            const occupancyPct = Math.round((occupied / total) * 100);
            const genderLabel = h.gender || h.type || 'MALE';
            const phone = h.wardenPhone || h.wardenContact || '+1 (555) 781-9921';

            return (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                        {h.code || 'HST'}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100">{h.name}</h3>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {genderLabel}
                      </Badge>
                      <span>•</span>
                      <span>{h.totalFloors || 4} Floors</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={occupancyPct > 90 ? 'warning' : 'success'} size="sm">
                      {occupancyPct}% Occupied
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleOpenEditHostel(h)}
                      title="Edit Hostel Details"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHostel(h.id, h.name)}
                      title="Delete Hostel"
                      className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Bed Allocation Roster:</span>
                    <span className="text-slate-200 font-bold">
                      {occupied} / {total} Beds
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyPct > 90 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Bed Allocation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Quick Adjust:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustOccupancy(h, 1)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                      title="Allocate +1 Bed"
                    >
                      +1 Bed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustOccupancy(h, -1)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Vacate -1 Bed"
                    >
                      -1 Bed
                    </button>
                  </div>

                  <div className="text-slate-400">
                    Available:{' '}
                    <strong className="text-emerald-400">{Math.max(0, total - occupied)}</strong>
                  </div>
                </div>

                {/* Warden Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Warden: <strong className="text-slate-300">{h.wardenName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fleet & Routes */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Bus className="w-4 h-4 text-cyan-400" />
          <span>Active Transit Fleet & Scheduled Routes</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const plate = v.registrationNumber || v.plateNumber || 'AUST-BUS';
            const matchedRoute = routes.find(
              (r) => r.assignedVehicleId === v.id || r.vehicleId === v.id
            );
            return (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{plate}</span>
                      <span className="text-xs font-semibold text-slate-200">
                        ({v.model || v.type})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Driver: {v.driverName} • Contact: {v.driverPhone || '+1 (555) 833-1021'}
                    </p>
                  </div>
                  <Badge variant={v.status === 'ACTIVE' ? 'success' : 'warning'} size="sm" dot>
                    {v.status}
                  </Badge>
                </div>

                {matchedRoute && (
                  <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-cyan-300">{matchedRoute.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Stops: {matchedRoute.stops ? matchedRoute.stops.join(' → ') : matchedRoute.startPoint + ' → ' + matchedRoute.endPoint}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Fuel: {v.fuelLevelPercent || 85}%
                  </span>
                  <span>Passenger Capacity: {v.capacity || 54}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Hostel Modal */}
      <Modal
        isOpen={isHostelModalOpen}
        onClose={() => setIsHostelModalOpen(false)}
        title={editingHostel ? 'Edit Residential Hostel' : 'Add Residential Hostel'}
        subtitle="Registers residential student hall with room and bed capacity management"
        maxWidth="md"
      >
        <form onSubmit={handleSaveHostel} className="space-y-4">
          <Input
            label="Hostel Name"
            required
            value={hostelName}
            onChange={(e) => setHostelName(e.target.value)}
            placeholder="e.g. Vikram Sarabhai Residential Block B"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hall Identifier Code"
              required
              value={hostelCode}
              onChange={(e) => setHostelCode(e.target.value)}
              placeholder="e.g. HST-VSB"
            />
            <Select
              label="Wing Allocation"
              value={hostelGender}
              onChange={(e) => setHostelGender(e.target.value as any)}
              options={[
                { value: 'MALE', label: 'Male Student Hall' },
                { value: 'FEMALE', label: 'Female Student Hall' },
                { value: 'CO_ED', label: 'Co-ed / Graduate Residence' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Chief Warden Name"
              required
              value={hostelWardenName}
              onChange={(e) => setHostelWardenName(e.target.value)}
              placeholder="e.g. Dr. Sunita Rao"
            />
            <Input
              label="Warden Contact Phone"
              value={hostelWardenPhone}
              onChange={(e) => setHostelWardenPhone(e.target.value)}
              placeholder="+1 (555) 781-9921"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Total Floors"
              type="number"
              value={hostelTotalFloors}
              onChange={(e) => setHostelTotalFloors(e.target.value)}
            />
            <Input
              label="Total Bed Capacity"
              required
              type="number"
              value={hostelTotalBeds}
              onChange={(e) => setHostelTotalBeds(e.target.value)}
            />
            <Input
              label="Occupied Beds"
              required
              type="number"
              value={hostelOccupiedBeds}
              onChange={(e) => setHostelOccupiedBeds(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHostelModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingHostel}>
              {editingHostel ? 'Save Hostel Changes' : 'Create Hostel'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Transit Vehicle Modal */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register Transit Fleet Vehicle"
        subtitle="Registers bus, shuttle, or security vehicle into the campus transit grid"
        maxWidth="md"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <Input
            label="Registration / Plate Number"
            required
            value={vehRegNumber}
            onChange={(e) => setVehRegNumber(e.target.value)}
            placeholder="e.g. AUST-BUS-03"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Vehicle Category"
              value={vehType}
              onChange={(e) => setVehType(e.target.value)}
              options={[
                { value: 'BUS', label: 'Transit Passenger Bus' },
                { value: 'VAN', label: 'Faculty & Staff Van' },
                { value: 'CAMPUS_SECURITY', label: 'Perimeter Patrol SUV' },
                { value: 'AMBULANCE', label: 'Campus Medical Ambulance' },
              ]}
            />
            <Input
              label="Seating Capacity"
              type="number"
              value={vehCapacity}
              onChange={(e) => setVehCapacity(e.target.value)}
            />
          </div>

          <Input
            label="Assigned Lead Driver Name"
            required
            value={vehDriverName}
            onChange={(e) => setVehDriverName(e.target.value)}
            placeholder="e.g. Devonte Washington"
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVehicleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingVehicle}>
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Transport Route Modal */}
      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        title="Create Transit Route"
        subtitle="Configure campus commuter bus stops, timetables, and designated stops"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRoute} className="space-y-4">
          <Input
            label="Route Name"
            required
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="e.g. Route 2 — South Metro & Downtown Commuter"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Route Code"
              value={routeCode}
              onChange={(e) => setRouteCode(e.target.value)}
              placeholder="e.g. SMC-2"
            />
            <Input
              label="Morning Departure Time"
              value={routeTime}
              onChange={(e) => setRouteTime(e.target.value)}
              placeholder="07:45 AM"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Terminal"
              required
              value={routeStart}
              onChange={(e) => setRouteStart(e.target.value)}
              placeholder="South Terminal Hub"
            />
            <Input
              label="Destination Point"
              required
              value={routeEnd}
              onChange={(e) => setRouteEnd(e.target.value)}
              placeholder="Campus Gate 3"
            />
          </div>

          <Input
            label="Transit Stops (comma separated)"
            value={routeStops}
            onChange={(e) => setRouteStops(e.target.value)}
            placeholder="e.g. South Terminal, City Library, University Avenue, Campus Gate 3"
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRouteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingRoute}>
              Publish Transit Route
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
