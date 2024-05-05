module.exports = class Clients {
  constructor() {
    this.message = [];
    this.items = {};
    this.idMessage = 0;
    this.group = ["txt", "link", "image", "video", "audio"];
  }
  sendValidOk(ws, count) {
    ws.send(
      JSON.stringify({ event: "connect", message: "ok", noSendMsg: count })
    );
  }
  jsonStr(obj, event) {
    return JSON.stringify({
      event: event,
      message: {
        source: obj.source,
        id: obj.id,
        type: obj.type,
        date: obj.date,
        geo: obj.geo,
        message: obj.message,
        messageName: obj.messageName,
        favorite: obj.favorite,
      },
    });
  }

  sendNewMsg(rec, event) {
    for (const key in this.items) {
      this.items[key].send(this.jsonStr(rec, event));
    }
  }

  sendOldMsg(ws, event) {
    this.message.forEach((e) => {
      ws.send(this.jsonStr(e, event));
    });
  }

  sendNoSendMsg(ws, count) {
    const index = this.message.length - count;
    ws.send(this.jsonStr(this.message[count - 1], "noSendMsg"));
  }

  sendAllFavorite(ws) {
    this.message.forEach((e) => {
      if (e.favorite === "yes") {
        ws.send(this.jsonStr(e, "favoriteAll"));
      }
    });
  }

  sendGroup(ws, rec) {
    if (this.group.includes(rec.value)) {
      const regexp = new RegExp(`${rec.value}`, "g");
      this.message.forEach((e) => {
        if (e.type.match(regexp)) {
          ws.send(this.jsonStr(e, rec.event));
        }
      });
    } else {
      this.message.forEach((e) => {
        if (!this.know(e.type)) {
          ws.send(this.jsonStr(e, rec.event));
        }
      });
    }
  }

  know(type) {
    for (let i = 0; i < this.group.length; i += 1) {
      if (type.includes(this.group[i])) {
        return true;
      }
    }
    return false;
  }

  sendEvent(obj) {
    for (const key in this.items) {
      const chatEvent = JSON.stringify({
        event: obj.event,
        id: obj.id,
        value: obj.value,
      });
      this.items[key].send(chatEvent);
    }
  }

  search(ws, rec) {
    const recLow = rec.value.toLowerCase().trim();
    this.message.forEach((e) => {
      const eLow = e.message.toLowerCase();
      const eLowName = e.messageName.toLowerCase();
      if (recLow !== "") {
        if ((e.type === "txt" || e.type === "link") && eLow.includes(recLow)) {
          ws.send(this.jsonStr(e, "search"));
        } else if (eLowName.indexOf(recLow) !== -1) {
          ws.send(this.jsonStr(e, "search"));
        }
      }
    });
  }
};
