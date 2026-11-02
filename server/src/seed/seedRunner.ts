import mongoose, { Types } from 'mongoose';
import { logger } from '../common/logger';
import { env } from '../config/env';
import {
  District,
  BusStand,
  Stop,
  Route,
  RouteDirection,
  RouteStopSequence,
  Bus,
  ScheduledTrip,
  TripStopTime,
  User,
  ServiceAlert
} from '../models';
import { hashPassword } from '../modules/auth/auth.tokens';
import {
  seedDistricts,
  seedBusStands,
  seedStops,
  seedRoutes,
  seedDirections,
  seedStopSequences,
  seedBuses,
  seedTrips,
  seedTripStopTimes,
  seedServiceAlerts
} from './maduraiSeedData';

export interface SeedResultItem {
  collection: string;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface SeedReport {
  isDryRun: boolean;
  timestamp: string;
  summary: Record<string, SeedResultItem>;
}

export async function runSeed(options: { dryRun?: boolean; uri?: string } = {}): Promise<SeedReport> {
  const isDryRun = options.dryRun ?? process.argv.includes('--dry-run');
  const mongoUri = options.uri || env.MONGODB_URI;

  if (!mongoUri && mongoose.connection.readyState === 0) {
    throw new Error(
      'Cannot execute seed: MONGODB_URI is not set and no active mongoose connection is available.'
    );
  }

  const shouldDisconnectAfter = mongoose.connection.readyState === 0;

  if (mongoose.connection.readyState === 0 && mongoUri) {
    logger.info('Connecting to MongoDB Atlas for seed execution...');
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB.');
  }

  logger.info(`Starting Madurai Pilot corridor seed execution (Dry Run: ${isDryRun})...`);

  const report: SeedReport = {
    isDryRun,
    timestamp: new Date().toISOString(),
    summary: {}
  };

  // Helper for tracking statistics
  const initItem = (collection: string, total: number): SeedResultItem => ({
    collection,
    inserted: 0,
    updated: 0,
    skipped: 0,
    total
  });

  try {
    // ---------------------------------------------------------------------------
    // 1. Districts
    // ---------------------------------------------------------------------------
    const districtStats = initItem('districts', seedDistricts.length);
    const districtMap = new Map<string, Types.ObjectId>();

    for (const d of seedDistricts) {
      const existing = await District.findOne({ code: d.code });
      if (isDryRun) {
        if (!existing) districtStats.inserted++;
        else districtStats.skipped++;
        districtMap.set(d.code, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await District.updateOne(
          { code: d.code },
          {
            $set: {
              nameEn: d.nameEn,
              nameTa: d.nameTa,
              headquarters: d.headquarters,
              isActive: true
            }
          },
          { upsert: true }
        );
        if (res.upsertedCount > 0) districtStats.inserted++;
        else if (res.modifiedCount > 0) districtStats.updated++;
        else districtStats.skipped++;

        const saved = await District.findOne({ code: d.code });
        if (saved) districtMap.set(d.code, saved._id);
      }
    }
    report.summary['districts'] = districtStats;

    // ---------------------------------------------------------------------------
    // 2. Bus Stands
    // ---------------------------------------------------------------------------
    const standStats = initItem('bus_stands', seedBusStands.length);
    const standMap = new Map<string, Types.ObjectId>();

    for (const s of seedBusStands) {
      const districtId = districtMap.get(s.districtCode);
      if (!districtId) throw new Error(`Referential error: District ${s.districtCode} not found for stand ${s.code}`);

      const payload = {
        districtId,
        code: s.code,
        nameEn: s.nameEn,
        nameTa: s.nameTa,
        location: { type: 'Point' as const, coordinates: s.coordinates },
        standType: s.standType,
        totalPlatforms: s.totalPlatforms,
        isActive: true
      };

      const existing = await BusStand.findOne({ code: s.code });
      if (isDryRun) {
        if (!existing) standStats.inserted++;
        else standStats.skipped++;
        standMap.set(s.code, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await BusStand.updateOne({ code: s.code }, { $set: payload }, { upsert: true });
        if (res.upsertedCount > 0) standStats.inserted++;
        else if (res.modifiedCount > 0) standStats.updated++;
        else standStats.skipped++;

        const saved = await BusStand.findOne({ code: s.code });
        if (saved) standMap.set(s.code, saved._id);
      }
    }
    report.summary['bus_stands'] = standStats;

    // ---------------------------------------------------------------------------
    // 3. Stops
    // ---------------------------------------------------------------------------
    const stopStats = initItem('stops', seedStops.length);
    const stopMap = new Map<string, Types.ObjectId>();

    for (const st of seedStops) {
      const districtId = districtMap.get(st.districtCode);
      if (!districtId) throw new Error(`Referential error: District ${st.districtCode} not found for stop ${st.code}`);

      const busStandId = st.busStandCode ? standMap.get(st.busStandCode) : undefined;

      const payload = {
        districtId,
        busStandId,
        code: st.code,
        nameEn: st.nameEn,
        nameTa: st.nameTa,
        location: { type: 'Point' as const, coordinates: st.coordinates },
        landmark: st.landmark,
        isActive: true
      };

      const existing = await Stop.findOne({ code: st.code });
      if (isDryRun) {
        if (!existing) stopStats.inserted++;
        else stopStats.skipped++;
        stopMap.set(st.code, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await Stop.updateOne({ code: st.code }, { $set: payload }, { upsert: true });
        if (res.upsertedCount > 0) stopStats.inserted++;
        else if (res.modifiedCount > 0) stopStats.updated++;
        else stopStats.skipped++;

        const saved = await Stop.findOne({ code: st.code });
        if (saved) stopMap.set(st.code, saved._id);
      }
    }
    report.summary['stops'] = stopStats;

    // ---------------------------------------------------------------------------
    // 4. Routes
    // ---------------------------------------------------------------------------
    const routeStats = initItem('routes', seedRoutes.length);
    const routeMap = new Map<string, Types.ObjectId>();

    for (const r of seedRoutes) {
      const districtId = districtMap.get(r.districtCode);
      if (!districtId) throw new Error(`Referential error: District ${r.districtCode} not found for route ${r.routeNumber}`);

      const payload = {
        districtId,
        routeNumber: r.routeNumber,
        displayTitleEn: r.displayTitleEn,
        displayTitleTa: r.displayTitleTa,
        serviceCategory: r.serviceCategory,
        isActive: true
      };

      const existing = await Route.findOne({ districtId, routeNumber: r.routeNumber });
      if (isDryRun) {
        if (!existing) routeStats.inserted++;
        else routeStats.skipped++;
        routeMap.set(r.routeNumber, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await Route.updateOne(
          { districtId, routeNumber: r.routeNumber },
          { $set: payload },
          { upsert: true }
        );
        if (res.upsertedCount > 0) routeStats.inserted++;
        else if (res.modifiedCount > 0) routeStats.updated++;
        else routeStats.skipped++;

        const saved = await Route.findOne({ districtId, routeNumber: r.routeNumber });
        if (saved) routeMap.set(r.routeNumber, saved._id);
      }
    }
    report.summary['routes'] = routeStats;

    // ---------------------------------------------------------------------------
    // 5. Route Directions
    // ---------------------------------------------------------------------------
    const dirStats = initItem('route_directions', seedDirections.length);
    const dirMap = new Map<string, Types.ObjectId>(); // key: `${routeNumber}_${directionCode}`

    for (const rd of seedDirections) {
      const routeId = routeMap.get(rd.routeNumber);
      if (!routeId) throw new Error(`Referential error: Route ${rd.routeNumber} not found for direction`);

      const originStopId = stopMap.get(rd.originStopCode);
      const destinationStopId = stopMap.get(rd.destinationStopCode);
      if (!originStopId) throw new Error(`Origin stop ${rd.originStopCode} not found`);
      if (!destinationStopId) throw new Error(`Destination stop ${rd.destinationStopCode} not found`);

      const originStandId = rd.originStandCode ? standMap.get(rd.originStandCode) : undefined;
      const destinationStandId = rd.destinationStandCode ? standMap.get(rd.destinationStandCode) : undefined;

      const payload = {
        routeId,
        directionCode: rd.directionCode,
        originStandId,
        destinationStandId,
        originStopId,
        destinationStopId,
        totalDistanceKm: rd.totalDistanceKm,
        estimatedDurationMins: rd.estimatedDurationMins,
        routePolyline: { type: 'LineString' as const, coordinates: rd.coordinates },
        isActive: true
      };

      const dirKey = `${rd.routeNumber}_${rd.directionCode}`;
      const existing = await RouteDirection.findOne({ routeId, directionCode: rd.directionCode });
      if (isDryRun) {
        if (!existing) dirStats.inserted++;
        else dirStats.skipped++;
        dirMap.set(dirKey, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await RouteDirection.updateOne(
          { routeId, directionCode: rd.directionCode },
          { $set: payload },
          { upsert: true }
        );
        if (res.upsertedCount > 0) dirStats.inserted++;
        else if (res.modifiedCount > 0) dirStats.updated++;
        else dirStats.skipped++;

        const saved = await RouteDirection.findOne({ routeId, directionCode: rd.directionCode });
        if (saved) dirMap.set(dirKey, saved._id);
      }
    }
    report.summary['route_directions'] = dirStats;

    // ---------------------------------------------------------------------------
    // 6. Route Stop Sequences
    // ---------------------------------------------------------------------------
    const seqStats = initItem('route_stop_sequences', seedStopSequences.length);

    for (const seq of seedStopSequences) {
      const dirKey = `${seq.routeNumber}_${seq.directionCode}`;
      const directionId = dirMap.get(dirKey);
      if (!directionId) throw new Error(`Direction ${dirKey} not found for stop sequence`);

      const stopId = stopMap.get(seq.stopCode);
      if (!stopId) throw new Error(`Stop ${seq.stopCode} not found for sequence`);

      const payload = {
        directionId,
        stopId,
        sequenceOrder: seq.sequenceOrder,
        distanceFromOriginKm: seq.distanceFromOriginKm,
        cumulativeDurationMinutes: seq.cumulativeDurationMinutes,
        isFareStage: seq.isFareStage,
        isActive: true
      };

      const existing = await RouteStopSequence.findOne({ directionId, sequenceOrder: seq.sequenceOrder });
      if (isDryRun) {
        if (!existing) seqStats.inserted++;
        else seqStats.skipped++;
      } else {
        const res = await RouteStopSequence.updateOne(
          { directionId, sequenceOrder: seq.sequenceOrder },
          { $set: payload },
          { upsert: true }
        );
        if (res.upsertedCount > 0) seqStats.inserted++;
        else if (res.modifiedCount > 0) seqStats.updated++;
        else seqStats.skipped++;
      }
    }
    report.summary['route_stop_sequences'] = seqStats;

    // ---------------------------------------------------------------------------
    // 7. Buses
    // ---------------------------------------------------------------------------
    const busStats = initItem('buses', seedBuses.length);
    const busMap = new Map<string, Types.ObjectId>();

    for (const b of seedBuses) {
      const payload = {
        registrationNumber: b.registrationNumber,
        fleetNumber: b.fleetNumber,
        depotName: b.depotName,
        vehicleType: b.vehicleType,
        status: b.status,
        isActive: true
      };

      const existing = await Bus.findOne({
        $or: [{ registrationNumber: b.registrationNumber }, { fleetNumber: b.fleetNumber }]
      });
      if (isDryRun) {
        if (!existing) busStats.inserted++;
        else busStats.skipped++;
        busMap.set(b.registrationNumber, existing ? existing._id : new Types.ObjectId());
      } else {
        if (existing) {
          const res = await Bus.updateOne({ _id: existing._id }, { $set: payload });
          if (res.modifiedCount > 0) busStats.updated++;
          else busStats.skipped++;
          busMap.set(b.registrationNumber, existing._id);
        } else {
          const created = await Bus.create(payload);
          busStats.inserted++;
          busMap.set(b.registrationNumber, created._id);
        }
      }
    }
    report.summary['buses'] = busStats;

    // ---------------------------------------------------------------------------
    // 8. Scheduled Trips
    // ---------------------------------------------------------------------------
    const tripStats = initItem('scheduled_trips', seedTrips.length);
    const tripMap = new Map<string, Types.ObjectId>();

    for (const t of seedTrips) {
      const dirKey = `${t.routeNumber}_${t.directionCode}`;
      const routeDirectionId = dirMap.get(dirKey);
      if (!routeDirectionId) throw new Error(`Direction ${dirKey} not found for trip ${t.tripCode}`);

      const busId = t.busRegistrationNumber ? busMap.get(t.busRegistrationNumber) : undefined;

      const payload = {
        tripCode: t.tripCode,
        routeDirectionId,
        busId,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        operationalDays: t.operationalDays,
        status: 'SCHEDULED',
        isActive: true
      };

      const existing = await ScheduledTrip.findOne({ tripCode: t.tripCode });
      if (isDryRun) {
        if (!existing) tripStats.inserted++;
        else tripStats.skipped++;
        tripMap.set(t.tripCode, existing ? existing._id : new Types.ObjectId());
      } else {
        const res = await ScheduledTrip.updateOne({ tripCode: t.tripCode }, { $set: payload }, { upsert: true });
        if (res.upsertedCount > 0) tripStats.inserted++;
        else if (res.modifiedCount > 0) tripStats.updated++;
        else tripStats.skipped++;

        const saved = await ScheduledTrip.findOne({ tripCode: t.tripCode });
        if (saved) {
          tripMap.set(t.tripCode, saved._id);
          if (busId) {
            await Bus.updateOne({ _id: busId }, { $set: { currentAssignedTripId: saved._id } });
          }
        }
      }
    }
    report.summary['scheduled_trips'] = tripStats;

    // ---------------------------------------------------------------------------
    // 9. Trip Stop Times
    // ---------------------------------------------------------------------------
    const tstStats = initItem('trip_stop_times', seedTripStopTimes.length);

    for (const tst of seedTripStopTimes) {
      const tripId = tripMap.get(tst.tripCode);
      if (!tripId) throw new Error(`Trip ${tst.tripCode} not found for stop time`);

      const stopId = stopMap.get(tst.stopCode);
      if (!stopId) throw new Error(`Stop ${tst.stopCode} not found for trip stop time`);

      const payload = {
        tripId,
        stopId,
        stopSequence: tst.stopSequence,
        scheduledArrivalTime: tst.scheduledArrivalTime,
        scheduledDepartureTime: tst.scheduledDepartureTime
      };

      const existing = await TripStopTime.findOne({ tripId, stopSequence: tst.stopSequence });
      if (isDryRun) {
        if (!existing) tstStats.inserted++;
        else tstStats.skipped++;
      } else {
        const res = await TripStopTime.updateOne(
          { tripId, stopSequence: tst.stopSequence },
          { $set: payload },
          { upsert: true }
        );
        if (res.upsertedCount > 0) tstStats.inserted++;
        else if (res.modifiedCount > 0) tstStats.updated++;
        else tstStats.skipped++;
      }
    }
    report.summary['trip_stop_times'] = tstStats;

    // ---------------------------------------------------------------------------
    // 10. Default System Users (Admin & Passenger Credentials)
    // ---------------------------------------------------------------------------
    const userStats = initItem('users', 3);
    const defaultUsers = [
      {
        email: 'admin@tnstc.perundhu.gov.in',
        password: 'PerundhuAdmin@2026',
        fullName: 'TNSTC System Administrator',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const
      },
      {
        email: 'admin@perundhu.tnstc.gov.in',
        password: 'PerundhuAdmin@2026',
        fullName: 'TNSTC System Administrator (Alias)',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const
      },
      {
        email: 'passenger@example.com',
        password: 'Passenger@123',
        fullName: 'Madurai Citizen Passenger',
        role: 'PASSENGER' as const,
        status: 'ACTIVE' as const
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ email: u.email });
      if (isDryRun) {
        if (!existing) userStats.inserted++;
        else userStats.skipped++;
      } else {
        const passwordHash = await hashPassword(u.password);
        const res = await User.updateOne(
          { email: u.email },
          {
            $set: {
              fullName: u.fullName,
              passwordHash,
              role: u.role,
              status: u.status
            }
          },
          { upsert: true }
        );
        if (res.upsertedCount > 0) userStats.inserted++;
        else if (res.modifiedCount > 0) userStats.updated++;
        else userStats.skipped++;
      }
    }
    report.summary['users'] = userStats;

    // ---------------------------------------------------------------------------
    // 11. Verified Pilot Service Alerts
    // ---------------------------------------------------------------------------
    const alertStats = initItem('service_alerts', seedServiceAlerts.length);
    for (const a of seedServiceAlerts) {
      const payload = {
        titleEn: a.titleEn,
        titleTa: a.titleTa,
        descriptionEn: a.descriptionEn,
        descriptionTa: a.descriptionTa,
        alertType: a.alertType,
        severity: a.severity,
        districtCode: a.districtCode,
        affectedRouteNumbers: a.affectedRouteNumbers,
        affectedStandCodes: a.affectedStandCodes || [],
        effectiveFrom: a.effectiveFrom,
        effectiveUntil: a.effectiveUntil,
        isActive: true,
        sourceOrganization: a.sourceOrganization,
        sourceUrl: a.sourceUrl,
        verifiedAt: new Date()
      };

      const existing = await ServiceAlert.findOne({ titleEn: a.titleEn });
      if (isDryRun) {
        if (!existing) alertStats.inserted++;
        else alertStats.skipped++;
      } else {
        const res = await ServiceAlert.updateOne(
          { titleEn: a.titleEn },
          { $set: payload },
          { upsert: true }
        );
        if (res.upsertedCount > 0) alertStats.inserted++;
        else if (res.modifiedCount > 0) alertStats.updated++;
        else alertStats.skipped++;
      }
    }
    report.summary['service_alerts'] = alertStats;

    logger.info('--- Seed Execution Summary ---');
    for (const [col, stats] of Object.entries(report.summary)) {
      logger.info(
        `[${col}] Total: ${stats.total} | Inserted: ${stats.inserted} | Updated: ${stats.updated} | Skipped: ${stats.skipped}`
      );
    }
    logger.info('Seed execution finished successfully.');

    return report;
  } finally {
    if (shouldDisconnectAfter) {
      await mongoose.disconnect();
      logger.info('Closed database connection after seeding.');
    }
  }
}

// Direct CLI invocation
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Seed script encountered a fatal error');
      process.exit(1);
    });
}
