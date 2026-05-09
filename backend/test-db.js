const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const test = async () => {
    try {
        console.log('Attempting to connect to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('SUCCESS: Connected to MongoDB Atlas');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
};

test();
