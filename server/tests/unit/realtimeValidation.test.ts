import { describe, it, expect } from 'vitest';
import {
  subscribeBusSchema,
  subscribeRouteSchema,
  unsubscribeBusSchema,
  unsubscribeRouteSchema,
  isValidObjectId
} from '../../src/modules/realtime/realtime.validation';

describe('Real-Time Payload Validation (Unit)', () => {
  const validId = '60d5ecb8b392d40015a8e1a1';

  describe('isValidObjectId helper', () => {
    it('should return true for valid 24-character hexadecimal ObjectId', () => {
      expect(isValidObjectId(validId)).toBe(true);
      expect(isValidObjectId('000000000000000000000000')).toBe(true);
      expect(isValidObjectId('abcdef1234567890abcdef12')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidObjectId('12345')).toBe(false);
      expect(isValidObjectId('60d5ecb8b392d40015a8e1ag')).toBe(false); // 'g' is non-hex
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId('60d5ecb8b392d40015a8e1a1-extra')).toBe(false);
    });
  });

  describe('subscribeBusSchema', () => {
    it('should accept a valid busId payload', () => {
      const result = subscribeBusSchema.safeParse({ busId: validId });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.busId).toBe(validId);
      }
    });

    it('should reject missing busId', () => {
      const result = subscribeBusSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid busId format', () => {
      const result = subscribeBusSchema.safeParse({ busId: 'not-an-object-id' });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace around valid busId', () => {
      const result = subscribeBusSchema.safeParse({ busId: `  ${validId}  ` });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.busId).toBe(validId);
      }
    });
  });

  describe('subscribeRouteSchema', () => {
    it('should accept a valid routeId payload', () => {
      const result = subscribeRouteSchema.safeParse({ routeId: validId });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.routeId).toBe(validId);
      }
    });

    it('should reject missing routeId', () => {
      const result = subscribeRouteSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid routeId format', () => {
      const result = subscribeRouteSchema.safeParse({ routeId: 'invalid-route-id' });
      expect(result.success).toBe(false);
    });
  });

  describe('unsubscribeBusSchema & unsubscribeRouteSchema', () => {
    it('should validate unsubscribeBusSchema', () => {
      expect(unsubscribeBusSchema.safeParse({ busId: validId }).success).toBe(true);
      expect(unsubscribeBusSchema.safeParse({ busId: 'bad' }).success).toBe(false);
    });

    it('should validate unsubscribeRouteSchema', () => {
      expect(unsubscribeRouteSchema.safeParse({ routeId: validId }).success).toBe(true);
      expect(unsubscribeRouteSchema.safeParse({ routeId: 'bad' }).success).toBe(false);
    });
  });
});
