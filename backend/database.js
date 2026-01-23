import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { inStationZone } from './middleware/inZone.js';


let _client;
let _db;

// In-memory (minne) för aktiva rides så vi kan simulera rörelse/batteri
export const mem = {
  rides: new Map(), // rideId -> ride
};

function dbNameFromUri(uri) {
  try {
    const u = new URL(uri);
    const name = (u.pathname || '').replace('/', '').trim();
    return name || null;
  } catch {
    return null;
  }
}

export async function connectDb() {
  if (_db) return _db;

  //Ändrade till för köra npm start (MONGODB_URL (användes förut)), annars DATABASE_URL
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error('DATABASE_URL is not configured');

  _client = new MongoClient(uri);
  await _client.connect();

  const name = dbNameFromUri(uri) || process.env.DB_NAME || 'elsparkcyklar';
  _db = _client.db(name);

  return _db;
}

//För att köra tester
export async function connectDbTest() {
  if (_db) return _db;

  const uri = process.env.MONGODB_URL_TEST;
  if (!uri) throw new Error('Missing MongoDB URI (set MONGODB_URI or MONGODB_URL).');

  _client = new MongoClient(uri);
  await _client.connect();

  const dbName = process.env.MONGODB_DB_TEST || undefined;
  _db = dbName ? _client.db(dbName) : _client.db();

  return _db;
}


export function getDb() {
  if (!_db) {
    throw new Error('DB not connected (call connectDb() during startup)');
  }
  return _db;
}

export async function closeDb() {
  if (_client) await _client.close();
  _client = undefined;
  _db = undefined;
}

// --- Lösenordshjälp (saltet + hash) utan extra bibliotek ---
export function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}
export function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), String(salt), 64).toString('hex');
}
export function verifyPassword(password, salt, hashHex) {
  const got = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(String(hashHex), 'hex');
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(got, expected);
}

// --- Prisregler för resa (startavgift + per minut) ---
export const PRICING = { startFee: 5, perMinute: 2, minChargeMinutes: 1 };

export function nowIso() {
  return new Date().toISOString();
}

export function computeRidePrice(ride, at = Date.now()) {
  const start = new Date(ride.start_time).getTime();
  const end = ride.end_time ? new Date(ride.end_time).getTime() : at;
  const minutes = Math.max(PRICING.minChargeMinutes, Math.ceil((end - start) / 60000));
  return PRICING.startFee + minutes * PRICING.perMinute;
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function jitter(delta) {
  return (Math.random() - 0.5) * delta;
}

// Canonical scooter-schema (det frontend förväntar sig):
// { id, status, batteryLevel, location:{lat,lng}, city }
export async function migrateScootersToCanonicalSchema() {
  const db = getDb();
  if (!db) return { ok: false, reason: 'no-db' };

  const col = db.collection('scooters');
  const cursor = col.find({});
  let migrated = 0;

  for await (const doc of cursor) {
    const hasCanonical =
      typeof doc?.id === 'string' &&
      typeof doc?.batteryLevel === 'number' &&
      doc?.location &&
      typeof doc.location.lat === 'number' &&
      typeof doc.location.lng === 'number';

    if (hasCanonical) continue;

    const id = String(doc?.id ?? doc?.name ?? doc?._id ?? '');
    const batteryLevel = Number(doc?.batteryLevel ?? doc?.battery ?? 0);

    const pos = Array.isArray(doc?.position) ? doc.position : null;
    const locObj = doc?.location && typeof doc.location === 'object' ? doc.location : null;

    const lat = locObj ? Number(locObj.lat) : pos ? Number(pos[0]) : 59.3293;
    const lng = locObj ? Number(locObj.lng) : pos ? Number(pos[1]) : 18.0686;

    const statusRaw = String(doc?.status ?? 'Off');
    const status = statusRaw === 'Maintance' ? 'Maintenance' : statusRaw;

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          id,
          status,
          batteryLevel: Number.isFinite(batteryLevel) ? batteryLevel : 0,
          location: { lat: Number.isFinite(lat) ? lat : 59.3293, lng: Number.isFinite(lng) ? lng : 18.0686 },
          city: String(doc?.city ?? 'Stockholm'),
          updatedAt: new Date(),
        },
        // Remove old schema fields so you truly have ONE schema
        $unset: { name: '', position: '', battery: '' },
      }
    );

    migrated++;
  }

  return { ok: true, migrated };
}

// Ser till att det finns minst X scooters i databasen (skapar bara "saknade")
export async function ensureScooters(minCount = 0) {
  const db = getDb();
  if (!db) return { ok: false, reason: 'no-db' };

  // Only seed scooters if explicitly enabled via env (>0) OR explicit minCount (>0).
  const envTargetRaw = process.env.SEED_SCOOTERS;
  const envTarget = Number.isFinite(Number(envTargetRaw)) ? Math.max(0, Number(envTargetRaw)) : 0;

  // Prefer explicit arg if passed, otherwise env. Default is 0 => do not seed.
  const target = Number.isFinite(Number(minCount)) ? Math.max(0, Number(minCount)) : 0;
  const finalTarget = target > 0 ? target : envTarget;

  if (finalTarget <= 0) {
    return { ok: true, seeded: 0, total: await db.collection('scooters').countDocuments(), target: finalTarget };
  }

  const col = db.collection('scooters');
  const count = await col.countDocuments();
  if (count >= finalTarget) return { ok: true, seeded: 0, total: count, target: finalTarget };

  const missing = finalTarget - count;
  const CENTER = { lat: 59.3293, lng: 18.0686 };
  const now = new Date();

  const docs = Array.from({ length: missing }, (_, i) => {
    const n = count + i + 1;
    return {
      id: `SCOOT-${String(n).padStart(4, '0')}`,
      status: 'Available',
      batteryLevel: 100,
      city: 'Stockholm',
      location: { lat: CENTER.lat + jitter(0.06), lng: CENTER.lng + jitter(0.1) },
      createdAt: now,
      updatedAt: now,
    };
  });

  const res = await col.insertMany(docs, { ordered: false });
  return { ok: true, seeded: res.insertedCount, total: count + res.insertedCount, target };
}

// Skapar/uppdaterar admin-användaren från .env (så admin-login fungerar efter env-ändring)
export async function ensureAdminUser() {
  const db = getDb();
  if (!db) return { ok: false, reason: 'no-db' };

  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  await users.createIndex({ id: 1 }, { unique: true }).catch(() => {});

  const email = process.env.ADMIN_EMAIL || 'admin@login.com';
  const pw = process.env.ADMIN_PASSWORD || 'adminvteam7';
  const salt = makeSalt();
  const passwordHash = hashPassword(pw, salt);

  await users.updateOne(
    { id: 'u_admin' },
    {
      $set: {
        id: 'u_admin',
        name: 'Admin',
        email,
        role: 'admin',
        wallet: 1000,
        enabled: true,
        passwordSalt: salt,
        passwordHash,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return { ok: true };
}





//Skapar Städer och stationer

export async function makingCities() {
  const db = getDb();
  if (!db) return { ok: false, reason: 'Databas inte kopplad' };

  const col = db.collection('city');

  //Undviker dubbletter
  await col.createIndex({ namn: 1 }, { unique: true });

  const cities = [
    {
      namn: 'Stockholm',
      position: '59.3293, 18.0686',
    },
    {
      namn: 'Göteborg',
      position: '57.7089, 11.9746',
    },
    {
      namn: 'Malmö',
      position: '55.6050, 13.0038',
    },
  ];

  for (const city of cities) {
    await col.updateOne(
      { namn: city.namn },
      {
        $set: city,
      },
      { upsert: true }
    );
  }

  return { ok: true };
}






export async function makingParkingStation() {
  const db = getDb();
  const col = db.collection('parkeringStation');

  //Hämtar städer för att ge deras id till stationerna
  const city = db.collection('city');

  // Hämta alla städer
  const stockholm = await city.findOne({ namn: 'Stockholm' });
  const göteborg = await city.findOne({ namn: 'Göteborg' });
  const malmö = await city.findOne({ namn: 'Malmö' });


const stations = [
    // Stockholm
    {
      _id: new ObjectId(),
      name: 'Stockholm Parking North',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.33, 18.06],
        position_2: [59.33, 18.065],
        position_3: [59.335, 18.065],
        position_4: [59.335, 18.06],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Stockholm Parking East',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.33, 18.07],
        position_2: [59.33, 18.075],
        position_3: [59.335, 18.075],
        position_4: [59.335, 18.07],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Stockholm Parking South',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.315, 18.07],
        position_2: [59.315, 18.075],
        position_3: [59.32, 18.075],
        position_4: [59.32, 18.07],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Stockholm Parking West',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.315, 18.06],
        position_2: [59.315, 18.065],
        position_3: [59.32, 18.065],
        position_4: [59.32, 18.06],
      },
      elsparkcyklar: [],
    },

    // Göteborg
    {
      _id: new ObjectId(),
      name: 'Göteborg Parking North',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.71, 11.95],
        position_2: [57.71, 11.955],
        position_3: [57.715, 11.955],
        position_4: [57.715, 11.95],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Göteborg Parking East',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.71, 11.96],
        position_2: [57.71, 11.965],
        position_3: [57.715, 11.965],
        position_4: [57.715, 11.96],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Göteborg Parking South',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.705, 11.96],
        position_2: [57.705, 11.965],
        position_3: [57.71, 11.965],
        position_4: [57.71, 11.96],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Göteborg Parking West',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.705, 11.95],
        position_2: [57.705, 11.955],
        position_3: [57.71, 11.955],
        position_4: [57.71, 11.95],
      },
      elsparkcyklar: [],
    },

    // Malmö
    {
      _id: new ObjectId(),
      name: 'Malmö Parking North',
      stad_id: malmö._id,
      zone: {
        position_1: [55.605, 13.0],
        position_2: [55.605, 13.005],
        position_3: [55.61, 13.005],
        position_4: [55.61, 13.0],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Malmö Parking East',
      stad_id: malmö._id,
      zone: {
        position_1: [55.605, 13.005],
        position_2: [55.605, 13.01],
        position_3: [55.61, 13.01],
        position_4: [55.61, 13.005],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Malmö Parking South',
      stad_id: malmö._id,
      zone: {
        position_1: [55.6, 13.0],
        position_2: [55.6, 13.005],
        position_3: [55.605, 13.005],
        position_4: [55.605, 13.0],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Malmö Parking West',
      stad_id: malmö._id,
      zone: {
        position_1: [55.6, 12.995],
        position_2: [55.6, 13.0],
        position_3: [55.605, 13.0],
        position_4: [55.605, 12.995],
      },
      elsparkcyklar: [],
    },
  ];

  for (const station of stations) {
    await col.updateOne(
      { name: station.name, stad_id: station.stad_id },
      { $setOnInsert: station },
      { upsert: true }
    );
  }

  return { ok: true, count: stations.length };
}


//Laddnings Stationer skapas

export async function makingChargingStations() {
  const db = getDb();
  const col = db.collection('laddningStation');

  //Hämtar städer för att ge id
  const city = db.collection('city');

  // Hämta alla städer
  const stockholm = await city.findOne({ namn: 'Stockholm' });
  const göteborg = await city.findOne({ namn: 'Göteborg' });
  const malmö = await city.findOne({ namn: 'Malmö' });

  const stations = [
    //Stockholm laddning station
    {
      _id: new ObjectId(),
      name: 'Stockholm Charging North',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.34, 18.06],
        position_2: [59.34, 18.065],
        position_3: [59.345, 18.065],
        position_4: [59.345, 18.06],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Stockholm Charging South',
      stad_id: stockholm._id,
      zone: {
        position_1: [59.31, 18.06],
        position_2: [59.31, 18.065],
        position_3: [59.315, 18.065],
        position_4: [59.315, 18.06],
      },
      elsparkcyklar: [],
    },

    //Göteborg laddning station
    {
      _id: new ObjectId(),
      name: 'Göteborg Charging North',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.72, 11.95],
        position_2: [57.72, 11.955],
        position_3: [57.725, 11.955],
        position_4: [57.725, 11.95],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Göteborg Charging South',
      stad_id: göteborg._id,
      zone: {
        position_1: [57.705, 11.95],
        position_2: [57.705, 11.955],
        position_3: [57.71, 11.955],
        position_4: [57.71, 11.95],
      },
      elsparkcyklar: [],
    },

    //Malmö laddning station
    {
      _id: new ObjectId(),
      name: 'Malmö Charging North',
      stad_id: malmö._id,
      zone: {
        position_1: [55.61, 13.0],
        position_2: [55.61, 13.005],
        position_3: [55.615, 13.005],
        position_4: [55.615, 13.0],
      },
      elsparkcyklar: [],
    },
    {
      _id: new ObjectId(),
      name: 'Malmö Charging South',
      stad_id: malmö._id,
      zone: {
        position_1: [55.595, 13.0],
        position_2: [55.595, 13.005],
        position_3: [55.6, 13.005],
        position_4: [55.6, 13.0],
      },
      elsparkcyklar: [],
    },
  ];

  for (const station of stations) {
    await col.updateOne(
      { name: station.name, stad_id: station.stad_id },
      { $setOnInsert: station },
      { upsert: true }
    );
  }

  return { ok: true, count: stations.length };
}



// DEN MÅSTE FIXAS , (DEN FUNKADE FÖRUT MEN DEN MÅSTE VARA VID SIMULATION TROR JAG------------)

export async function autoScooterStation() {
  const db = getDb();
  const scooters = await db.collection('scooters').find({}).toArray();
  const cities = await db.collection('city').find({}).toArray();

  for (const city of cities) {
    // Hämta alla stationer i staden
    const laddStation = await db.collection('laddningStation').find({ stad_id: city._id }).toArray();
    const parkeringStation = await db.collection('parkeringStation').find({ stad_id: city._id }).toArray();
    const allaStationer = [...laddStation, ...parkeringStation];

    // Loop över alla scooters i staden
    const cityScooters = scooters.filter(s => s.city === city.namn);

    for (const scooter of cityScooters) {
      const scooterX = scooter.location.lat;
      const scooterY = scooter.location.lng;

      let stationFound = null;
      for (const station of allaStationer) {
        if (inStationZone(scooterX, scooterY, station.zone)) {
          stationFound = station;
          break;
        }
      }

      if (stationFound) {
        let collectionName;

        //Kollar vilken station det är, för att veta vilken collection ska användas
        //Gör även allt lowercase för att det ska bli mer säkert (alltså inte bokstav storlek skapar problem)
        if (stationFound.name.toLowerCase().includes('charging')) {
            collectionName = 'laddningStation';
        } else if (stationFound.name.toLowerCase().includes('parking')){
            collectionName = 'parkeringStation';
        } else {
          console.log("Error with station name (unlikely)");
        }

        await db.collection(collectionName).updateOne(
          { _id: stationFound._id },
          { $addToSet: { elsparkcyklar: scooter.id } }
        );
      }
    }
  }

  return { ok: true };
}








// Start-seed: admin + scooters + ev. migrering
export async function seedBootstrap() {
  await ensureAdminUser();
  await migrateScootersToCanonicalSchema();


  //Städer
  await makingCities();

  //Stationer,
  await makingParkingStation();
  await makingChargingStations();


  // IMPORTANT: do NOT auto-seed scooters unless SEED_SCOOTERS > 0 (or ensureScooters called with >0)
  await ensureScooters(0);

  //DEN MÅSTE FIXAS---------------------------------------
  //Sorterar så cyklarna som är i en station hamnar där (när de startas, annars hanterar routsen det när man parkerar)
  //await autoScooterStation();

}

// Simulering: flytta scooter + dra batteri för aktiva rides
export async function tickSimulation() {
  const db = getDb();
  if (!db) return;

  const scooters = db.collection('scooters');

  for (const ride of mem.rides.values()) {
    if (ride.status !== 'active') continue;

    const s = await scooters.findOne({ id: ride.scooterId });
    if (!s) continue;

    const lat0 = Number(s.location?.lat ?? 59.3293);
    const lng0 = Number(s.location?.lng ?? 18.0686);

    const lat = clamp(lat0 + jitter(0.0012), -85, 85);
    const lng = clamp(lng0 + jitter(0.002), -180, 180);

    const b0 = Number(s.batteryLevel ?? 0);
    const batteryLevel = clamp(b0 - 0.3, 0, 100);

    const status = batteryLevel <= 0.1 ? 'Maintenance' : 'InUse';

    await scooters.updateOne(
      { id: ride.scooterId },
      { $set: { location: { lat, lng }, batteryLevel, status, updatedAt: new Date() } }
    );

    if (batteryLevel <= 0.1) {
      ride.status = 'ended';
      ride.end_time = nowIso();
      ride.price = computeRidePrice(ride);
    } else {
      ride.price = computeRidePrice(ride);
    }
  }
}
