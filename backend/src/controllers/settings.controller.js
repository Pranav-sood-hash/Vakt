const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: req.user.id } });
    }
    return successResponse(res, settings);
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...req.body },
      update: req.body
    });
    return successResponse(res, settings, 'Settings updated');
  } catch (error) { next(error); }
};

exports.resetSettings = async (req, res, next) => {
  try {
    // Delete existing settings
    await prisma.userSettings.deleteMany({ where: { userId: req.user.id } });
    // Create fresh defaults
    const settings = await prisma.userSettings.create({ data: { userId: req.user.id } });
    return successResponse(res, settings, 'Settings reset to defaults');
  } catch (error) { next(error); }
};
