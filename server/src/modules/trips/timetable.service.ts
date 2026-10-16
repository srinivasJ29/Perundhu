import { Types } from 'mongoose';
import {
  Route,
  RouteDirection,
  RouteDirectionDocument,
  RouteDocument,
  ScheduledTrip,
  TripStopTime,
  Stop,
  StopDocument,
  BusDocument
} from '../../models';
import { NotFoundError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/validation';
import {
  getIstDayOfWeek,
  getIstCurrentDate
} from '../../common/utils/timezone';
import {
  RouteTimetableQuery,
  StopDeparturesQuery
} from './timetable.validation';

export interface RouteTimetableDepartureDto {
  tripId: string;
  tripCode: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  operationalDays: string[];
  bus?: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
  } | null;
}

export interface RouteDirectionTimetableDto {
  directionId: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  totalDistanceKm: number;
  estimatedDurationMins: number;
  originStop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
  };
  destinationStop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
  };
  departuresCount: number;
  departures: RouteTimetableDepartureDto[];
}

export interface RouteTimetableResponseDto {
  route: {
    id: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
    serviceCategory: string;
  };
  queryDayOfWeek: string;
  queryDate?: string;
  timezone: string;
  isRealTimePrediction: false;
  scheduleNotice: string;
  directions: RouteDirectionTimetableDto[];
}

export interface StopDepartureItemDto {
  tripId: string;
  tripCode: string;
  routeId: string;
  routeNumber: string;
  routeTitleEn: string;
  routeTitleTa: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  destinationStop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
  };
  scheduledArrivalTime: string;
  scheduledDepartureTime: string;
  stopSequence: number;
  status: string;
  bus?: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
  } | null;
}

export interface StopDeparturesResponseDto {
  stop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
    landmark?: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  queryDate: string;
  dayOfWeek: string;
  timeWindow: {
    fromTime: string;
    toTime: string;
  };
  timezone: string;
  isRealTimePrediction: false;
  scheduleNotice: string;
  departures: StopDepartureItemDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

export class TimetableService {
  /**
   * Retrieves planned scheduled departures for a route grouped by direction.
   */
  public async getRouteTimetable(
    routeId: string,
    query: RouteTimetableQuery
  ): Promise<RouteTimetableResponseDto> {
    const routeObjectId = new Types.ObjectId(routeId);

    const route = await Route.findOne({ _id: routeObjectId, isActive: true })
      .select('_id routeNumber displayTitleEn displayTitleTa serviceCategory')
      .lean();

    if (!route) {
      throw new NotFoundError(`Route with ID '${routeId}' not found or inactive`);
    }

    const { directionCode, dayOfWeek, date } = query;
    const targetDay = dayOfWeek || (date ? getIstDayOfWeek(date) : getIstDayOfWeek());

    const directionFilter: Record<string, unknown> = {
      routeId: routeObjectId,
      isActive: true
    };
    if (directionCode) {
      directionFilter.directionCode = directionCode;
    }

    const directions = await RouteDirection.find(directionFilter)
      .populate<{ originStopId: StopDocument }>({
        path: 'originStopId',
        select: '_id code nameEn nameTa'
      })
      .populate<{ destinationStopId: StopDocument }>({
        path: 'destinationStopId',
        select: '_id code nameEn nameTa'
      })
      .lean();

    const directionResults: RouteDirectionTimetableDto[] = [];

    for (const dir of directions) {
      const trips = await ScheduledTrip.find({
        routeDirectionId: dir._id,
        isActive: true,
        operationalDays: targetDay
      })
        .sort({ departureTime: 1 })
        .populate<{ busId: BusDocument | null }>({
          path: 'busId',
          select: '_id registrationNumber fleetNumber vehicleType'
        })
        .lean();

      const departures: RouteTimetableDepartureDto[] = trips.map((t) => ({
        tripId: t._id.toString(),
        tripCode: t.tripCode,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        status: t.status || 'SCHEDULED',
        operationalDays: t.operationalDays,
        bus: t.busId && typeof t.busId === 'object'
          ? {
              id: (t.busId as BusDocument)._id.toString(),
              registrationNumber: (t.busId as BusDocument).registrationNumber,
              fleetNumber: (t.busId as BusDocument).fleetNumber,
              vehicleType: (t.busId as BusDocument).vehicleType
            }
          : null
      }));

      directionResults.push({
        directionId: dir._id.toString(),
        directionCode: dir.directionCode,
        totalDistanceKm: dir.totalDistanceKm,
        estimatedDurationMins: dir.estimatedDurationMins,
        originStop: {
          id: dir.originStopId._id.toString(),
          code: dir.originStopId.code,
          nameEn: dir.originStopId.nameEn,
          nameTa: dir.originStopId.nameTa
        },
        destinationStop: {
          id: dir.destinationStopId._id.toString(),
          code: dir.destinationStopId.code,
          nameEn: dir.destinationStopId.nameEn,
          nameTa: dir.destinationStopId.nameTa
        },
        departuresCount: departures.length,
        departures
      });
    }

    return {
      route: {
        id: route._id.toString(),
        routeNumber: route.routeNumber,
        displayTitleEn: route.displayTitleEn,
        displayTitleTa: route.displayTitleTa,
        serviceCategory: route.serviceCategory
      },
      queryDayOfWeek: targetDay,
      queryDate: date,
      timezone: 'Asia/Kolkata (IST, UTC+05:30)',
      isRealTimePrediction: false,
      scheduleNotice:
        'Scheduled departure times reflect planned operational timetables; they are not live GPS predictions.',
      directions: directionResults
    };
  }

  /**
   * Retrieves planned scheduled departures for a specific bus stop within a validated time window.
   */
  public async getStopDepartures(
    stopId: string,
    query: StopDeparturesQuery
  ): Promise<StopDeparturesResponseDto> {
    const stopObjectId = new Types.ObjectId(stopId);

    const stop = await Stop.findOne({ _id: stopObjectId, isActive: true })
      .select('_id code nameEn nameTa location landmark')
      .lean();

    if (!stop) {
      throw new NotFoundError(`Stop with ID '${stopId}' not found or inactive`);
    }

    const {
      page = 1,
      limit = 20,
      date,
      dayOfWeek,
      fromTime = '00:00',
      toTime = '23:59'
    } = query;

    const queryDateStr = date || getIstCurrentDate();
    const targetDay = dayOfWeek || (date ? getIstDayOfWeek(date) : getIstDayOfWeek());

    // 1. Fetch trip stop times matching this stop and time window
    const stopTimes = await TripStopTime.find({
      stopId: stopObjectId,
      scheduledDepartureTime: { $gte: fromTime, $lte: toTime }
    })
      .sort({ scheduledDepartureTime: 1 })
      .lean();

    if (stopTimes.length === 0) {
      return {
        stop: {
          id: stop._id.toString(),
          code: stop.code,
          nameEn: stop.nameEn,
          nameTa: stop.nameTa,
          landmark: stop.landmark,
          location: stop.location
        },
        queryDate: queryDateStr,
        dayOfWeek: targetDay,
        timeWindow: { fromTime, toTime },
        timezone: 'Asia/Kolkata (IST, UTC+05:30)',
        isRealTimePrediction: false,
        scheduleNotice:
          'Scheduled departure times reflect planned operational timetables; they are not live GPS predictions.',
        departures: [],
        pagination: buildPaginationMeta(0, page, limit)
      };
    }

    const tripIds = stopTimes.map((st) => st.tripId);

    // 2. Fetch corresponding scheduled trips running on this operational day
    const trips = await ScheduledTrip.find({
      _id: { $in: tripIds },
      isActive: true,
      operationalDays: targetDay
    })
      .populate<{
        routeDirectionId: (RouteDirectionDocument & {
          routeId: RouteDocument;
          destinationStopId: StopDocument;
        }) | null;
      }>({
        path: 'routeDirectionId',
        select: '_id routeId directionCode destinationStopId',
        populate: [
          {
            path: 'routeId',
            select: '_id routeNumber displayTitleEn displayTitleTa'
          },
          {
            path: 'destinationStopId',
            select: '_id code nameEn nameTa'
          }
        ]
      })
      .populate<{ busId: BusDocument | null }>({
        path: 'busId',
        select: '_id registrationNumber fleetNumber'
      })
      .lean();

    const tripMap = new Map<string, (typeof trips)[0]>();
    for (const t of trips) {
      tripMap.set(t._id.toString(), t);
    }

    // 3. Assemble departure items
    const allDepartures: StopDepartureItemDto[] = [];

    for (const st of stopTimes) {
      const trip = tripMap.get(st.tripId.toString());
      if (!trip) continue; // Trip not operating on this day or inactive

      const dir = trip.routeDirectionId;
      if (!dir || typeof dir !== 'object') continue;

      const route = dir.routeId;
      const destStop = dir.destinationStopId;

      allDepartures.push({
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        routeId: route ? route._id.toString() : '',
        routeNumber: route ? route.routeNumber : '',
        routeTitleEn: route ? route.displayTitleEn : '',
        routeTitleTa: route ? route.displayTitleTa : '',
        directionCode: dir.directionCode,
        destinationStop: {
          id: destStop ? destStop._id.toString() : '',
          code: destStop ? destStop.code : '',
          nameEn: destStop ? destStop.nameEn : '',
          nameTa: destStop ? destStop.nameTa : ''
        },
        scheduledArrivalTime: st.scheduledArrivalTime,
        scheduledDepartureTime: st.scheduledDepartureTime,
        stopSequence: st.stopSequence,
        status: trip.status || 'SCHEDULED',
        bus: trip.busId && typeof trip.busId === 'object'
          ? {
              id: (trip.busId as BusDocument)._id.toString(),
              registrationNumber: (trip.busId as BusDocument).registrationNumber,
              fleetNumber: (trip.busId as BusDocument).fleetNumber
            }
          : null
      });
    }

    // Sort by scheduled departure time
    allDepartures.sort((a, b) => a.scheduledDepartureTime.localeCompare(b.scheduledDepartureTime));

    const total = allDepartures.length;
    const startIndex = (page - 1) * limit;
    const paginatedDepartures = allDepartures.slice(startIndex, startIndex + limit);

    return {
      stop: {
        id: stop._id.toString(),
        code: stop.code,
        nameEn: stop.nameEn,
        nameTa: stop.nameTa,
        landmark: stop.landmark,
        location: stop.location
      },
      queryDate: queryDateStr,
      dayOfWeek: targetDay,
      timeWindow: { fromTime, toTime },
      timezone: 'Asia/Kolkata (IST, UTC+05:30)',
      isRealTimePrediction: false,
      scheduleNotice:
        'Scheduled departure times reflect planned operational timetables; they are not live GPS predictions.',
      departures: paginatedDepartures,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }
}

export const timetableService = new TimetableService();
