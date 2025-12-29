import database, { ObjectId } from '../database.js';

const elsparkcyklar = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.elsparkcyklar.find().toArray();
        } catch (e) {
            console.error(e);

            return [];
        } finally {
            await db.client.close();
        }
    },

    getOne: async function getOne(id) {
        let db = await database.getDb();
        try {
            return await db.collections.elsparkcyklar.findOne({_id: new ObjectId(id)});
        } catch (e) {
            console.error(e);

            return {};
        } finally {
            await db.client.close();
        }
    },

    addOne: async function addOne(body) {
        let db = await database.getDb();

        try {
            return await db.collections.elsparkcyklar.insertOne({
                title: body.title,
                content: body.content,
                allowed_users: body.allowed_users || []
            });
        } catch (e) {
            console.error(e);
        } finally {
            db.client.close();
        }
    },

    update: async function update(body) {
        let db = await database.getDb();

        console.log(body.content);

        try {
            return await db.collections.elsparkcyklar.updateOne({_id: new ObjectId(body.id)},
            { $set: { 
                title: body.title, 
                content: body.content,
                allowed_users: body.allowed_users
            } });
        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    },

    getByUser: async function getByUser(email) {
    let db = await database.getDb();
    try {
        return await db.collections.elsparkcyklar.find({ allowed_users: email }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    } finally {
        await db.client.close();
    }
}

};

export default elsparkcyklar;

export function toScooterDto(doc) {
  return {
    id: String(doc._id),
    model: doc.model || "Standard",
    status: doc.status || "available",
    latitude: typeof doc.latitude === "number" ? doc.latitude : undefined,
    longitude: typeof doc.longitude === "number" ? doc.longitude : undefined,
    location: doc.location || undefined,
    batteryLevel: typeof doc.batteryLevel === "number" ? doc.batteryLevel : undefined,
  };
}

export async function listScooters(db) {
  const docs = await db.collection("scooters").find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toScooterDto);
}

export async function getScooter(db, id) {
  const doc = await db.collection("scooters").findOne({ _id: new ObjectId(id) });
  return doc ? toScooterDto(doc) : null;
}

export async function createScooter(db, data) {
  const now = new Date();
  const doc = {
    model: data?.model || "Standard",
    status: data?.status || "available",
    latitude: typeof data?.latitude === "number" ? data.latitude : undefined,
    longitude: typeof data?.longitude === "number" ? data.longitude : undefined,
    location: data?.location || undefined,
    batteryLevel: typeof data?.batteryLevel === "number" ? data.batteryLevel : 100,
    createdAt: now,
    updatedAt: now,
  };
  const res = await db.collection("scooters").insertOne(doc);
  return toScooterDto({ ...doc, _id: res.insertedId });
}

export async function updateScooter(db, id, data) {
  const _id = new ObjectId(id);
  await db.collection("scooters").updateOne(
    { _id },
    {
      $set: {
        ...(data?.model != null ? { model: data.model } : {}),
        ...(data?.status != null ? { status: data.status } : {}),
        ...(typeof data?.latitude === "number" ? { latitude: data.latitude } : {}),
        ...(typeof data?.longitude === "number" ? { longitude: data.longitude } : {}),
        ...(data?.location != null ? { location: data.location } : {}),
        ...(typeof data?.batteryLevel === "number" ? { batteryLevel: data.batteryLevel } : {}),
        updatedAt: new Date(),
      },
    }
  );
  return getScooter(db, id);
}

export async function deleteScooter(db, id) {
  const res = await db.collection("scooters").deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function setScooterStatus(db, id, status) {
  await db.collection("scooters").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
}
