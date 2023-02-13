import { RoomId, UserId } from "./roomRepository";
import { JsMap, WS } from "./utils";

const roomUserWsMap: JsMap<RoomId, JsMap<UserId, WS>> = {};

const addUser = (roomId: RoomId, userId: UserId, ws: WS): void => {
    roomUserWsMap[roomId] = roomUserWsMap[roomId] || {};
    roomUserWsMap[roomId][userId] = ws;
}

const removeUser = (roomId: RoomId, userId: UserId): void => { delete roomUserWsMap[roomId][userId] };

// const getUsersByRoom = (roomId: RoomId): JsMap<UserId, WS> => { return { ...roomUserWsMap[roomId] } };

// const removeRoom = (id: RoomId): void => { delete roomUserWsMap[id] };

export const RoomUserWsMapApi = {
    addUser,
    removeUser
}
