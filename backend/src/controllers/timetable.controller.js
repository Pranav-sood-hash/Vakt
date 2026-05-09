const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');

exports.getSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.user.id };

    if (date) {
      const d = new Date(date);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      filter.date = { gte: start, lte: end };
    }

    const slots = await prisma.timetableSlot.findMany({
      where: filter,
      orderBy: { start: 'asc' }
    });
    return successResponse(res, slots);
  } catch (error) { next(error); }
};

exports.createSlot = async (req, res, next) => {
  try {
    const { name, description, start, durationMin, priority, date } = req.body;
    if (!name || !start || !durationMin || !date) {
      return errorResponse(res, 'VALIDATION_ERROR', 'name, start, durationMin, and date required', 400);
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        userId: req.user.id,
        name,
        description: description || '',
        start,
        durationMin,
        priority: priority || 'Medium',
        date: new Date(date)
      }
    });

    // Also create a mirrored task
    const slotDate = new Date(date);
    const [h, m] = start.split(':');
    slotDate.setHours(parseInt(h), parseInt(m), 0, 0);

    await prisma.task.create({
      data: {
        userId: req.user.id,
        name,
        description: description || '',
        priority: priority || 'Medium',
        dueDateTime: slotDate
      }
    });

    // Award XP for adding a slot
    await prisma.userPoints.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, totalXP: 5 },
      update: { totalXP: { increment: 5 } }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        type: 'SLOT_ADDED',
        title: `Added timetable slot: ${name}`,
        xpDelta: 5
      }
    });

    return successResponse(res, slot, 'Slot created', 201);
  } catch (error) { next(error); }
};

exports.updateSlot = async (req, res, next) => {
  try {
    const existing = await prisma.timetableSlot.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Slot not found', 404);

    const slot = await prisma.timetableSlot.update({
      where: { id: req.params.id },
      data: req.body
    });
    return successResponse(res, slot);
  } catch (error) { next(error); }
};

exports.completeSlot = async (req, res, next) => {
  try {
    const slot = await prisma.timetableSlot.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!slot) return errorResponse(res, 'NOT_FOUND', 'Slot not found', 404);

    const updatedSlot = await prisma.timetableSlot.update({
      where: { id: slot.id },
      data: { status: slot.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' }
    });
    return successResponse(res, updatedSlot);
  } catch (error) { next(error); }
};

exports.deleteSlot = async (req, res, next) => {
  try {
    const existing = await prisma.timetableSlot.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Slot not found', 404);

    await prisma.timetableSlot.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Slot deleted');
  } catch (error) { next(error); }
};
