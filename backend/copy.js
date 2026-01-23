import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function connectDb(uri, dbName) {
    const client = new MongoClient(uri);
    await client.connect();
    return { db: client.db(dbName), client };
}

async function copyDb() {
    // Connect to production DB (Atlas)
    const { db: prodDb, client: prodClient } = await connectDb(process.env.MONGODB_URL, 'vteam7');

    // Connect to test DB (Local Mongo)
    const { db: testDb, client: testClient } = await connectDb('mongodb://localhost:27017', 'vteam7_test');

    const collections = await prodDb.listCollections().toArray();

    for (const col of collections) {
        const data = await prodDb.collection(col.name).find({}).toArray();
        await testDb.collection(col.name).deleteMany({});
        if (data.length > 0) await testDb.collection(col.name).insertMany(data);
        console.log(`Copied collection "${col.name}" (${data.length} documents)`);
    }

    console.log('✅ All collections copied from vteam7 → local vteam7_test');

    // Close Mongo connections
    await prodClient.close();
    await testClient.close();
}

// Run script
copyDb().catch(err => {
    console.error(' Failed to copy DB:', err);
    process.exit(1);
});
