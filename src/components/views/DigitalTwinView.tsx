import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Zap,
  Users,
  Thermometer,
  Wind,
  Radio,
  RefreshCw,
  Compass,
  MapPin,
  Server,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  LocateFixed,
  CloudSun,
  CloudRain,
  Sun,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Check,
  Lock,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import { DigitalTwinNode } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Modal } from '../ui/modal.tsx';
import { Input } from '../ui/input.tsx';

// Curated architectural presets
const ARCHITECTURAL_IMAGE_PRESETS = [
  {
    title: 'School of Computing & AI',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    tag: 'Computing',
  },
  {
    title: 'Institutional Administration Tower',
    url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
    tag: 'Admin',
  },
  {
    title: 'Applied Sciences & Nanotech',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    tag: 'Research',
  },
  {
    title: 'Central Knowledge Commons',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    tag: 'Library',
  },
  {
    title: 'Athletics & Wellness Arena',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    tag: 'Sports',
  },
  {
    title: 'Student Residential Quarters',
    url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    tag: 'Hostel',
  },
  {
    title: 'Medical Sciences Pavilion',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    tag: 'Health',
  },
  {
    title: 'Campus Innovation Plaza',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    tag: 'Innovation',
  },
];

// Coordinate presets for quick demonstration
const CAMPUS_GEO_PRESETS = [
  { name: 'Silicon Valley Campus', lat: 37.4275, lng: -122.1697, address: 'Stanford Quad, Silicon Valley, CA' },
  { name: 'Cambridge Tech Corridor', lat: 42.3601, lng: -71.0942, address: 'Innovation Way, Cambridge, MA' },
  { name: 'London Knowledge Quarter', lat: 51.5246, lng: -0.1340, address: 'Gower Street, London WC1E' },
  { name: 'Singapore Cyber District', lat: 1.2966, lng: 103.7764, address: 'Kent Ridge Crescent, Singapore' },
];

export const DigitalTwinView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const isSystemOwner = activeRole === 'SYSTEM_OWNER' || user?.username?.toUpperCase() === 'IMTHIYAS';

  const [nodes, setNodes] = useState<DigitalTwinNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'OCCUPANCY' | 'THERMAL' | 'MAINTENANCE' | 'SECURITY'>('OCCUPANCY');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Edit / Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'IMAGE' | 'GEOLOCATION' | 'WEATHER'>('GENERAL');
  const [nodeFormData, setNodeFormData] = useState<Partial<DigitalTwinNode>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingWeatherPreview, setIsFetchingWeatherPreview] = useState(false);
  const [weatherPreview, setWeatherPreview] = useState<{
    temperatureF: number;
    condition: string;
    humidity: number;
    windSpeedMph: number;
    source: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load digital twin nodes
  const loadNodes = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDigitalTwinNodes();
      setNodes(data);
      if (data.length > 0 && !selectedNodeId) {
        setSelectedNodeId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load digital twin nodes:', err);
      showMessage('error', 'Failed to retrieve digital twin telemetry from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNodes();

    // Subscribe to SSE updates
    const unsubscribe = api.subscribeRealtimeEvents((event) => {
      if (event.type === 'DIGITAL_TWIN_NODE_ADDED') {
        setNodes((prev) => [...prev, event.data]);
      } else if (event.type === 'DIGITAL_TWIN_NODE_UPDATED') {
        setNodes((prev) => prev.map((n) => (n.id === event.data.id ? event.data : n)));
      } else if (event.type === 'DIGITAL_TWIN_NODE_DELETED') {
        setNodes((prev) => prev.filter((n) => n.id !== event.data.id));
      }
    });

    return () => unsubscribe();
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  // Open Edit Modal with selected node
  const handleOpenEdit = (node: DigitalTwinNode) => {
    setNodeFormData({ ...node });
    setModalTab('GENERAL');
    setWeatherPreview(null);
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setNodeFormData({
      name: '',
      code: `BLD-${Math.floor(100 + Math.random() * 900)}`,
      category: 'COMPUTING',
      x: 50,
      y: 50,
      floors: 4,
      capacity: 600,
      occupancy: 65,
      temperatureF: 71.5,
      powerKw: 95.0,
      airQualityAqi: 22,
      activeLabs: ['Innovation Lab Alpha', 'Research Suite 101'],
      maintenanceAlerts: 0,
      securityStatus: 'NORMAL',
      description: 'Campus facility equipped with spatial telemetry sensors.',
      imageUrl: ARCHITECTURAL_IMAGE_PRESETS[0].url,
      latitude: 37.4275,
      longitude: -122.1697,
      address: 'North Academic Quad, Innovation Boulevard',
      weatherCondition: 'Partly Cloudy',
      weatherHumidity: 52,
      weatherWindMph: 8.0,
    });
    setModalTab('GENERAL');
    setWeatherPreview(null);
    setIsAddModalOpen(true);
  };

  // Take Geolocation using Browser API
  const handleTakeGeolocation = () => {
    if (!navigator.geolocation) {
      showMessage('error', 'Browser geolocation is not supported or permitted on this device.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lng = Math.round(position.coords.longitude * 10000) / 10000;
        setNodeFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev.address || `GPS Sensor: ${lat}°, ${lng}°`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        }));
        setIsLocating(false);
        showMessage('success', `Geolocation captured: ${lat}° N, ${lng}° W`);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation warning:', error);
        // Fallback to high-precision campus coordinates
        setNodeFormData((prev) => ({
          ...prev,
          latitude: 37.4275,
          longitude: -122.1697,
          address: 'Campus Quad Sensor Coordinates',
        }));
        showMessage('info', 'Sensor default coordinates applied (37.4275° N, -122.1697° W).');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Fetch Live Weather for given coordinates
  const handleFetchWeatherPreview = async () => {
    const lat = nodeFormData.latitude ?? 37.4275;
    const lng = nodeFormData.longitude ?? -122.1697;
    try {
      setIsFetchingWeatherPreview(true);
      const res = await api.getLiveWeather(lat, lng);
      setWeatherPreview(res);
      setNodeFormData((prev) => ({
        ...prev,
        temperatureF: res.temperatureF,
        weatherCondition: res.condition,
        weatherHumidity: res.humidity,
        weatherWindMph: res.windSpeedMph,
        weatherLastUpdated: res.timestamp,
      }));
      showMessage('success', `Weather fetched: ${res.temperatureF}°F, ${res.condition}`);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to retrieve live meteorological data.');
    } finally {
      setIsFetchingWeatherPreview(false);
    }
  };

  // File Upload to Data URL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNodeFormData((prev) => ({ ...prev, imageUrl: result }));
      showMessage('success', 'Custom image loaded from local device.');
    };
    reader.readAsDataURL(file);
  };

  // Save Node (Create or Update)
  const handleSaveNode = async () => {
    if (!nodeFormData.name?.trim()) {
      showMessage('error', 'Building name is required.');
      return;
    }
    try {
      setIsSaving(true);
      if (isEditModalOpen && nodeFormData.id) {
        const updated = await api.updateDigitalTwinNode(nodeFormData.id, nodeFormData);
        setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setIsEditModalOpen(false);
        showMessage('success', `Building "${updated.name}" updated successfully.`);
      } else {
        const created = await api.addDigitalTwinNode(nodeFormData);
        setNodes((prev) => [...prev, created]);
        setSelectedNodeId(created.id);
        setIsAddModalOpen(false);
        showMessage('success', `New building "${created.name}" deployed to Digital Twin.`);
      }
    } catch (err) {
      console.error('Failed to save digital twin node:', err);
      showMessage('error', 'Failed to save building telemetry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Node
  const handleDeleteNode = async (node: DigitalTwinNode) => {
    if (!window.confirm(`Are you sure you want to decommission and remove "${node.name}" from the Digital Twin?`)) {
      return;
    }
    try {
      await api.deleteDigitalTwinNode(node.id);
      setNodes((prev) => prev.filter((n) => n.id !== node.id));
      if (selectedNodeId === node.id) {
        const remaining = nodes.filter((n) => n.id !== node.id);
        setSelectedNodeId(remaining[0]?.id || '');
      }
      showMessage('success', `Building "${node.name}" decommissioned.`);
    } catch (err) {
      console.error('Failed to delete node:', err);
      showMessage('error', 'Failed to remove building node.');
    }
  };

  // Sync Live Weather for currently selected node
  const handleSyncSelectedWeather = async () => {
    if (!selectedNode) return;
    try {
      setIsSyncingWeather(true);
      const updated = await api.syncDigitalTwinWeather(selectedNode.id);
      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      showMessage('success', `Live meteorological weather synced for ${updated.name}: ${updated.temperatureF}°F, ${updated.weatherCondition}`);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to sync live weather.');
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Batch Sync Weather for All Buildings
  const handleSyncAllWeather = async () => {
    if (nodes.length === 0) return;
    try {
      setIsSyncingWeather(true);
      for (const node of nodes) {
        await api.syncDigitalTwinWeather(node.id);
      }
      await loadNodes();
      showMessage('success', 'Live weather telemetry synced across all campus buildings.');
    } catch (err) {
      console.error(err);
      showMessage('error', 'Weather sync partial error.');
    } finally {
      setIsSyncingWeather(false);
    }
  };

  const getWeatherIcon = (condition?: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
    if (c.includes('sun') || c.includes('clear')) return Sun;
    return CloudSun;
  };

  const getNodeMetricDisplay = (node: DigitalTwinNode) => {
    switch (viewMode) {
      case 'OCCUPANCY':
        return `${node.occupancy}% Cap`;
      case 'THERMAL':
        return `${node.temperatureF}°F`;
      case 'MAINTENANCE':
        return node.maintenanceAlerts > 0 ? `${node.maintenanceAlerts} Work Order` : 'Operational';
      case 'SECURITY':
        return node.securityStatus;
      default:
        return `${node.occupancy}%`;
    }
  };

  const getNodeColorClass = (node: DigitalTwinNode) => {
    if (viewMode === 'OCCUPANCY') {
      if (node.occupancy > 90) return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
      return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
    }
    if (viewMode === 'THERMAL') {
      if (node.temperatureF > 73) return 'text-orange-400 border-orange-500/50 bg-orange-950/40';
      return 'text-blue-400 border-blue-500/50 bg-blue-950/40';
    }
    if (viewMode === 'MAINTENANCE') {
      if (node.maintenanceAlerts > 0) return 'text-rose-400 border-rose-500/50 bg-rose-950/40 animate-pulse';
      return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    }
    return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-[#0A101C] border border-amber-500/40 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-100">
            Compulsory Authentication Required
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Without a verified Member ID and Password, access to the Campus Digital Twin spatial telemetry model is strictly forbidden.
          </p>
          <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-[11px] text-slate-300 font-mono">
            Every member must possess an active ID provisioned by System Owner Imthiyas.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Telemetry Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1524] border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              Campus Digital Twin & Spatial Telemetry
            </h1>
            <Badge variant="cyan" className="font-mono text-[10px]">
              LIVE 3D/2D TWIN
            </Badge>
            {isSystemOwner && (
              <Badge variant="accent" size="sm" className="font-mono">
                ★ MASTER SPATIAL GOVERNANCE
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete physical asset twin with live image editing, Google geolocation capture, and real-time weather synchronization.
            {isSystemOwner && (
              <span className="text-cyan-400 font-semibold ml-1">
                • Architected & Owned by Imthiyas
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Pill Switcher */}
          <div className="p-1 rounded-xl bg-[#080E1A] border border-slate-800 flex items-center gap-1">
            {(['OCCUPANCY', 'THERMAL', 'MAINTENANCE', 'SECURITY'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Sync All Weather Button */}
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isSyncingWeather}
            onClick={handleSyncAllWeather}
            title="Fetch live weather via Google / Open-Meteo for all campus buildings"
          >
            Sync Weather
          </Button>

          {/* Add Campus Node Button */}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Add Building
          </Button>
        </div>
      </div>

      {/* Main Grid: Spatial Canvas & Building Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Spatial Canvas */}
        <div className="lg:col-span-8 rounded-2xl bg-[#070B14] border border-slate-700/80 p-5 relative overflow-hidden shadow-2xl min-h-[580px] flex flex-col justify-between">
          {/* Futuristic Grid Canvas Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Radar Scan Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0,transparent_70%)] pointer-events-none animate-pulse" />

          {/* Canvas Top Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Compass className="w-4 h-4" />
                {selectedNode?.latitude && selectedNode?.longitude
                  ? `${selectedNode.latitude}° N, ${Math.abs(selectedNode.longitude)}° W`
                  : '37.7749° N, 122.4194° W'}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                {selectedNode?.address || 'Campus Central Quad'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {selectedNode?.weatherCondition && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  <CloudSun className="w-3 h-3 text-cyan-400" />
                  {selectedNode.temperatureF}°F • {selectedNode.weatherCondition}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Synchronized ({nodes.length} Nodes)</span>
              </div>
            </div>
          </div>

          {/* Interactive Isometric Campus Map Visualization */}
          <div className="relative w-full h-[420px] my-auto">
            {/* Campus Boundary Vector Guide */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="15,70 30,35 60,20 80,50 85,80 50,65" fill="none" stroke="#06b6d4" strokeWidth="0.4" strokeDasharray="1,1" />
              <line x1="32" y1="35" x2="48" y2="62" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1,2" />
              <line x1="62" y1="22" x2="75" y2="52" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1,2" />
              <line x1="48" y1="62" x2="75" y2="52" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1,2" />
            </svg>

            {/* Interactive Building Nodes */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20"
                >
                  {/* Hologram Pin Card */}
                  <div
                    className={`px-3 py-2 rounded-xl border backdrop-blur-md shadow-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 scale-110 shadow-[0_0_25px_rgba(6,182,212,0.4)] z-30 ' + getNodeColorClass(node)
                        : 'hover:scale-105 ' + getNodeColorClass(node)
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-bold font-mono tracking-tight text-slate-100 whitespace-nowrap">
                        {node.code}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono mt-0.5 whitespace-nowrap opacity-90">
                      {getNodeMetricDisplay(node)}
                    </div>
                  </div>

                  {/* Pulsing Beacon Circle */}
                  <div className="w-3 h-3 rounded-full bg-cyan-400/80 mx-auto -mt-1 shadow-md shadow-cyan-400" />
                  {isSelected && (
                    <div className="w-8 h-8 rounded-full border border-cyan-400/60 -mt-5.5 -ml-2.5 animate-ping pointer-events-none" />
                  )}
                </div>
              );
            })}

            {nodes.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Building2 className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Campus Nodes Deployed</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Click "Add Building" above to create custom facilities with your images, coordinates, and weather.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  className="mt-4"
                  onClick={handleOpenAdd}
                >
                  Deploy First Campus Building
                </Button>
              </div>
            )}
          </div>

          {/* Canvas Bottom Controls & Google Maps Link */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Academic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Admin
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> High Occupancy
              </span>
            </div>

            {selectedNode && (
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedNode.latitude ?? 37.4275},${selectedNode.longitude ?? -122.1697}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs transition-colors"
                  title="View building coordinates in Google Maps Satellite/Map View"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Selected Building Telemetry Inspector & Edit Access */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 flex flex-col justify-between space-y-5 shadow-2xl">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Building Image Preview with Quick Edit Overlay */}
              <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800 group">
                <img
                  src={selectedNode.imageUrl || ARCHITECTURAL_IMAGE_PRESETS[0].url}
                  alt={selectedNode.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1524] via-black/20 to-transparent" />

                {/* Quick Edit Overlay Button */}
                <button
                  onClick={() => handleOpenEdit(selectedNode)}
                  className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors text-[11px] font-mono flex items-center gap-1 shadow-lg"
                  title="Edit Building Image, Geolocation & Telemetry"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Node</span>
                </button>

                <div className="absolute top-2.5 right-2.5">
                  <Badge variant="cyan" className="font-mono text-[10px]">
                    {selectedNode.code}
                  </Badge>
                </div>

                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="text-sm font-bold text-slate-100 leading-tight">
                    {selectedNode.name}
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {selectedNode.floors} Floors • Capacity: {selectedNode.capacity}
                  </span>
                </div>
              </div>

              {/* Geolocation & Live Google Weather Telemetry Bar */}
              <div className="p-3 rounded-xl bg-[#080E1A] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedNode.address || 'Campus Quad Coordinates'}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedNode.latitude ?? 37.4275},${selectedNode.longitude ?? -122.1697}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    Google Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Live Weather Widget */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {React.createElement(getWeatherIcon(selectedNode.weatherCondition), {
                      className: 'w-4 h-4 text-amber-400',
                    })}
                    <div>
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        {selectedNode.temperatureF ?? 72}°F
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">
                        {selectedNode.weatherCondition || 'Partly Cloudy'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSyncSelectedWeather}
                    disabled={isSyncingWeather}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 flex items-center gap-1 transition-colors"
                    title="Get latest weather from Google / Open-Meteo"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingWeather ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Humidity: {selectedNode.weatherHumidity ?? 50}% • Wind: {selectedNode.weatherWindMph ?? 7} mph</span>
                  <span>Lat: {selectedNode.latitude ?? 37.42}°</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Environmental & Sensor Telemetry Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-[#080E1A] border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
                    <Users className="w-3 h-3 text-cyan-400" /> OCCUPANCY
                  </div>
                  <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                    {selectedNode.occupancy}%
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {Math.round((selectedNode.capacity * selectedNode.occupancy) / 100)} active
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#080E1A] border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
                    <Thermometer className="w-3 h-3 text-orange-400" /> CLIMATE
                  </div>
                  <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                    {selectedNode.temperatureF}°F
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">HVAC Optimal</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#080E1A] border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
                    <Zap className="w-3 h-3 text-amber-400" /> POWER
                  </div>
                  <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                    {selectedNode.powerKw} kW
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">Grid Substation</div>
                </div>
              </div>

              {/* Key Active Labs & Facilities */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  Active Labs & Key Rooms
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedNode.activeLabs && selectedNode.activeLabs.length > 0 ? (
                    selectedNode.activeLabs.map((lab) => (
                      <div
                        key={lab}
                        className="p-2 rounded-lg bg-[#080E1A] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{lab}</span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> IN SESSION
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2">No active labs listed.</div>
                  )}
                </div>
              </div>

              {/* Work Orders & Security */}
              <div className="p-3 rounded-xl bg-[#080E1A] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Work Orders:</span>
                  {selectedNode.maintenanceAlerts > 0 ? (
                    <Badge variant="amber" className="text-[10px]">
                      {selectedNode.maintenanceAlerts} Work Order
                    </Badge>
                  ) : (
                    <Badge variant="emerald" className="text-[10px]">
                      All Systems Operational
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-slate-400">Security Clearance:</span>
                  <span className="text-cyan-400 text-xs font-semibold">{selectedNode.securityStatus}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              Select a building from the map to view and edit telemetry.
            </div>
          )}

          {/* Action Buttons for Selected Node */}
          {selectedNode && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => handleOpenEdit(selectedNode)}
                >
                  Edit Building
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-950/40"
                  icon={Trash2}
                  onClick={() => handleDeleteNode(selectedNode)}
                >
                  Delete Node
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                icon={Server}
                onClick={() => alert(`Diagnostics for ${selectedNode.name} exported.`)}
              >
                Export Diagnostics Log
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT / ADD BUILDING MODAL */}
      <Modal
        isOpen={isEditModalOpen || isAddModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsAddModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Building: ${nodeFormData.name || 'Campus Node'}` : 'Add New Campus Building'}
        subtitle="Manage architectural image, Google geolocation coordinates, and live meteorological weather sync."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-mono text-slate-400">
              {nodeFormData.latitude && nodeFormData.longitude
                ? `Coordinates: ${nodeFormData.latitude}°, ${nodeFormData.longitude}°`
                : 'Coordinates pending'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsAddModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                isLoading={isSaving}
                onClick={handleSaveNode}
              >
                {isEditModalOpen ? 'Save Changes' : 'Deploy to Twin'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080D18] border border-slate-800">
            <button
              type="button"
              onClick={() => setModalTab('GENERAL')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                modalTab === 'GENERAL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Identity & Specs
            </button>
            <button
              type="button"
              onClick={() => setModalTab('IMAGE')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                modalTab === 'IMAGE'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Building Image
            </button>
            <button
              type="button"
              onClick={() => setModalTab('GEOLOCATION')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                modalTab === 'GEOLOCATION'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Google Geolocation
            </button>
            <button
              type="button"
              onClick={() => setModalTab('WEATHER')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                modalTab === 'WEATHER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. Live Weather
            </button>
          </div>

          {/* TAB 1: GENERAL SPECS */}
          {modalTab === 'GENERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Building Name"
                    required
                    value={nodeFormData.name || ''}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Turing Computational Research Pavilion"
                  />
                </div>
                <div>
                  <Input
                    label="Building Code"
                    required
                    value={nodeFormData.code || ''}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BLD-COMP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Category
                  </label>
                  <select
                    value={nodeFormData.category || 'COMPUTING'}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-[#090E17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="COMPUTING">Computing & AI</option>
                    <option value="ADMIN">Administration</option>
                    <option value="RESEARCH">Scientific Research</option>
                    <option value="LIBRARY">Knowledge & Library</option>
                    <option value="SPORTS">Athletics & Sports</option>
                    <option value="HOSTEL">Residential Quarters</option>
                    <option value="PERIMETER">Campus Perimeter / Gate</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Total Floors"
                    type="number"
                    min="1"
                    max="50"
                    value={nodeFormData.floors ?? 4}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div>
                  <Input
                    label="Max Capacity"
                    type="number"
                    min="10"
                    max="10000"
                    value={nodeFormData.capacity ?? 500}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Occupancy %"
                    type="number"
                    min="0"
                    max="100"
                    value={nodeFormData.occupancy ?? 60}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, occupancy: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Input
                    label="Power Consumption (kW)"
                    type="number"
                    step="0.1"
                    value={nodeFormData.powerKw ?? 85.0}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, powerKw: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Input
                    label="Air Quality (AQI)"
                    type="number"
                    value={nodeFormData.airQualityAqi ?? 20}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, airQualityAqi: parseInt(e.target.value) || 20 }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={nodeFormData.description || ''}
                  onChange={(e) => setNodeFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Facility purpose, departments housed, and environmental sensor profile..."
                  className="w-full bg-[#090E17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Isometric Canvas X (0-100%)"
                    type="number"
                    min="0"
                    max="100"
                    value={nodeFormData.x ?? 50}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, x: parseInt(e.target.value) || 50 }))}
                  />
                </div>
                <div>
                  <Input
                    label="Isometric Canvas Y (0-100%)"
                    type="number"
                    min="0"
                    max="100"
                    value={nodeFormData.y ?? 50}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, y: parseInt(e.target.value) || 50 }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUILDING IMAGE */}
          {modalTab === 'IMAGE' && (
            <div className="space-y-4">
              <div>
                <Input
                  label="Image Web URL"
                  value={nodeFormData.imageUrl || ''}
                  onChange={(e) => setNodeFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/building.jpg"
                  icon={ImageIcon}
                />
              </div>

              {/* Local File Upload Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Upload Custom Image from Device
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 bg-[#090E17] hover:bg-[#0C1422] transition-colors flex items-center justify-center gap-2 text-xs font-mono text-slate-300"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Image File from Computer (JPG, PNG, WebP)</span>
                </button>
              </div>

              {/* Image Preview */}
              {nodeFormData.imageUrl && (
                <div className="p-3 rounded-xl bg-[#080E1A] border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Live Preview:</span>
                  <div className="relative h-44 rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={nodeFormData.imageUrl}
                      alt="Building preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Architectural Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Or Pick from Curated Architectural Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ARCHITECTURAL_IMAGE_PRESETS.map((preset) => (
                    <div
                      key={preset.title}
                      onClick={() => setNodeFormData((prev) => ({ ...prev, imageUrl: preset.url }))}
                      className={`cursor-pointer rounded-lg overflow-hidden border p-1 transition-all ${
                        nodeFormData.imageUrl === preset.url
                          ? 'border-cyan-400 ring-2 ring-cyan-500/50 bg-[#0C1526]'
                          : 'border-slate-800 hover:border-slate-600 bg-[#080D1A]'
                      }`}
                    >
                      <img src={preset.url} alt={preset.title} className="w-full h-16 object-cover rounded" />
                      <div className="p-1 text-[10px] font-mono text-slate-300 truncate">{preset.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE GEOLOCATION */}
          {modalTab === 'GEOLOCATION' && (
            <div className="space-y-4">
              {/* Geolocation Capture Button */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#09152A] to-[#0A1A36] border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                    <LocateFixed className="w-4 h-4 text-cyan-400" />
                    <span>Browser / Google Device Geolocation</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatically detect and capture your device's exact GPS coordinates.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={LocateFixed}
                  isLoading={isLocating}
                  onClick={handleTakeGeolocation}
                >
                  Take Current Location
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Latitude (° N/S)"
                    type="number"
                    step="0.0001"
                    value={nodeFormData.latitude ?? 37.4275}
                    onChange={(e) =>
                      setNodeFormData((prev) => ({
                        ...prev,
                        latitude: parseFloat(e.target.value) || 0,
                        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${e.target.value},${prev.longitude || 0}`,
                      }))
                    }
                    placeholder="e.g. 37.4275"
                    icon={Compass}
                  />
                </div>
                <div>
                  <Input
                    label="Longitude (° E/W)"
                    type="number"
                    step="0.0001"
                    value={nodeFormData.longitude ?? -122.1697}
                    onChange={(e) =>
                      setNodeFormData((prev) => ({
                        ...prev,
                        longitude: parseFloat(e.target.value) || 0,
                        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${prev.latitude || 0},${e.target.value}`,
                      }))
                    }
                    placeholder="e.g. -122.1697"
                    icon={Compass}
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Campus Address / Physical Location"
                  value={nodeFormData.address || ''}
                  onChange={(e) => setNodeFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 100 University Boulevard, Tech District"
                  icon={MapPin}
                />
              </div>

              {/* Google Maps External Verification Button */}
              {nodeFormData.latitude !== undefined && nodeFormData.longitude !== undefined && (
                <div className="p-3 rounded-xl bg-[#080E1A] border border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-300">
                    Verify Pin on Google Maps Satellite:
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${nodeFormData.latitude},${nodeFormData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Quick Campus Location Presets:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CAMPUS_GEO_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setNodeFormData((prev) => ({
                          ...prev,
                          latitude: p.lat,
                          longitude: p.lng,
                          address: p.address,
                        }))
                      }
                      className="p-2 rounded-lg bg-[#090E17] hover:bg-[#0C1526] border border-slate-800 text-left text-xs font-mono transition-colors"
                    >
                      <div className="font-bold text-slate-200 truncate">{p.name}</div>
                      <div className="text-[10px] text-cyan-400">{p.lat}°, {p.lng}°</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE WEATHER */}
          {modalTab === 'WEATHER' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#09152A] to-[#0A1A36] border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Meteorological Query</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fetch live climate data using Google / Open-Meteo for Lat: {nodeFormData.latitude ?? 37.42}°, Lng: {nodeFormData.longitude ?? -122.16}°
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={RefreshCw}
                  isLoading={isFetchingWeatherPreview}
                  onClick={handleFetchWeatherPreview}
                >
                  Fetch Weather
                </Button>
              </div>

              {/* Live Weather Card Display */}
              <div className="p-4 rounded-xl bg-[#080E1A] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-lg font-bold font-mono text-slate-100">
                        {nodeFormData.temperatureF ?? 72.0}°F
                      </div>
                      <div className="text-xs font-mono text-cyan-400">
                        {nodeFormData.weatherCondition || 'Partly Cloudy'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="cyan" className="font-mono text-[10px]">
                    LIVE TELEMETRY
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Humidity: {nodeFormData.weatherHumidity ?? 52}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <span>Wind: {nodeFormData.weatherWindMph ?? 8.0} mph</span>
                  </div>
                </div>
              </div>

              {/* Manual Weather Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Temperature (°F)"
                    type="number"
                    step="0.1"
                    value={nodeFormData.temperatureF ?? 72.0}
                    onChange={(e) =>
                      setNodeFormData((prev) => ({
                        ...prev,
                        temperatureF: parseFloat(e.target.value) || 70,
                      }))
                    }
                    icon={Thermometer}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Weather Condition
                  </label>
                  <select
                    value={nodeFormData.weatherCondition || 'Partly Cloudy'}
                    onChange={(e) => setNodeFormData((prev) => ({ ...prev, weatherCondition: e.target.value }))}
                    className="w-full bg-[#090E17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Clear Sky">Clear Sky</option>
                    <option value="Partly Cloudy">Partly Cloudy</option>
                    <option value="Overcast">Overcast</option>
                    <option value="Rain">Rain</option>
                    <option value="Thunderstorm">Thunderstorm</option>
                    <option value="Fog">Fog</option>
                    <option value="Snow">Snow</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Relative Humidity (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={nodeFormData.weatherHumidity ?? 50}
                    onChange={(e) =>
                      setNodeFormData((prev) => ({
                        ...prev,
                        weatherHumidity: parseInt(e.target.value) || 50,
                      }))
                    }
                  />
                </div>
                <div>
                  <Input
                    label="Wind Speed (mph)"
                    type="number"
                    step="0.1"
                    value={nodeFormData.weatherWindMph ?? 8.0}
                    onChange={(e) =>
                      setNodeFormData((prev) => ({
                        ...prev,
                        weatherWindMph: parseFloat(e.target.value) || 8.0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
