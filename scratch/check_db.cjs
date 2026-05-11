const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPoints() {
  const points = await prisma.userPoints.findMany();
  console.log('Points in DB:', JSON.stringify(points, null, 2));
  const activity = await prisma.activityLog.findMany({ take: 5 });
  console.log('Recent Activity:', JSON.stringify(activity, null, 2));
  await prisma.$disconnect();
}

checkPoints();
