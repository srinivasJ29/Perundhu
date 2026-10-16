import { z } from 'zod';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const subscribeBusSchema = z.object({
  busId: z
    .string({
      required_error: 'busId is required',
      invalid_type_error: 'busId must be a string'
    })
    .trim()
    .regex(OBJECT_ID_REGEX, {
      message: 'busId must be a 24-character hexadecimal ObjectId'
    })
});

export const unsubscribeBusSchema = subscribeBusSchema;

export const subscribeRouteSchema = z.object({
  routeId: z
    .string({
      required_error: 'routeId is required',
      invalid_type_error: 'routeId must be a string'
    })
    .trim()
    .regex(OBJECT_ID_REGEX, {
      message: 'routeId must be a 24-character hexadecimal ObjectId'
    })
});

export const unsubscribeRouteSchema = subscribeRouteSchema;

export function isValidObjectId(id: string): boolean {
  return OBJECT_ID_REGEX.test(id);
}
