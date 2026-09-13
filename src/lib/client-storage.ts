/**
 * CUOIS — Client-side Standalone Storage Fallback
 * Provides full functionality when deployed to static hosts (like GitHub Pages)
 * where the Node.js Express backend server is not running.
 */

import { Institution, User, DigitalTwinNode } from '../types/index.ts';

const STORAGE_PREFIX = 'cuois_standalone_';

export const standaloneStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (err) {
      console.warn('[CUOIS Standalone] Storage write warning:', err);
    }
  },

  initDefault() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
      const defaultInstitution: Institution = {
        id: 'inst-cuois-primary',
        name: 'Apex Institute of Science & Technology',
        code: 'AIST-CAMPUS',
        tagline: 'Sovereign Campus Intelligence & Operations Platform',
        address: 'Knowledge Corridor, Innovation Tech Park',
        contactEmail: 'imthiyasofficial28@gmail.com',
        contactPhone: '+1 (800) 555-CUOIS',
        website: 'https://cuois.internal',
        establishedYear: 2018,
        timezone: 'UTC',
        academicCalendarType: 'SEMESTER',
        accreditation: 'Tier-1 Sovereign Technical Institution',
        isConfigured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const defaultOwner: User = {
        id: 'usr-imthiyas-sovereign',
        username: 'IMTHIYAS',
        fullName: 'Imthiyas',
        email: 'imthiyasofficial28@gmail.com',
        role: 'SYSTEM_OWNER',
        phone: '+91 98765 43210',
        bio: 'Lead Architect and Sovereign Creator of CUOIS. Architect of campus digital twin, spatial telemetry and unified governance.',
        avatarUrl: '',
        isActive: true,
        mfaEnabled: true,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const defaultNodes: DigitalTwinNode[] = [
        {
          id: 'twin-node-1',
          name: 'Academic Complex & Central Library',
          code: 'BLD-ALPHA',
          category: 'LIBRARY',
          x: 42,
          y: 35,
          floors: 4,
          capacity: 600,
          occupancy: 56,
          temperatureF: 71.5,
          powerKw: 148.5,
          airQualityAqi: 32,
          activeLabs: ['Cybernetics Lab', 'Quantum Computing Core'],
          maintenanceAlerts: 0,
          securityStatus: 'NORMAL',
          description: 'Primary campus academic hub housing research labs and digital knowledge repositories.',
          latitude: 37.4220656,
          longitude: -122.0840897,
          address: 'Googleplex HQ Innovation Corridor, Mountain View, CA',
          imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
          weatherCondition: 'Clear Sky',
          weatherHumidity: 48,
          weatherWindMph: 6.2,
          weatherLastUpdated: new Date().toISOString(),
        },
        {
          id: 'twin-node-2',
          name: 'Engineering & Advanced Robotics Hall',
          code: 'BLD-BETA',
          category: 'RESEARCH',
          x: 68,
          y: 55,
          floors: 3,
          capacity: 350,
          occupancy: 61,
          temperatureF: 69.8,
          powerKw: 182.0,
          airQualityAqi: 28,
          activeLabs: ['Autonomous Robotics Suite', 'Bionics Lab'],
          maintenanceAlerts: 0,
          securityStatus: 'NORMAL',
          description: 'High-throughput hardware design facilities and clean rooms for cutting-edge engineering.',
          latitude: 37.774929,
          longitude: -122.419416,
          address: 'San Francisco Tech Center, CA',
          imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
          weatherCondition: 'Partly Cloudy',
          weatherHumidity: 52,
          weatherWindMph: 9.4,
          weatherLastUpdated: new Date().toISOString(),
        },
        {
          id: 'twin-node-3',
          name: 'Main Executive Auditorium & Convocation Hall',
          code: 'BLD-GAMMA',
          category: 'ADMIN',
          x: 50,
          y: 80,
          floors: 2,
          capacity: 1200,
          occupancy: 10,
          temperatureF: 73.2,
          powerKw: 95.4,
          airQualityAqi: 22,
          activeLabs: ['Acoustics Studio'],
          maintenanceAlerts: 0,
          securityStatus: 'NORMAL',
          description: 'State-of-the-art auditorium for symposiums, convocations, and executive assemblies.',
          latitude: 40.712776,
          longitude: -74.005974,
          address: 'New York Campus Center, NY',
          imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80',
          weatherCondition: 'Sunny',
          weatherHumidity: 45,
          weatherWindMph: 4.8,
          weatherLastUpdated: new Date().toISOString(),
        },
      ];

      this.set('institution', defaultInstitution);
      this.set('users', [defaultOwner]);
      this.set('digitalTwinNodes', defaultNodes);
      this.set('isConfigured', true);
      this.set('initialized', true);
    }
  },
};
