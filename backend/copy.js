import { MongoClient } from 'mongodb';
import 'dotenv/config';



let _dbProd, _dbTest;

async function connectDb(uri, dbName) {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db(dbName);
}

async function copyDb() {
    // Connect to production DB
    const prodDb = await connectDb(process.env.MONGODB_URL, 'vteam7');

    // Connect to test DB
    const testDb = await connectDb(process.env.MONGODB_URL_TEST, 'vteam7_test');

    // Get all collections from production
    const collections = await prodDb.listCollections().toArray();

    for (const col of collections) {
        const data = await prodDb.collection(col.name).find({}).toArray();

        // Replace collection in test DB only
        await testDb.collection(col.name).deleteMany({}); // clear test collection
        if (data.length > 0) {
            await testDb.collection(col.name).insertMany(data); // copy documents
        }

        console.log(`Copied collection "${col.name}" (${data.length} documents)`);
    }

    console.log('✅ All collections copied from vteam7 → vteam7_test');
}

copyDb();

