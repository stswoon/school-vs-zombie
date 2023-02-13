import express from 'express';
import expressWs from 'express-ws';
import {createOrJoinRoom} from './roomService';
import {WS} from './utils';
import path from "path";


const app = express();


const unexpectedExceptionHandle = (cause: any) => {
    console.error("Something went wrong: ", cause);
}
process.on('uncaughtException', unexpectedExceptionHandle);
process.on('unhandledRejection', unexpectedExceptionHandle);
app.use((error: any, req: any, res: any, next: any): void => {
    unexpectedExceptionHandle(error);
    res.status(500).send("Server Error");
});


app.get('/health', (req, res) => res.send('OK'));


app.use(express.static(__dirname + '/public', {extensions: ['html']}));
// app.get('/room',function(req,res){
//     res.sendFile(path.join(__dirname+'/public/index.html'));
// });


const appWs = expressWs(app);

appWs.app.ws('/api/roomState', (ws: WS, req: express.Request, next): void => {
    const {roomId, userId, userName} = req.query as { roomId: string, userId: string, userName: string };
    console.info(`WS request roomId=${roomId}, userId=${userId} userName=${userName}`);
    try {
        createOrJoinRoom(ws, roomId, userId, userName);
    } catch (error) { // https://scoutapm.com/blog/express-error-handling
        next(error); // passing to default middleware error handler
    }
});

//WA for "H15 - Idle connection" - https://github.com/heroku-examples/node-websockets/blob/main/server.js
const HEROKU_IDLE_TIMEOUT = 50 * 1000; //50s
setInterval(() => appWs.getWss().clients.forEach((ws: WS) => ws.send("H")), HEROKU_IDLE_TIMEOUT);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
