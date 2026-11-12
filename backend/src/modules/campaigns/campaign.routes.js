const express = require('express');
const router = express.Router();
const campaignController = require('./campaign.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const { createCampaignSchema, listCampaignsQuerySchema } = require('./campaign.validation');

router.use(authenticate);

router.get(
  '/',
  requirePermissions(PERMISSIONS.CAMPAIGNS_READ),
  validate(listCampaignsQuerySchema),
  campaignController.getCampaigns
);

router.post(
  '/',
  requirePermissions(PERMISSIONS.CAMPAIGNS_CREATE),
  validate(createCampaignSchema),
  campaignController.createCampaign
);

router.get(
  '/:id',
  requirePermissions(PERMISSIONS.CAMPAIGNS_READ),
  campaignController.getCampaignById
);

router.post(
  '/:id/audience',
  requirePermissions(PERMISSIONS.CAMPAIGNS_CREATE),
  campaignController.buildAudience
);

router.post(
  '/:id/send',
  requirePermissions(PERMISSIONS.CAMPAIGNS_SEND),
  campaignController.sendCampaign
);

module.exports = router;

