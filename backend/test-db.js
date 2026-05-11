const prisma = require('./src/prisma');

const test = async () => {
    try {
        console.log('Attempting to connect to SQLite via Prisma...');
        await prisma.$connect();
        console.log('SUCCESS: Connected to SQLite Database');
        
        const userCount = await prisma.user.count();
        console.log(`Current user count: ${userCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
};

test();
