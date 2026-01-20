export function inStationZone(x, y, stationZone) {
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