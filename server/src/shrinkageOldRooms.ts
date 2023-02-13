import { RoomId, ROOM_DB_API } from "./roomRepository";
import { RoomUserWsMapApi } from "./roomUserWsMap";
import { utils } from "./utils";

const shrinkageOldRooms = (): void => {
    const ROOM_LIVE_TIMEOUT = 8 * 60 * 60 * 1000; //8h
    const oldDate = utils.now() - ROOM_LIVE_TIMEOUT;
    const roomIds: RoomId[] = ROOM_DB_API.getRoomIdsOlderThenDate(oldDate);
    console.log("Found old rooms: " + roomIds.join(", "));
    roomIds.forEach(id => {
        console.log(`Remove old room (${id})`);
        ROOM_DB_API.removeRoom(id);
        Object.values(RoomUserWsMapApi.getUsersByRoom(id)).forEach(ws => ws.close());
        RoomUserWsMapApi.removeRoom(id);
    });
}
export const startShrinkageOldRooms = (): void => {
    const SHRINKAGE_OLD_ROOMS_PERIOD = 8 * 60 * 60 * 1000; //8h
    console.log(`Start shrinkage old rooms with period = ${SHRINKAGE_OLD_ROOMS_PERIOD}`);
    setInterval(() => shrinkageOldRooms(), SHRINKAGE_OLD_ROOMS_PERIOD);
    shrinkageOldRooms();
}