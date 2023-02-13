import {RoomId, UserId, ROOM_DB_API} from "./roomRepository";
import {RoomUserWsMapApi} from "./roomUserWsMap";
import {startShrinkageOldRooms} from "./shrinkageOldRooms";
import {JsMap, WS} from "./utils"
import {randomUUID} from "crypto";

// startShrinkageOldRooms();

const LAZY_REMOVE_TIMEOUT = 10;//sec;
const userLateRemoveTimers: any = {};

interface User {
    id: string;
    name: string;
    position: number;
}

interface Zombie {
    id: string
    type: "small" | "big"
    position: number; //0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

/*
      /-----\
   9 /\  2  /\ 6
    /  \---/  \
   | 5 | 1 | 3 |
    \  /---\  /
   8 \/  4  \/ 7
      \-----/
 */

interface Room {
    users: User[],
    zombies: Zombie[]
}

const ROOM: Room = {
    users: [],
    zombies: []
}

let intervalId: any = null;

export const createOrJoinRoom = (ws: WS, roomId: RoomId, userId: UserId, userName: string): void => {
    console.log(`Add user to room for user (${userName} : ${userId}) in room (${roomId}) was closed`);
    RoomUserWsMapApi.addUser(roomId, userId, ws);

    ROOM.users.push({id: "u_"+Math.random(), name: "qwe", position: 1});

    if (ROOM.users.length) {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            ROOM.zombies.push({id: "z_"+Math.random(), type: "small", position: Math.round(Math.random() * 10)});
            broadcastRoom(roomId);
        }, 1000);
    } else {
        clearInterval(intervalId)
    }

    ws.on("message", function (msg: string) {
        if (msg === "H") {
            console.log(`client H userId=${userId}`);
        } else if (msg === "clear") {
            ROOM.zombies = [];
        } else if (msg.startsWith("shoot=")) {
            const zId = msg.replace("shoot=", "");
            ROOM.zombies.filter(zombie => zombie.id != zId);
        } else {
            const msgVote = JSON.parse(msg);
            const rotateValue = (Math.round(Math.random() * 10) - 5) * 2; //degrees
            ROOM_DB_API.vote(roomId, userId, msgVote.vote.cardValue, rotateValue);
            openCardIfAllVotes(roomId);
        }
        broadcastRoom(roomId);
    });
    ws.on("close", function () {
        console.log(`WS for user (${userName} : ${userId}) in room (${roomId}) was closed`);
        RoomUserWsMapApi.removeUser(roomId, userId);
        ROOM.zombies.filter(users => users.id != userId);
        broadcastRoom(roomId);


    });
    ws.on("error", function (err: any) {
        console.error(`WS for user (${userName} : ${userId}) in room (${roomId}) was closed`);
        console.error(err);
    });

    setTimeout(() => {
        console.log(`Broadcast after add user to room (roomId=${roomId})`);
        broadcastRoom(roomId)
    });


    // if (ROOM_DB_API.isRoomExist(roomId)) {
    //     console.log(`Add user (${userName} : ${userId}) to room (${roomId})`);
    // } else {
    //     console.log(`Create room (${roomId}) with first user (${userName} : ${userId})`);
    //     ROOM_DB_API.createRoom(roomId);
    // }
    // if (userLateRemoveTimers[userId]) {
    //     console.log(`Reconnect user (${userName} : ${userId}) in room (${roomId})`);
    //     clearTimeout(userLateRemoveTimers[userId]);
    // } else {
    //     console.log(`Real add user (${userName} : ${userId}) to room (${roomId})`);
    //     ROOM_DB_API.addUser(roomId, userId, userName);
    // }
    // RoomUserWsMapApi.addUser(roomId, userId, ws);
    //
    // console.log("Subscribe on user actions");
    // ws.on("message", function (msg: string) {
    //     if (msg === "H") {
    //         console.log(`client H userId=${userId}`);
    //     } else if (msg === "clearCards") {
    //         ROOM_DB_API.clearCards(roomId);
    //         ROOM_DB_API.setShowCards(roomId, false);
    //     } else if (msg === "flipCards") {
    //         const room = ROOM_DB_API.getRoom(roomId);
    //         ROOM_DB_API.setShowCards(roomId, !room.showCards);
    //     } else {
    //         const msgVote = JSON.parse(msg);
    //         const rotateValue = (Math.round(Math.random() * 10) - 5) * 2; //degrees
    //         ROOM_DB_API.vote(roomId, userId, msgVote.vote.cardValue, rotateValue);
    //         openCardIfAllVotes(roomId);
    //     }
    //     broadcastRoom(roomId);
    // });
    // ws.on("close", function () {
    //     console.log(`WS for user (${userName} : ${userId}) in room (${roomId}) was closed`);
    //     RoomUserWsMapApi.removeUser(roomId, userId);
    //     userLateRemoveTimers[userId] = setTimeout(() => {
    //         console.log(`Lazy remove for user (${userName} : ${userId}) in room (${roomId}) was closed`);
    //         ROOM_DB_API.removeUser(roomId, userId);
    //         delete userLateRemoveTimers[userId];
    //         broadcastRoom(roomId);
    //     }, LAZY_REMOVE_TIMEOUT * 1000);
    //
    //     if (isEmptyRoom(roomId)) {
    //         console.log(`Room (${roomId}) is empty so remove it`);
    //         ROOM_DB_API.removeRoom(roomId);
    //         RoomUserWsMapApi.removeRoom(roomId);
    //     } else {
    //         broadcastRoom(roomId);
    //     }
    // });
    // ws.on("error", function (err: any) {
    //     console.error(`WS for user (${userName} : ${userId}) in room (${roomId}) was closed`);
    //     console.error(err);
    // });
    //
    // setTimeout(() => {
    //     console.log(`Broadcast after add user to room (roomId=${roomId})`);
    //     broadcastRoom(roomId)
    // });
}

const broadcastRoom = (roomId: RoomId): void => {
    const userWsMap: JsMap<UserId, WS> = RoomUserWsMapApi.getUsersByRoom(roomId);
    console.log(`Broadcast room (${roomId}) to users: ${Object.keys(userWsMap).join(', ')}`);
    // const room = ROOM_DB_API.getRoom(roomId);
    Object.values(userWsMap).forEach((ws: WS) => ws.send(JSON.stringify(ROOM)));
}

const isEmptyRoom = (roomId: RoomId): boolean => {
    const room = ROOM_DB_API.getRoom(roomId);
    return !Object.keys(room.votes).length;
}

const openCardIfAllVotes = (roomId: RoomId) => {
    const room = ROOM_DB_API.getRoom(roomId);
    const isAllVotes: boolean = Object.values(room.votes)
        .reduce((acc, vote) => acc && vote.cardValue != null, true);
    if (isAllVotes) {
        console.log(`All votes in room (${roomId})`);
        ROOM_DB_API.setShowCards(roomId, true);
    }
}
