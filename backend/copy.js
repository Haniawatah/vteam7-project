import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function connectDb(uri, dbName) {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db(dbName);
}

async function copyDb() {
    // Connect to production DB (Atlas)
    const prodDb = await connectDb(process.env.MONGODB_URL, 'vteam7');

    // Connect to test DB (Local Mongo)
    const testDb = await connectDb('mongodb://localhost:27017/vteam7_test', 'vteam7_test');

    // Get all collections from production
    const collections = await prodDb.listCollections().toArray();

    for (const col of collections) {
        const data = await prodDb.collection(col.name).find({}).toArray();

        // Replace collection in local test DB
        await testDb.collection(col.name).deleteMany({}); // clear test collection
        if (data.length > 0) {
            await testDb.collection(col.name).insertMany(data); // copy documents
        }

        console.log(`Copied collection "${col.name}" (${data.length} documents)`);
    }

    console.log('✅ All collections copied from vteam7 → local vteam7_test');
}

// Run script
copyDb().catch(err => {
    console.error('Failed to copy DB:', err);
});