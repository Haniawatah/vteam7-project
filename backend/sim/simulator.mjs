/* Simulation client for Svenska Elsparkcyklar AB
 *
 * Goals:
 * - Handle/create ~1000 users + ~1000 scooters
 * - Start rides on available scooters
 * - Periodically update scooter GPS + battery for active rides
 * - Randomly end rides and "park" scooters
 * - Concurrency-limited so it stays stable under load
 *
 * No changes to payment/auth flows in the app—this is a standalone script.
 */

const env = process.env;

const SIM_API_URL = env.SIM_API_URL ?? 'http://localhost:3000/v1';
const SIM_USERS = num(env.SIM_USERS, 1000);
const SIM_SCOOTERS = num(env.SIM_SCOOTERS, 1000);
const SIM_ACTIVE_TARGET = num(env.SIM_ACTIVE_TARGET, 250);
const SIM_CONCURRENCY = num(env.SIM_CONCURRENCY, 50);
const SIM_TICK_MS = num(env.SIM_TICK_MS, 1500);
const SIM_LOG_EVERY_MS = num(env.SIM_LOG_EVERY_MS, 5000);
const SIM_USER_PASSWORD = env.SIM_USER_PASSWORD ?? 'Passw0rd!';

const SIM_ADMIN_EMAIL = env.SIM_ADMIN_EMAIL ?? 'Hani@gmail.com';
const SIM_ADMIN_PASSWORD = env.SIM_ADMIN_PASSWORD ?? '123';

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function http(method, path, { token, body, timeoutMs = 10_000, okStatuses } = {}) {
  const url = path.startsWith('http') ? path : `${SIM_API_URL}${path}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'x-access-token': token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
    });

    //Tester för när vi hade problem med hur cyklarnas skapades
    //if (method === 'POST' && path === '/scooters') {
      //let responseBody;
      //try {
        //responseBody = await res.json();
      //} catch {
        //responseBody = await res.text();
      //}
      //console.log('[SIM][DEBUG] POST /scooters response:', res.status, responseBody);
    //}

    const text = await res.text();

    //console.log(res, "---------------RES----------------w dwadawdadwadaw daw dadw")

    const data = text ? safeJson(text) : null;

    const allowed = okStatuses ?? [200, 201, 204];
    if (!allowed.includes(res.status)) {
      const msg = data?.message ?? data?.error ?? text ?? `HTTP ${res.status}`;
      const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}
function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }

function createLimiter(concurrency) {
  let active = 0;
  const q = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = q.shift();
    if (!job) return;
    active++;
    job().catch(() => {}).finally(() => { active--; next(); });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      q.push(async () => {
        try { resolve(await fn()); } catch (e) { reject(e); }
      });
      next();
    });
}
const limit = createLimiter(SIM_CONCURRENCY);

async function waitForBackend() {
  const deadline = Date.now() + 120_000; // 2 min
  while (Date.now() < deadline) {
    try {
      await http('GET', '/health', { okStatuses: [200] });
      console.log('[sim] backend is healthy');
      return;
    } catch {
      // ignore, retry
    }
    await sleep(1000);
  }
  throw new Error('backend not ready (healthcheck timeout)');
}

// API helpers (matchar din frontend: /v1/login, /v1/register, /v1/scooters, /v1/ride/...)
const apiLogin = (email, password) => http('POST', '/login', { body: { email, password }, okStatuses: [200, 201] });
const apiRegister = (email, password, name) => http('POST', '/register', { body: { email, password, name }, okStatuses: [200, 201] });
const apiGetScooters = (token) => http('GET', '/scooters', { token, okStatuses: [200] }); // eslint-disable-line no-unused-vars
const apiCreateScooter = (token, scooter) => http('POST', '/scooters', { token, body: scooter, okStatuses: [200, 201] });
const apiStartRide = (token, scooterId) => http('POST', `/ride/start/${encodeURIComponent(scooterId)}`, { token, okStatuses: [200, 201] });
const apiEndRide = (token, rideId, scooterId) =>
  http('POST', `/ride/end/${encodeURIComponent(rideId)}`, { token, body: { scooterId }, okStatuses: [200, 201] });

const apiAddMoney = (token, amount) =>
  http('PUT', '/user/wallet/add', { token, body: { amount }, okStatuses: [200] });


function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.scooters)) return payload.scooters;
  if (Array.isArray(payload?.data?.scooters)) return payload.data.scooters;
  return [];
}
const normId = (x) => String(x?.id ?? x?._id ?? '');

let adminToken = '';
const users = [];
let scooters = [];
const active = new Map(); // rideId -> { scooterId, userIdx }

async function ensureAdminToken() {
  if (!SIM_ADMIN_EMAIL || !SIM_ADMIN_PASSWORD) return '';
  try {
    const res = await apiLogin(SIM_ADMIN_EMAIL, SIM_ADMIN_PASSWORD);
    console.log(res, "_----------------------------------------------------------------------------------------")
    adminToken = res?.token ?? res?.data?.token ?? '';
    return adminToken;
  } catch {
    return '';
  }
}

async function ensureUsers() {
  const tasks = Array.from({ length: SIM_USERS }, (_, i) =>
    limit(async () => {
      // Start numbering from 1..SIM_USERS (so it's easier to verify)
      const n = i + 1;
      const email = `sim.user.${String(n).padStart(4, '0')}@example.com`;
      const name = `Sim User ${String(n).padStart(4, '0')}`;

      try {
        const reg = await apiRegister(email, SIM_USER_PASSWORD, name);
        const token = reg?.token ?? reg?.data?.token;
        return token ? { email, token } : null;
      } catch {
        try {
          const log = await apiLogin(email, SIM_USER_PASSWORD);
          const token = log?.token ?? log?.data?.token;
          return token ? { email, token } : null;
        } catch {
          return null;
        }
      }
    })
  );
  const res = (await Promise.all(tasks)).filter(Boolean);
  users.splice(0, users.length, ...res);
  console.log(`[sim] users ready: ${users.length}/${SIM_USERS}`);
}


// Replace the simple apiGetScooters() usage with paginated "fetch all" to get a real count.
async function apiGetScootersPage(token, { limit = 250, page = 1 } = {}) {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('page', String(page));
  const raw = await http('GET', `/scooters?${qs.toString()}`, { token, okStatuses: [200] });
  return extractList(raw);
}

async function apiGetAllScooters(token, { pageSize = 250, maxPages = 200 } = {}) {
  const seen = new Map(); // id -> scooter
  for (let page = 1; page <= maxPages; page++) {
    let list = [];
    try {
      list = await apiGetScootersPage(token, { limit: pageSize, page });
    } catch (e) {
      // If backend doesn't support pagination params, fall back to a single call.
      if (e?.status === 400 || e?.status === 404) {
        const raw = await http('GET', `/scooters?limit=${encodeURIComponent(String(pageSize))}`, { token, okStatuses: [200] });
        list = extractList(raw);
        for (const s of list) {
          const id = normId(s);
          if (id && !seen.has(id)) seen.set(id, s);
        }
        break;
      }
      throw e;
    }

    for (const s of list) {
      const id = normId(s);
      if (id && !seen.has(id)) seen.set(id, s);
    }

    // stop when backend returns fewer than requested (end of pages)
    if (!Array.isArray(list) || list.length < pageSize) break;
  }
  return [...seen.values()];
}

async function ensureScooters() {
  // Always compute existing count using "fetch all" (handles default limit=50 pagination)
  console.log('[sim] checking existing scooters (fetch all pages)...');

  const pageSize = Math.min(250, Math.max(50, SIM_SCOOTERS)); // stable default
  const existingList = await apiGetAllScooters(adminToken || undefined, { pageSize });
  scooters = existingList.map((s) => ({ id: normId(s) })).filter((s) => s.id);

  const existingCount = scooters.length;
  const missing = Math.max(0, SIM_SCOOTERS - existingCount);

  console.log(`[sim] scooters existing=${existingCount} target=${SIM_SCOOTERS} missing=${missing}`);

  if (missing === 0) return;

  if (!adminToken) {
    console.log('[sim] no admin token -> cannot top up scooters to target.');
    return;
  }

  console.log(`[sim] creating ${missing} scooters to reach target...`);

  // City centers (used for distributing scooters across cities)
  const CITY_CENTERS = [
    { city: 'Stockholm', lat: 59.3293, lng: 18.0686 },
    { city: 'Göteborg', lat: 57.7089, lng: 11.9746 },
    { city: 'Malmö', lat: 55.6050, lng: 13.0038 },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Shuffle once per run (still evenly distributed, but city order varies per start)
  const CITY_ORDER = shuffle(CITY_CENTERS);

  function jitterAround(center, spreadDeg = 0.05) {
    const dLat = (Math.random() * 2 - 1) * spreadDeg;
    const dLng = (Math.random() * 2 - 1) * spreadDeg;
    return { lat: center.lat + dLat, lng: center.lng + dLng };
  }


  const creates = Array.from({ length: missing }, (_, i) =>
    limit(async () => {
      // n is 1-based scooter number for stable "SCOOT-0001.."
      const n = existingCount + i + 1;

      // Even split across the 3 cities (total stays SIM_SCOOTERS)
      const chosen = CITY_ORDER[(n - 1) % CITY_ORDER.length];
      const loc = jitterAround(chosen, 0.05);

      const body = {
        // Make the dashboard/map show 1..1000 clearly
        id: `SCOOT-${String(n).padStart(4, '0')}`,
        model: 'SIM',
        status: 'Available',
        batteryLevel: 100,
        city: chosen.city,
        location: { lat: loc.lat, lng: loc.lng },

        // optional tag (safe if backend ignores unknown fields)
        simTag: `sim-${String(n).padStart(4, '0')}`,
      };

      try {
        const created = await apiCreateScooter(adminToken, body);
        const id = normId(created) || normId(created?.data);
        return id ? { id } : null;
      } catch {
        return null;
      }
    })
  );

  const made = (await Promise.all(creates)).filter(Boolean);
  console.log(`[sim] created scooters ok=${made.length}/${missing}`);

  // Re-verify count after creation (again using "fetch all pages")
  const afterList = await apiGetAllScooters(adminToken || undefined, { pageSize });
  const afterCount = afterList.map((s) => normId(s)).filter(Boolean).length;
  console.log(`[sim] scooters after init: ${afterCount}/${SIM_SCOOTERS}`);

  try {
    await autoScooterStation();
    console.log('[sim] scooters assigned to stations');
  } catch (err) {
    console.error('[sim] failed to assign scooters to stations', err);
  }

  // Update in-memory cache
  scooters = afterList.map((s) => ({ id: normId(s) })).filter((s) => s.id);
}

async function startSomeRides() {
  const want = Math.max(0, Math.min(200, SIM_ACTIVE_TARGET - active.size));
  if (want === 0) return;

  console.log('[sim] starting ride attempt:', users.length, scooters.length);

  const starts = Array.from({ length: want }, () =>
    limit(async () => {
      const uIdx = Math.floor(Math.random() * users.length);
      const u = users[uIdx];
      const s = scooters[Math.floor(Math.random() * scooters.length)];

      if (!u?.token) console.log('[sim] skipped user', uIdx, u);
      if (!s?.id) console.log('[sim] skipped scooter', s);

      if (!u?.token || !s?.id) return;

      try {
        //Makes it so the user add 50kr to their account
        await apiAddMoney(u.token, 50)

        const ride = await apiStartRide(u.token, s.id);
        const rideId = normId(ride) || normId(ride?.data);
        if (rideId) active.set(rideId, { scooterId: s.id, userIdx: uIdx });
      } catch {
        // ignore conflicts/validation under load
      }
    })
  );

  await Promise.all(starts);
}

async function endSomeRides() {
  if (active.size === 0) return;
  const prob = 0.03 + Math.random() * 0.05;

  const ends = [];
  for (const [rideId, r] of active.entries()) {
    if (Math.random() > prob) continue;
    ends.push(
      limit(async () => {
        const u = users[r.userIdx];
        if (!u?.token) return;
        try { await apiEndRide(u.token, rideId, r.scooterId); } catch { /* ignore */ }
        active.delete(rideId);
      })
    );
  }
  await Promise.all(ends);
}




//FLYTTADE IN AUTO IN HÄR

export function inStationZone(x, y, stationZone) {
    console.log("X:  ", x, "Y:  ", y, "Station:  ", stationZone, "---------------------------------------------")
    if (!stationZone) return false;

    const p1 = stationZone.position_1;
    const p2 = stationZone.position_2;
    const p3 = stationZone.position_3;
    const p4 = stationZone.position_4;

    //Hittar max och min värderna eftersom vi behöver dem för att se om ett värde är i zonen
    const xMin = Math.min(p1[0], p2[0], p3[0], p4[0]);
    const xMax = Math.max(p1[0], p2[0], p3[0], p4[0]);

    const yMin = Math.min(p1[1], p2[1], p3[1], p4[1]);
    const yMax = Math.max(p1[1], p2[1], p3[1], p4[1]);


    //Kollar nu ifall våra x och y värden är inne i området
    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
        return true;
    }

    return false;
}


async function apiGetAllStations(cityId) {
  const allStations = await http('GET', `/parking/stations/get/${cityId}`, { token: adminToken, okStatuses: [200] });
  return extractList(allStations);
}


async function apiGetCities() {
  const city = await http('GET', `/cities`, { token: adminToken , okStatuses: [200]});
  return extractList(city);
}



// DEN MÅSTE FIXAS , (DEN FUNKADE FÖRUT MEN DEN MÅSTE VARA VID SIMULATION TROR JAG------------)

export async function autoScooterStation() {
  const scooters = await apiGetAllScooters(adminToken);
  const cities = await apiGetCities();

  for (const city of cities) {
    // Hämta alla stationer i staden
    const allaStationer = await apiGetAllStations(city._id);

    // Loop över alla scooters i staden
    const cityScooters = scooters.filter(s => s.city === city.city);

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
        let doing;

        //Kollar vilken station det är, för att veta vilken collection ska användas
        //Gör även allt lowercase för att det ska bli mer säkert (alltså inte bokstav storlek skapar problem)
        if (stationFound.name.toLowerCase().includes('charging')) {
            collectionName = 'charging';
            doing = 'charge'
        } else if (stationFound.name.toLowerCase().includes('parking')){
            collectionName = 'parking';
            doing = 'park'
        } else {
          console.log("Error with station name (unlikely)");
          continue;
        }
        try {
          await http(
            'POST',
            `/scooter/${encodeURIComponent(collectionName)}/${encodeURIComponent(doing)}`,
            {
              token: adminToken,
              body: { station: stationFound._id.toString() },
              okStatuses: [200],
            }
          );
        } catch (e) {
          console.log("[SIM] ERROR IN SORTING SCOOTERS TO STATIONS", e)
        }
      }
    }
  }

  return { ok: true };
}

//Måste göras för annars när vi stoppar simulationen kanske några cyklarna är inUse,
async function resetScooters() { // eslint-disable-line no-unused-vars
  await http('POST', `/admin/scooter/reset`, { token: adminToken , okStatuses: [200]});
  console.log('[sim] scooters reset:');
}



async function main() {
  console.log(`[sim] api=${SIM_API_URL} users=${SIM_USERS} scooters=${SIM_SCOOTERS} activeTarget=${SIM_ACTIVE_TARGET} conc=${SIM_CONCURRENCY}`);
  await waitForBackend();

  await ensureAdminToken();

  //await resetScooters();

  await ensureUsers();
  await ensureScooters();

  //await autoScooterStation();

  let lastLog = 0;
  let stop = false;
  process.on('SIGINT', () => (stop = true));
  process.on('SIGTERM', () => (stop = true));

  while (!stop) {
    const t0 = Date.now();
    await startSomeRides();
    await endSomeRides();

    const now = Date.now();
    if (now - lastLog > SIM_LOG_EVERY_MS) {
      lastLog = now;
      console.log(`[sim] activeRides=${active.size}`);
    }
    const spent = Date.now() - t0;
    await sleep(Math.max(0, SIM_TICK_MS - spent));
  }
}

main().catch((e) => {
  console.error('[sim] fatal:', e?.message ?? e);
  process.exitCode = 1;
});
