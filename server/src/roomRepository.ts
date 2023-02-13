import { JsMap, utils } from "./utils"

export type RoomId = string;
export type UserId = string;

export interface Vote {
    userId: UserId
    userName: string
    cardValue?: number
    rotateAngle?: number
}

export interface Room {
    id: RoomId
    createdDate: number
    showCards: boolean
    votes: JsMap<UserId, Vote>
}

const ROOM_DB: JsMap<RoomId, Room> = {};

const getRoom = (id: RoomId): Room => {
    const room = ROOM_DB[id];
    if (!room) { throw new Error(`Illegal ROOM_DB state: can't find roomId ${id}`); }
    return utils.deepCopy(room);
}

const _saveRoom = (room: Room): void => {
    console.debug(`Room (${room.id}) was changed, new value: ${JSON.stringify(room)}`);
    ROOM_DB[room.id] = room;
}

const isRoomExist = (id: RoomId): boolean => !!ROOM_DB[id];

const createRoom = (id: RoomId): void => _saveRoom({ id, createdDate: utils.now(), showCards: false, votes: {} });

const vote = (roomId: RoomId, userId: UserId, cardValue: number, rotateAngle: number): void => {
    const room: Room = getRoom(roomId);
    const vote = room.votes[userId];
    if (!vote) { throw new Error(`Illegal ROOM_DB state: can't find vote for userId (${userId}) for roomId (${roomId})`); }
    vote.cardValue = cardValue;
    vote.rotateAngle = rotateAngle;
    _saveRoom(room);
}

const addUser = (roomId: RoomId, userId: UserId, userName: string): void => {
    const room: Room = getRoom(roomId);
    room.votes[userId] = { userId, userName };
    _saveRoom(room);
}

const removeUser = (roomId: RoomId, userId: UserId): void => {
    const room: Room = getRoom(roomId);
    delete room.votes[userId];
    _saveRoom(room);
}

const getRoomIdsOlderThenDate = (filterDate: number): RoomId[] => {
    return Object.values(ROOM_DB)
        .filter((room: Room) => room.createdDate < filterDate)
        .map((room: Room) => room.id);
}

const setShowCards = (id: RoomId, showCards: boolean): void => {
    const room = getRoom(id)
    room.showCards = showCards;
    _saveRoom(room);
}

const clearCards = (id: RoomId): void => {
    const room = getRoom(id);
    Object.values(room.votes).forEach(vote => {
        vote.cardValue = undefined;
        vote.rotateAngle = undefined;
    });
    _saveRoom(room);
}

const removeRoom = (id: RoomId): void => {
    console.debug(`Room (${id}) was deleted`);
    delete ROOM_DB[id];
}

export const ROOM_DB_API = {
    getRoom,
    isRoomExist,
    createRoom,
    removeRoom,
    vote,
    addUser,
    removeUser,
    getRoomIdsOlderThenDate,
    setShowCards,
    clearCards
};
