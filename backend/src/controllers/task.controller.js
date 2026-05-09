const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');

const XP_MAP = { High: 1, Medium: 1, Low: 1 };

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDateTime: 'asc' }
    });
    return successResponse(res, tasks);
  } catch (error) { next(error); }
};

exports.createTask = async (req, res, next) => {
  try {
    const { name, description, priority, dueDateTime } = req.body;
    if (!name || !dueDateTime) return errorResponse(res, 'VALIDATION_ERROR', 'name and dueDateTime required', 400);

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        name,
        description: description || '',
        priority: priority || 'Medium',
        dueDateTime: new Date(dueDateTime)
      }
    });
    return successResponse(res, task, 'Task created', 201);
  } catch (error) { next(error); }
};

exports.updateTask = async (req, res, next) => {
  try {
    // Check task exists and belongs to user
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body
    });
    return successResponse(res, task);
  } catch (error) { next(error); }
};

exports.completeTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!task) return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);

    const wasCompleted = task.status === 'COMPLETED';
    const xp = 1; // Award exactly 1 point as requested

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: wasCompleted ? 'PENDING' : 'COMPLETED',
        completedAt: wasCompleted ? null : new Date(),
        xpAwarded: wasCompleted ? 0 : xp
      }
    });

    // Update points — upsert to handle missing record
    await prisma.userPoints.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        totalXP: wasCompleted ? 0 : xp,
        tasksCompleted: wasCompleted ? 0 : 1
      },
      update: {
        totalXP: { increment: wasCompleted ? -xp : xp },
        tasksCompleted: { increment: wasCompleted ? -1 : 1 }
      }
    });

    if (!wasCompleted) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          type: 'TASK_COMPLETE',
          title: `Completed task: ${task.name}`,
          detail: task.name,
          xpDelta: xp
        }
      });
    }

    return successResponse(res, updatedTask);
  } catch (error) { next(error); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);

    await prisma.task.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Task deleted');
  } catch (error) { next(error); }
};
