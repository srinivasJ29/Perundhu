import { Router } from 'express';
import { districtController } from './district.controller';
import { validate } from '../../common/validation';
import {
  listDistrictsQuerySchema,
  districtIdParamSchema,
  districtBusStandsQuerySchema
} from './district.validation';

const router = Router();

router.get(
  '/districts',
  validate({ query: listDistrictsQuerySchema }),
  (req, res, next) => districtController.listDistricts(req, res, next)
);

router.get(
  '/districts/:districtId/bus-stands',
  validate({ params: districtIdParamSchema, query: districtBusStandsQuerySchema }),
  (req, res, next) => districtController.listBusStandsByDistrict(req, res, next)
);

export const districtRoutes = router;
