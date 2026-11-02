import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export type DeviceCategory = 'ETM' | 'GPS_TRACKER';
export type GpsAvailabilityStatus = 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
export type DeviceOperationalStatus =
  | 'ACTIVE'
  | 'STANDBY'
  | 'INACTIVE'
  | 'UNDER_MAINTENANCE'
  | 'MAINTENANCE'
  | 'FAULTY'
  | 'UNREGISTERED'
  | 'DECOMMISSIONED';
export type NetworkGeneration = '2G' | '3G' | '4G' | '5G';
export type DeviceHealthStatus = 'HEALTHY' | 'DELAYED' | 'STALE' | 'OFFLINE' | 'FAULTY' | 'WARNING' | 'CRITICAL';
export type InstallationStatus = 'INSTALLED' | 'UNINSTALLED' | 'PENDING_INSTALLATION';

export interface IDeviceAssignmentHistory {
  busId?: Types.ObjectId;
  crewId?: Types.ObjectId;
  assignedAt: Date;
  unassignedAt?: Date;
  reason?: string;
}

export interface IDeviceRegistry {
  deviceId: string;
  deviceCategory: DeviceCategory;
  manufacturer: string;
  deviceModel: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  operatingSystem?: string;
  firmwareVersion?: string;
  gpsAvailabilityStatus: GpsAvailabilityStatus;
  gpsVerificationStatus?: string;
  supportedProtocols?: string[];
  installationStatus?: InstallationStatus;
  networkGenerations: NetworkGeneration[];
  status: DeviceOperationalStatus;
  healthStatus?: DeviceHealthStatus;
  depotId: Types.ObjectId;
  currentAssignedBusId?: Types.ObjectId;
  currentAssignedCrewId?: Types.ObjectId;
  batteryHealthPercent?: number;
  lastHeartbeatAt?: Date;
  lastCommunicationAt?: Date;
  lastAcceptedLocationAt?: Date;
  lastRejectedMessageAt?: Date;
  lastTelemetrySource?: string;
  rejectionReason?: string;
  apiKeyHash?: string;
  communicationFailureCount?: number;
  lastValidLocation?: GeoJsonPoint;
  lastSatellitesCount?: number;
  lastGpsFixStatus?: string;
  assignmentHistory: IDeviceAssignmentHistory[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type DeviceRegistryDocument = Document & IDeviceRegistry;

const deviceAssignmentHistorySchema = new Schema<IDeviceAssignmentHistory>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined
    },
    crewId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    unassignedAt: {
      type: Date,
      default: undefined
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 120
    }
  },
  { _id: false }
);

const deviceRegistrySchema = new Schema<DeviceRegistryDocument>(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    deviceCategory: {
      type: String,
      enum: {
        values: ['ETM', 'GPS_TRACKER'],
        message: 'Invalid device category: {VALUE}'
      },
      required: [true, 'Device category is required'],
      index: true
    },
    manufacturer: {
      type: String,
      required: [true, 'Device manufacturer is required'],
      trim: true,
      maxlength: 100
    },
    deviceModel: {
      type: String,
      required: [true, 'Device model is required'],
      trim: true,
      maxlength: 100
    },
    serialNumber: {
      type: String,
      trim: true,
      sparse: true,
      maxlength: 100
    },
    imei: {
      type: String,
      trim: true,
      sparse: true,
      maxlength: 20
    },
    simIccid: {
      type: String,
      trim: true,
      maxlength: 30
    },
    simPhoneNumber: {
      type: String,
      trim: true,
      maxlength: 20
    },
    operatingSystem: {
      type: String,
      trim: true,
      maxlength: 80,
      default: undefined
    },
    firmwareVersion: {
      type: String,
      trim: true,
      maxlength: 50,
      default: undefined
    },
    gpsAvailabilityStatus: {
      type: String,
      enum: {
        values: ['VERIFIED_AVAILABLE', 'VERIFIED_UNAVAILABLE', 'UNKNOWN'],
        message: 'Invalid GPS availability status: {VALUE}'
      },
      default: 'UNKNOWN',
      index: true
    },
    gpsVerificationStatus: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'PENDING_INSPECTION'
    },
    supportedProtocols: {
      type: [String],
      default: ['HTTP', 'HTTPS', 'MQTT', 'TCP']
    },
    installationStatus: {
      type: String,
      enum: ['INSTALLED', 'UNINSTALLED', 'PENDING_INSTALLATION'],
      default: 'UNINSTALLED'
    },
    networkGenerations: {
      type: [String],
      enum: ['2G', '3G', '4G', '5G'],
      default: ['4G']
    },
    status: {
      type: String,
      enum: {
        values: [
          'ACTIVE',
          'STANDBY',
          'INACTIVE',
          'UNDER_MAINTENANCE',
          'MAINTENANCE',
          'FAULTY',
          'UNREGISTERED',
          'DECOMMISSIONED'
        ],
        message: 'Invalid device status: {VALUE}'
      },
      default: 'STANDBY',
      index: true
    },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'DELAYED', 'STALE', 'OFFLINE', 'FAULTY', 'WARNING', 'CRITICAL'],
      default: 'HEALTHY'
    },
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Depot reference is required'],
      index: true
    },
    currentAssignedBusId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined,
      index: true
    },
    currentAssignedCrewId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    batteryHealthPercent: {
      type: Number,
      min: [0, 'Battery health cannot be below 0%'],
      max: [100, 'Battery health cannot exceed 100%'],
      default: 100
    },
    lastHeartbeatAt: {
      type: Date,
      default: undefined
    },
    lastCommunicationAt: {
      type: Date,
      default: undefined
    },
    lastAcceptedLocationAt: {
      type: Date,
      default: undefined
    },
    lastRejectedMessageAt: {
      type: Date,
      default: undefined
    },
    lastTelemetrySource: {
      type: String,
      trim: true,
      default: undefined
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: undefined
    },
    apiKeyHash: {
      type: String,
      default: undefined,
      select: false
    },
    communicationFailureCount: {
      type: Number,
      default: 0
    },
    lastValidLocation: {
      type: GeoJsonPointSchema,
      default: undefined
    },
    lastSatellitesCount: {
      type: Number,
      default: undefined
    },
    lastGpsFixStatus: {
      type: String,
      default: undefined
    },
    assignmentHistory: {
      type: [deviceAssignmentHistorySchema],
      default: []
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'device_registry'
  }
);

deviceRegistrySchema.index({ depotId: 1, status: 1 });
deviceRegistrySchema.index({ deviceCategory: 1, gpsAvailabilityStatus: 1 });

export const DeviceRegistry: Model<DeviceRegistryDocument> =
  model<DeviceRegistryDocument>('DeviceRegistry', deviceRegistrySchema);
