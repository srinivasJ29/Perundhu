import { Request, Response, NextFunction } from 'express';
import { hardwareIngestionService } from './hardware.service';
import { gpsAdapterRegistry } from './hardware.registry';
import { AdapterContext } from './hardware.types';

export class HardwareController {
  /**
   * Ingests hardware telemetry with automatic adapter selection.
   */
  public async ingestAuto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context: AdapterContext = {
        headers: req.headers as Record<string, any>,
        auth: (req as any).hardwareAuth,
        rawBody: (req as any).rawBody,
        receiveTime: new Date()
      };

      const result = await hardwareIngestionService.ingestHardwareTelemetry(
        req.body,
        context
      );

      res.status(result.pipelineAccepted ? 202 : 200).json({
        message: result.pipelineAccepted
          ? 'Hardware GPS telemetry accepted and processed through pipeline'
          : 'Telemetry processed; bus position update skipped',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Ingests hardware telemetry via specific adapter ID.
   */
  public async ingestSpecific(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adapterId = req.params.adapterId;
      const context: AdapterContext = {
        headers: req.headers as Record<string, any>,
        auth: (req as any).hardwareAuth,
        rawBody: (req as any).rawBody,
        receiveTime: new Date()
      };

      const result = await hardwareIngestionService.ingestHardwareTelemetry(
        req.body,
        context,
        adapterId
      );

      res.status(result.pipelineAccepted ? 202 : 200).json({
        message: result.pipelineAccepted
          ? `Hardware telemetry processed successfully via ${result.adapterUsed}`
          : 'Telemetry processed; bus position update skipped',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Testing sandbox: parses, validates and normalizes a test payload without feeding live tracking.
   */
  public async validateTestPayload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adapterId, payload, headers } = req.body;
      const context: AdapterContext = {
        headers: { ...(headers || {}), 'x-perundhu-test': 'true' },
        auth: (req as any).hardwareAuth,
        receiveTime: new Date()
      };

      const result = await hardwareIngestionService.ingestHardwareTelemetry(
        payload,
        context,
        adapterId
      );

      res.status(200).json({
        message: 'Test payload validated successfully (isolated from passenger live tracking)',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lists available hardware telematics adapters.
   */
  public listAdapters(_req: Request, res: Response): void {
    const adapters = gpsAdapterRegistry.listAdapters();
    res.status(200).json({
      data: adapters,
      count: adapters.length
    });
  }

  /**
   * Returns data bandwidth measurements and estimates for transport operators.
   */
  public getBandwidthEstimates(_req: Request, res: Response): void {
    const estimates = gpsAdapterRegistry.getBandwidthEstimates();
    res.status(200).json({
      data: estimates
    });
  }
}

export const hardwareController = new HardwareController();

