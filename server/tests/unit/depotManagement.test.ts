import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { DepotTransfer } from '../../src/models/DepotTransfer';

describe('Depot Management & Transfers (Unit Tests)', () => {
  describe('DepotTransfer Model', () => {
    it('should validate a valid transfer document', () => {
      const busId = new Types.ObjectId();
      const fromDepotId = new Types.ObjectId();
      const toDepotId = new Types.ObjectId();

      const transfer = new DepotTransfer({
        transferNumber: 'trf-2026-001',
        busId,
        fromDepotId,
        toDepotId,
        reason: 'FLEET_REBALANCING',
        reasonDetails: 'Reallocating 5 ordinary buses for festival rush',
        requestedBy: 'manager_mdu@tnstc.gov.in',
        status: 'REQUESTED'
      });

      const err = transfer.validateSync();
      expect(err).toBeUndefined();
      expect(transfer.transferNumber).toBe('TRF-2026-001');
      expect(transfer.status).toBe('REQUESTED');
    });

    it('should fail when required fields are missing', () => {
      const transfer = new DepotTransfer({});
      const err = transfer.validateSync();
      expect(err?.errors['transferNumber']).toBeDefined();
      expect(err?.errors['busId']).toBeDefined();
      expect(err?.errors['fromDepotId']).toBeDefined();
      expect(err?.errors['toDepotId']).toBeDefined();
      expect(err?.errors['requestedBy']).toBeDefined();
    });

    it('should reject invalid transfer status enum', () => {
      const transfer = new DepotTransfer({
        transferNumber: 'TRF-002',
        busId: new Types.ObjectId(),
        fromDepotId: new Types.ObjectId(),
        toDepotId: new Types.ObjectId(),
        requestedBy: 'officer@tnstc.gov.in',
        status: 'DISCARDED' as any
      });

      const err = transfer.validateSync();
      expect(err?.errors['status']).toBeDefined();
    });

    it('should reject pre-validation when fromDepotId equals toDepotId', async () => {
      const sameDepotId = new Types.ObjectId();

      const transfer = new DepotTransfer({
        transferNumber: 'TRF-IDENTICAL',
        busId: new Types.ObjectId(),
        fromDepotId: sameDepotId,
        toDepotId: sameDepotId,
        requestedBy: 'officer@tnstc.gov.in'
      });

      await new Promise<void>((resolve) => {
        const next = (err?: Error) => {
          expect(err).toBeDefined();
          expect(err?.message).toContain('Source and destination depots cannot be the same depot');
          resolve();
        };
        const hook = (DepotTransfer.schema as any).s.hooks._pres.get('validate')[0].fn;
        hook.call(transfer, next);
      });
    });

    it('should properly record audit history log entries', () => {
      const transfer = new DepotTransfer({
        transferNumber: 'TRF-AUDIT-01',
        busId: new Types.ObjectId(),
        fromDepotId: new Types.ObjectId(),
        toDepotId: new Types.ObjectId(),
        requestedBy: 'requester@tnstc.gov.in',
        auditHistory: [
          {
            action: 'TRANSFER_REQUESTED',
            performedBy: 'requester@tnstc.gov.in',
            timestamp: new Date(),
            notes: 'Initial dispatch request'
          },
          {
            action: 'TRANSFER_APPROVED',
            performedBy: 'approver@tnstc.gov.in',
            timestamp: new Date(),
            notes: 'Authorized by regional fleet GM'
          }
        ]
      });

      expect(transfer.validateSync()).toBeUndefined();
      expect(transfer.auditHistory).toHaveLength(2);
      expect(transfer.auditHistory[1].action).toBe('TRANSFER_APPROVED');
    });
  });
});

