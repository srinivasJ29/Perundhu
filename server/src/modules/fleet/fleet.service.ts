import { FilterQuery, Types } from 'mongoose';
import {
  Bus,
  BusDocument,
  LatestBusPosition,
  LatestBusPositionDocument
} from '../../models';
import { NotFoundError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { ListFleetPositionsQuery } from './fleet.validation';
import { routeService, RouteDirectionDetailDto } from '../routes/route.service';
import { deviceHealthService } from '../devices/deviceHealth.service';
import { etaService } from '../eta/eta.service';

export interface FleetBusPositionDto {
  busId: string;
  registrationNumber: string;
  fleetNumber: string;
  vehicleType: string;
  operationalStatus: string;
  depot: {
    id: string;
    name: string;
    code: string;
  } | null;
  route: {
    id: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
  } | null;
  direction: {
    id: string;
    directionCode: string;
  } | null;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  snappedLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  heading: number;
  speedKmph: number;
  progressRatio?: number;
  distanceAlongRouteMeters?: number;
  totalRouteDistanceMeters?: number;
  trackingStatus: string;
  source: string;
  isSimulated: boolean;
  freshness: 'HEALTHY' | 'DELAYED' | 'STALE' | 'OFFLINE' | 'UNKNOWN';
  satellitesCount?: number;
  altitudeMeters?: number;
  gpsFixStatus?: string;
  batteryPercent?: number;
  networkSignalDbm?: number;
  recordedAt: string;
  receivedAt: string;
}

export interface BusLiveDetailDto {
  bus: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
    manufacturer?: string;
    vehicleModel?: string;
    fuelType?: string;
    seatingCapacity?: number;
    status: string;
    isReserveFleet: boolean;
  };
  depot: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedTrip: {
    id: string;
    tripCode: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  } | null;
  route: {
    id: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
  } | null;
  direction: {
    id: string;
    directionCode: string;
    totalDistanceKm?: number;
    estimatedDurationMins?: number;
  } | null;
  routeDetails?: RouteDirectionDetailDto | null;
  latestPosition: {
    coordinates: [number, number]; // [longitude, latitude]
    snappedCoordinates?: [number, number];
    heading: number;
    speedKmph: number;
    progressRatio?: number;
    distanceAlongRouteMeters?: number;
    totalRouteDistanceMeters?: number;
    trackingStatus: string;
    source: string;
    isSimulated: boolean;
    freshness: 'HEALTHY' | 'DELAYED' | 'STALE' | 'OFFLINE' | 'UNKNOWN';
    satellitesCount?: number;
    altitudeMeters?: number;
    gpsFixStatus?: string;
    batteryPercent?: number;
    networkSignalDbm?: number;
    recordedAt: string;
    receivedAt: string;
  } | null;
  deviceHealth?: {
    deviceId?: string;
    overallStatus: string;
    networkConnectivity: 'ONLINE' | 'DELAYED' | 'STALE' | 'OFFLINE';
    gpsSignalStatus: 'ACQUIRED_3D' | 'ACQUIRED_2D' | 'NO_FIX' | 'UNKNOWN';
    diagnosticSummary?: string;
    satellitesTracked?: number;
    batteryPercent?: number;
    latencySeconds?: number;
  } | null;
  eta?: {
    isRealTimePrediction: boolean;
    predictionSource: string;
    confidence?: number;
    modelVersion?: string;
    fallbackReason?: string;
    generatedAt: string;
    nextStop?: {
      stopId: string;
      stopCode: string;
      stopNameEn: string;
      stopNameTa: string;
      stopSequence: number;
      etaMinutes: number;
      estimatedArrivalAt?: string | null;
      remainingDistanceMeters: number;
      confidenceIntervalSeconds?: [number, number];
      predictionSource?: string;
      fallbackReason?: string;
    };
    downstreamStops: Array<{
      stopId: string;
      stopCode: string;
      stopNameEn: string;
      stopNameTa: string;
      stopSequence: number;
      etaMinutes: number;
      estimatedArrivalAt?: string | null;
      remainingDistanceMeters: number;
      confidenceIntervalSeconds?: [number, number];
      predictionSource?: string;
      fallbackReason?: string;
    }>;
  } | null;
  intelligence?: BusLiveIntelligenceDto;
}

export interface BusLiveIntelligenceDto {
  movementStatus: 'MOVING' | 'STATIONARY' | 'DWELLING' | 'UNAVAILABLE';
  currentSpeedKmph: number | null;
  compassHeading: { degrees: number; direction: string } | null;
  routeProgress: {
    progressPercent: number;
    distanceTraveledKm: number;
    totalDistanceKm: number;
    currentSegmentIndex: number;
    totalSegments: number;
  } | null;
  lastConfirmedStop: {
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
  } | null;
  nextExpectedStop: {
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    distanceMeters: number;
    etaMinutes: number | null;
    estimatedArrivalAt?: string | null;
    confidenceIntervalSeconds?: [number, number];
  } | null;
  stopsItinerary: Array<{
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    location: [number, number];
    status: 'CONFIRMED_PASSED' | 'CURRENT_STOP' | 'UPCOMING';
    distanceFromOriginKm: number;
    etaMinutes?: number;
    estimatedArrivalAt?: string | null;
    confidenceIntervalSeconds?: [number, number];
    predictionSource?: string;
    isFareStage?: boolean;
  }>;
}

export class FleetService {
  /**
   * Evaluates freshness status from recordedAt timestamp and tracking status.
   */
  public evaluateFreshness(
    recordedAt: Date | string,
    trackingStatus?: string
  ): 'HEALTHY' | 'DELAYED' | 'STALE' | 'OFFLINE' | 'UNKNOWN' {
    if (trackingStatus === 'OFFLINE' || trackingStatus === 'UNAVAILABLE') {
      return 'OFFLINE';
    }

    const recDate = recordedAt instanceof Date ? recordedAt : new Date(recordedAt);
    if (isNaN(recDate.getTime())) {
      return 'UNKNOWN';
    }

    const ageMs = Date.now() - recDate.getTime();
    if (ageMs <= 60000) {
      return 'HEALTHY';
    }
    if (ageMs <= 300000) {
      return 'DELAYED';
    }
    return 'STALE';
  }

  /**
   * Retrieves paginated list of buses with valid latest accepted positions.
   * Supports filtering by status, source, route, depot, bounding box, and text search.
   */
  public async getFleetPositions(
    query: ListFleetPositionsQuery
  ): Promise<PaginatedResult<FleetBusPositionDto>> {
    const { page, limit, status, source, routeId, depotId, isSimulated, bbox, search } = query;
    const filter: FilterQuery<LatestBusPositionDocument> = {};

    // Filter by trackingStatus
    if (status) {
      filter.trackingStatus = status;
    }

    // Filter by source
    if (source) {
      filter.source = source;
    }

    // Filter by isSimulated
    if (isSimulated !== undefined) {
      if (isSimulated) {
        filter.source = 'SIMULATOR';
      } else {
        filter.source = { $ne: 'SIMULATOR' };
      }
    }

    // Filter by routeId
    if (routeId) {
      filter.routeId = new Types.ObjectId(routeId);
    }

    // Bounding Box Viewport Filter: minLng,minLat,maxLng,maxLat
    if (bbox) {
      const parts = bbox.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        filter.location = {
          $geoWithin: {
            $box: [
              [minLng, minLat],
              [maxLng, maxLat]
            ]
          }
        };
      }
    }

    // If search or depotId is specified, we must find matching buses first
    let matchingBusIds: Types.ObjectId[] | null = null;
    if (search || depotId) {
      const busFilter: FilterQuery<BusDocument> = {};
      if (depotId) {
        busFilter.depotId = new Types.ObjectId(depotId);
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        busFilter.$or = [
          { registrationNumber: { $regex: escaped, $options: 'i' } },
          { fleetNumber: { $regex: escaped, $options: 'i' } }
        ];
      }
      const matchedBuses = await Bus.find(busFilter).select('_id').lean();
      matchingBusIds = matchedBuses.map((b) => b._id as Types.ObjectId);
      filter.busId = { $in: matchingBusIds };
    }

    // Total count for pagination
    const total = await LatestBusPosition.countDocuments(filter);
    const skip = (page - 1) * limit;

    // Fetch positions populated with Bus, Route, Direction
    const docs = await LatestBusPosition.find(filter)
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ busId: BusDocument }>({
        path: 'busId',
        select: 'registrationNumber fleetNumber vehicleType status depotId depotName',
        populate: {
          path: 'depotId',
          select: '_id name code'
        }
      })
      .populate({
        path: 'routeId',
        select: '_id routeNumber displayTitleEn displayTitleTa'
      })
      .populate({
        path: 'directionId',
        select: '_id directionCode'
      })
      .lean();

    const data: FleetBusPositionDto[] = docs
      .filter((doc) => doc.busId != null) // Ensure bus exists
      .map((doc: any) => {
        const bus = doc.busId;
        const route = doc.routeId;
        const direction = doc.directionId;
        const isSim = doc.source === 'SIMULATOR';

        const freshness = this.evaluateFreshness(doc.recordedAt, doc.trackingStatus);

        return {
          busId: bus._id.toString(),
          registrationNumber: bus.registrationNumber,
          fleetNumber: bus.fleetNumber,
          vehicleType: bus.vehicleType || 'ORDINARY_NON_AC',
          operationalStatus: bus.status || 'IN_SERVICE',
          depot: bus.depotId
            ? {
              id: bus.depotId._id.toString(),
              name: bus.depotId.name,
              code: bus.depotId.code
            }
            : null,
          route: route
            ? {
              id: route._id.toString(),
              routeNumber: route.routeNumber,
              displayTitleEn: route.displayTitleEn,
              displayTitleTa: route.displayTitleTa
            }
            : null,
          direction: direction
            ? {
              id: direction._id.toString(),
              directionCode: direction.directionCode
            }
            : null,
          location: {
            type: 'Point',
            coordinates: doc.location?.coordinates || [0, 0]
          },
          snappedLocation: doc.snappedLocation?.coordinates
            ? {
              type: 'Point',
              coordinates: doc.snappedLocation.coordinates
            }
            : undefined,
          heading: doc.heading || 0,
          speedKmph: doc.speedKmph || 0,
          progressRatio: doc.progressRatio,
          distanceAlongRouteMeters: doc.distanceAlongRouteMeters,
          totalRouteDistanceMeters: doc.totalRouteDistanceMeters,
          trackingStatus: doc.trackingStatus || (isSim ? 'SIMULATED' : 'LIVE'),
          source: doc.source || 'SIMULATOR',
          isSimulated: isSim,
          freshness,
          satellitesCount: doc.satellitesCount,
          altitudeMeters: doc.altitudeMeters,
          gpsFixStatus: doc.gpsFixStatus,
          batteryPercent: doc.batteryPercent,
          networkSignalDbm: doc.networkSignalDbm,
          recordedAt:
            doc.recordedAt instanceof Date
              ? doc.recordedAt.toISOString()
              : new Date(doc.recordedAt).toISOString(),
          receivedAt:
            doc.receivedAt instanceof Date
              ? doc.receivedAt.toISOString()
              : new Date(doc.receivedAt).toISOString()
        };
      });

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Retrieves live details for a selected bus including latest position,
   * device communication health, assigned route itinerary/geometry, and current trip.
   */
  public async getBusLiveDetails(busId: string): Promise<BusLiveDetailDto> {
    const busObjectId = new Types.ObjectId(busId);

    // 1. Fetch Bus
    const bus = await Bus.findById(busObjectId)
      .populate('depotId', '_id name code')
      .populate('currentAssignedTripId', '_id tripCode departureTime arrivalTime status')
      .populate('assignedGpsTrackerId', '_id deviceId deviceCategory operationalStatus healthStatus lastCommunicationAt currentFirmwareVersion consecutiveFailures lastGpsFixStatus lastSatellitesCount batteryLevelPercent')
      .populate('assignedEtmDeviceId', '_id deviceId deviceCategory operationalStatus healthStatus lastCommunicationAt currentFirmwareVersion consecutiveFailures lastGpsFixStatus lastSatellitesCount batteryLevelPercent')
      .lean();

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' was not found`);
    }

    // 2. Fetch LatestBusPosition
    const latestPos = await LatestBusPosition.findOne({ busId: busObjectId })
      .populate('routeId', '_id routeNumber displayTitleEn displayTitleTa')
      .populate('directionId', '_id directionCode totalDistanceKm estimatedDurationMins')
      .lean();

    // 3. Fetch route details if route and direction are assigned
    let routeDetails: RouteDirectionDetailDto | null = null;
    const routeObj = latestPos?.routeId as any;
    const directionObj = latestPos?.directionId as any;

    if (routeObj?._id && directionObj?._id) {
      try {
        routeDetails = await routeService.getRouteDirectionDetails(
          routeObj._id.toString(),
          directionObj._id.toString()
        );
      } catch {
        // Missing route geometry handled gracefully
        routeDetails = null;
      }
    }

    // 4. Device Health Evaluation
    const primaryDevice = (bus.assignedGpsTrackerId || bus.assignedEtmDeviceId) as any;
    let deviceHealth: BusLiveDetailDto['deviceHealth'] = null;

    if (primaryDevice) {
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        primaryDevice.lastCommunicationAt,
        primaryDevice.consecutiveFailures,
        primaryDevice.lastGpsFixStatus,
        primaryDevice.lastSatellitesCount
      );
      const latencySeconds = primaryDevice.lastCommunicationAt
        ? Math.max(0, Math.round((Date.now() - new Date(primaryDevice.lastCommunicationAt).getTime()) / 1000))
        : 0;
      deviceHealth = {
        deviceId: primaryDevice.deviceId,
        overallStatus: evaluation.healthStatus,
        networkConnectivity: evaluation.networkConnectivity,
        gpsSignalStatus: evaluation.gpsSignalStatus,
        diagnosticSummary: evaluation.diagnosticSummary,
        satellitesTracked: primaryDevice.lastSatellitesCount,
        batteryPercent: primaryDevice.batteryLevelPercent,
        latencySeconds
      };
    } else if (latestPos) {
      const freshness = this.evaluateFreshness(latestPos.recordedAt, latestPos.trackingStatus);
      const sats = latestPos.satellitesCount || 0;
      let gpsSignal: 'ACQUIRED_3D' | 'ACQUIRED_2D' | 'NO_FIX' | 'UNKNOWN' = 'UNKNOWN';
      if (latestPos.gpsFixStatus === 'FIX_3D' || sats >= 4) {
        gpsSignal = 'ACQUIRED_3D';
      } else if (latestPos.gpsFixStatus === 'FIX_2D' || sats >= 3) {
        gpsSignal = 'ACQUIRED_2D';
      } else if (latestPos.gpsFixStatus === 'NO_FIX' || sats === 0) {
        gpsSignal = 'NO_FIX';
      }

      deviceHealth = {
        deviceId: latestPos.sourceDeviceId || undefined,
        overallStatus: freshness === 'HEALTHY' ? 'HEALTHY' : freshness === 'DELAYED' ? 'DELAYED' : freshness === 'OFFLINE' ? 'OFFLINE' : 'STALE',
        networkConnectivity: freshness === 'HEALTHY' ? 'ONLINE' : freshness === 'DELAYED' ? 'DELAYED' : freshness === 'STALE' ? 'STALE' : 'OFFLINE',
        gpsSignalStatus: gpsSignal,
        diagnosticSummary: `Telemetry source: ${latestPos.source}`,
        satellitesTracked: sats,
        batteryPercent: latestPos.batteryPercent,
        latencySeconds: Math.max(0, Math.round((Date.now() - new Date(latestPos.recordedAt).getTime()) / 1000))
      };
    }

    const isSim = latestPos?.source === 'SIMULATOR';
    const freshness = latestPos
      ? this.evaluateFreshness(latestPos.recordedAt, latestPos.trackingStatus)
      : 'UNKNOWN';

    const depotObj = bus.depotId as any;
    const tripObj = bus.currentAssignedTripId as any;

    // 5. Dynamic Arrival Time Estimation (ETA)
    let etaData: BusLiveDetailDto['eta'] = null;
    try {
      const calculatedEta = await etaService.calculateBusEta(busObjectId);
      if (calculatedEta) {
        etaData = {
          isRealTimePrediction: calculatedEta.isRealTimePrediction,
          predictionSource: calculatedEta.predictionSource,
          confidence: calculatedEta.confidence,
          modelVersion: (calculatedEta as any).modelVersion,
          generatedAt: calculatedEta.generatedAt,
          nextStop: calculatedEta.nextStop
            ? {
                stopId: calculatedEta.nextStop.stopId,
                stopCode: calculatedEta.nextStop.stopCode,
                stopNameEn: calculatedEta.nextStop.stopNameEn,
                stopNameTa: calculatedEta.nextStop.stopNameTa,
                stopSequence: calculatedEta.nextStop.stopSequence,
                etaMinutes: calculatedEta.nextStop.etaMinutes,
                estimatedArrivalAt: calculatedEta.nextStop.estimatedArrivalAt || null,
                remainingDistanceMeters: calculatedEta.nextStop.remainingDistanceMeters,
                confidenceIntervalSeconds: calculatedEta.nextStop.confidenceIntervalSeconds,
                predictionSource: calculatedEta.nextStop.predictionSource,
                fallbackReason: calculatedEta.nextStop.fallbackReason
              }
            : undefined,
          downstreamStops: (calculatedEta.downstreamStops || []).map((s) => ({
            stopId: s.stopId,
            stopCode: s.stopCode,
            stopNameEn: s.stopNameEn,
            stopNameTa: s.stopNameTa,
            stopSequence: s.stopSequence,
            etaMinutes: s.etaMinutes,
            estimatedArrivalAt: s.estimatedArrivalAt || null,
            remainingDistanceMeters: s.remainingDistanceMeters,
            confidenceIntervalSeconds: s.confidenceIntervalSeconds,
            predictionSource: s.predictionSource,
            fallbackReason: s.fallbackReason
          }))
        };
      }
    } catch {
      etaData = null;
    }

    // 6. Live Movement Intelligence & Stops Itinerary
    const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const compassHeading = latestPos && typeof latestPos.heading === 'number' && !isNaN(latestPos.heading)
      ? {
          degrees: Math.round(latestPos.heading),
          direction: compassDirs[Math.round(((latestPos.heading % 360) + 360) % 360 / 45) % 8]
        }
      : null;

    const currentSpeedKmph = latestPos && typeof latestPos.speedKmph === 'number' && !isNaN(latestPos.speedKmph)
      ? Math.round(latestPos.speedKmph * 10) / 10
      : null;

    let movementStatus: 'MOVING' | 'STATIONARY' | 'DWELLING' | 'UNAVAILABLE' = 'UNAVAILABLE';
    if (!latestPos || latestPos.trackingStatus === 'OFFLINE' || freshness === 'OFFLINE') {
      movementStatus = 'UNAVAILABLE';
    } else if (currentSpeedKmph !== null && currentSpeedKmph > 5) {
      movementStatus = 'MOVING';
    } else if (etaData?.nextStop && etaData.nextStop.remainingDistanceMeters <= 50) {
      movementStatus = 'DWELLING';
    } else {
      movementStatus = 'STATIONARY';
    }

    const totalDistanceKm = directionObj?.totalDistanceKm || routeDetails?.direction?.totalDistanceKm || 0;
    const totalDistM = totalDistanceKm * 1000;
    const progressMeters = latestPos?.distanceAlongRouteMeters ?? (latestPos?.progressRatio ? latestPos.progressRatio * totalDistM : 0);
    const progressPercent = totalDistM > 0
      ? Math.min(100, Math.max(0, Math.round((progressMeters / totalDistM) * 100)))
      : (latestPos?.progressRatio ? Math.round(latestPos.progressRatio * 100) : 0);

    const orderedStops = routeDetails?.direction?.stops || [];
    const nextStopSeq = etaData?.nextStop?.stopSequence ?? null;

    const stopsItinerary = orderedStops.map((seqItem) => {
      let stopStatus: 'CONFIRMED_PASSED' | 'CURRENT_STOP' | 'UPCOMING' = 'UPCOMING';
      if (nextStopSeq !== null && seqItem.sequenceOrder < nextStopSeq) {
        stopStatus = 'CONFIRMED_PASSED';
      } else if (nextStopSeq !== null && seqItem.sequenceOrder === nextStopSeq) {
        stopStatus = movementStatus === 'DWELLING' ? 'CURRENT_STOP' : 'UPCOMING';
      } else {
        stopStatus = 'UPCOMING';
      }

      const downstreamMatch = etaData?.downstreamStops?.find(
        (ds) => ds.stopId === seqItem.stop.id || ds.stopSequence === seqItem.sequenceOrder
      );

      return {
        stopId: seqItem.stop.id,
        stopCode: seqItem.stop.code,
        nameEn: seqItem.stop.nameEn,
        nameTa: seqItem.stop.nameTa,
        sequence: seqItem.sequenceOrder,
        location: (seqItem.stop.location?.coordinates || [0, 0]) as [number, number],
        status: stopStatus,
        distanceFromOriginKm: seqItem.distanceFromOriginKm,
        etaMinutes: downstreamMatch?.etaMinutes,
        estimatedArrivalAt: downstreamMatch?.estimatedArrivalAt,
        confidenceIntervalSeconds: downstreamMatch?.confidenceIntervalSeconds,
        predictionSource: downstreamMatch?.predictionSource,
        isFareStage: seqItem.isFareStage
      };
    });

    const lastConfirmedStop = stopsItinerary.filter((s) => s.status === 'CONFIRMED_PASSED').pop() || null;
    const nextExpectedStop = etaData?.nextStop
      ? {
          stopId: etaData.nextStop.stopId,
          stopCode: etaData.nextStop.stopCode,
          nameEn: etaData.nextStop.stopNameEn,
          nameTa: etaData.nextStop.stopNameTa,
          sequence: etaData.nextStop.stopSequence,
          distanceMeters: etaData.nextStop.remainingDistanceMeters,
          etaMinutes: etaData.nextStop.etaMinutes,
          estimatedArrivalAt: etaData.nextStop.estimatedArrivalAt,
          confidenceIntervalSeconds: etaData.nextStop.confidenceIntervalSeconds
        }
      : null;

    const intelligence: BusLiveIntelligenceDto = {
      movementStatus,
      currentSpeedKmph,
      compassHeading,
      routeProgress: {
        progressPercent,
        distanceTraveledKm: Math.round((progressMeters / 1000) * 10) / 10,
        totalDistanceKm,
        currentSegmentIndex: lastConfirmedStop ? lastConfirmedStop.sequence : 0,
        totalSegments: orderedStops.length > 0 ? orderedStops.length - 1 : 0
      },
      lastConfirmedStop,
      nextExpectedStop,
      stopsItinerary
    };

    return {
      bus: {
        id: bus._id.toString(),
        registrationNumber: bus.registrationNumber,
        fleetNumber: bus.fleetNumber,
        vehicleType: bus.vehicleType || 'ORDINARY_NON_AC',
        manufacturer: bus.manufacturer,
        vehicleModel: bus.vehicleModel,
        fuelType: bus.fuelType,
        seatingCapacity: bus.seatingCapacity,
        status: bus.status || 'IN_SERVICE',
        isReserveFleet: Boolean(bus.isReserveFleet)
      },
      depot: depotObj
        ? {
          id: depotObj._id.toString(),
          name: depotObj.name,
          code: depotObj.code
        }
        : null,
      assignedTrip: tripObj
        ? {
          id: tripObj._id.toString(),
          tripCode: tripObj.tripCode,
          departureTime: tripObj.departureTime,
          arrivalTime: tripObj.arrivalTime,
          status: tripObj.status
        }
        : null,
      route: routeObj
        ? {
          id: routeObj._id.toString(),
          routeNumber: routeObj.routeNumber,
          displayTitleEn: routeObj.displayTitleEn,
          displayTitleTa: routeObj.displayTitleTa
        }
        : null,
      direction: directionObj
        ? {
          id: directionObj._id.toString(),
          directionCode: directionObj.directionCode,
          totalDistanceKm: directionObj.totalDistanceKm,
          estimatedDurationMins: directionObj.estimatedDurationMins
        }
        : null,
      routeDetails,
      latestPosition: latestPos
        ? {
          coordinates: latestPos.location?.coordinates || [0, 0],
          snappedCoordinates: latestPos.snappedLocation?.coordinates,
          heading: latestPos.heading || 0,
          speedKmph: latestPos.speedKmph || 0,
          progressRatio: latestPos.progressRatio,
          distanceAlongRouteMeters: latestPos.distanceAlongRouteMeters,
          totalRouteDistanceMeters: latestPos.totalRouteDistanceMeters,
          trackingStatus: latestPos.trackingStatus || (isSim ? 'SIMULATED' : 'LIVE'),
          source: latestPos.source || 'SIMULATOR',
          isSimulated: isSim,
          freshness,
          satellitesCount: latestPos.satellitesCount,
          altitudeMeters: latestPos.altitudeMeters,
          gpsFixStatus: latestPos.gpsFixStatus,
          batteryPercent: latestPos.batteryPercent,
          networkSignalDbm: latestPos.networkSignalDbm,
          recordedAt:
            latestPos.recordedAt instanceof Date
              ? latestPos.recordedAt.toISOString()
              : new Date(latestPos.recordedAt).toISOString(),
          receivedAt:
            latestPos.receivedAt instanceof Date
              ? latestPos.receivedAt.toISOString()
              : new Date(latestPos.receivedAt).toISOString()
        }
        : null,
      deviceHealth,
      eta: etaData,
      intelligence
    };
  }
}

export const fleetService = new FleetService();
