import 'dotenv/config';

import { MongoClient, ServerApiVersion } from 'mongodb';

const database = {
    getDb: async function getDb () {
    let dsn = `mongodb+srv://tiae24_db_user:${process.env.DB_PASS}@cluster0.5s8wzba.mongodb.net/vteam?retryWrites=true&w=majority&appName=text-editor&tls=true`;


        //if (process.env.NODE_ENV === 'test') {
        //    dsn = "mongodb://localhost:27017/test";
        //    console.log("hejsan")
        //}

        const client = new MongoClient(dsn, {
            serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
        });
        const db = await client.db("vteam");

        return {
            client,
            collections: {
                users: db.collection("users"),
                elsparkcyklar: db.collection("elsparkcyklar"),
                insättningar: db.collection("insättningar"),
                laddnings_station: db.collection("laddnings-station"),
                parkering_station: db.collection("parkering-station"),
                städer: db.collection("städer"),
                åktur: db.collection("åktur")
            }
        };
    }
};

export default database;
