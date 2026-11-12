const campaignService = require('./campaign.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class CampaignController {
  createCampaign = asyncHandler(async (req, res) => {
    const campaign = await campaignService.createCampaign(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Campaign created successfully', { campaign });
  });

  getCampaigns = asyncHandler(async (req, res) => {
    const result = await campaignService.getCampaigns(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Campaigns retrieved successfully',
      { campaigns: result.campaigns },
      result.meta
    );
  });

  getCampaignById = asyncHandler(async (req, res) => {
    const campaign = await campaignService.getCampaignById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Campaign details retrieved', { campaign });
  });

  buildAudience = asyncHandler(async (req, res) => {
    const result = await campaignService.buildAudience(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Campaign audience generated', result);
  });

  sendCampaign = asyncHandler(async (req, res) => {
    const campaign = await campaignService.sendCampaign(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Campaign dispatched successfully', { campaign });
  });
}

module.exports = new CampaignController();

