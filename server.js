const http = require("http");
const Koa = require("koa");
const cors = require("@koa/cors");
const uuid = require("uuid");
const WS = require("ws");
const ChaosBot = require("./chaosBot");
const Clients = require("./clients");
const Func = require("./func");

const app = new Koa();
const clients = new Clients();
const bot = new ChaosBot(clients);

const port = process.env.PORT || 8181;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

app.use(
  cors({
    origin: "*",
    credentials: true,
    "Access-Control-Allow-Origin": true,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

wsServer.on("connection", (ws) => {
  const id = uuid.v4();
  ws.on("message", (msg) => {
    const request = JSON.parse(msg);
    switch (request.event) {
      case "connected":
        clients.items[id] = ws;
        clients.items[id].noSendMsg = clients.message.length;
        clients.sendValidOk(ws, clients.items[id].noSendMsg);
        clients.sendOldMsg(ws, "oldMessage");
        break;
      case "message":
        clients.message.push({
          ["source"]: "user",
          ["id"]: clients.idMessage,
          ["type"]: request.type,
          ["message"]: request.message,
          ["messageName"]: request.messageName || "",
          ["geo"]: request.geo,
          ["date"]: request.date,
          ["favorite"]: request.favorite,
        });
        clients.idMessage += 1;
        clients.sendNewMsg(
          clients.message[clients.message.length - 1],
          "newMessage"
        );
        if (/^@chaos:/g.test(request.message)) {
          bot.commandFind(request.message);
        }
        break;
      case "noSendMsg":
        clients.sendNoSendMsg(ws, request.value);
        break;
      case "delete":
        clients.message.splice(Func.indexItem(clients.message, request.id), 1);
        clients.sendEvent({
          event: "delete",
          id: request.id,
          value: 0,
        });
        break;
      case "deleteAll":
        clients.message = [];
        clients.sendEvent({
          event: "deleteAll",
          id: 0,
          value: 0,
        });
        break;
      case "favorite":
        const index = Func.indexItem(clients.message, request.id);
        clients.message[Func.indexItem(clients.message, request.id)].favorite =
          request.value;
        clients.sendEvent({
          event: "favorite",
          id: request.id,
          value:
            clients.message[Func.indexItem(clients.message, request.id)]
              .favorite,
        });
        break;
      case "getFavoriteAll":
        clients.sendAllFavorite(ws);
        break;
      case "getGroup":
        clients.sendGroup(ws, request);
        break;
      case "search":
        clients.search(ws, request);
        break;
      default:
        break;
    }
  });

  ws.on("close", () => {
    if (typeof clients.items[id] !== "undefined") {
      delete clients.items[id];
    }
  });
});

server.listen(port, () => console.log(`Server has been started on ${port}...`));
