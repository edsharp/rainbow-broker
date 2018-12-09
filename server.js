const app = require("express")();
const fs = require("fs");
const https = require("https");
const next = require("next");

const options = {
  key: fs.readFileSync("./localhost.key"),
  cert: fs.readFileSync("./localhost.cert"),
  requestCert: false,
  rejectUnauthorized: false
};

const server = https.createServer(options, app);
const io = require("socket.io")(server);

const port = parseInt(process.env.PORT, 10) || 3001;
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const registers = {
  displays: {},
  emitters: {},
  buttonshims: {},
  neopixels: {}
};

const mirror = {
  queue: [],
  displaying: null,
  startedDisplayAtMs: 0,
  lastActiveAt: 0,
  idleTimeout: 3000,
  minimumSession: 30000
};

setMirror = name => {
  mirror.displaying = name;
  mirror.startedDisplayAtMs = new Date().getTime();
  mirror.lastActiveAt = mirror.startedDisplayAtMs;
  io.emit("mirror.updated", mirror);
  console.log(`mirror.updated ${name}`);
};
requestMirror = name => {
  if (mirror.displaying == name) {
    console.log(`already mirroring ${name}`);
  } else if (mirror.displaying === null) {
    console.log(`immediately mirror ${name}`);
    setMirror(name);
  } else if (mirror.queue.indexOf(name) < 0) {
    console.log(`queue mirror ${name}`);
    mirror.queue.push(name);
  } else {
    console.log(`mirror ${name} already queued`);
  }
  io.emit("mirror.updated", mirror);
};
updateMirror = () => {
  if (mirror.queue.length == 0) return;

  const now = new Date().getTime();
  const sessionTime = now - mirror.startedDisplayAtMs;
  const idleTime = now - mirror.lastActiveAt;

  if (sessionTime > mirror.minimumSession) {
    console.log(`mirror ${mirror.displaying} exceeded minimumSession`);
  } else if (idleTime > mirror.idleTimeout) {
    console.log(`mirror ${mirror.displaying} exceeded idleTimeout`);
  } else {
    console.log(
      `mirror ${
        mirror.displaying
      } sessionTime ${sessionTime}ms, idleTime ${idleTime}ms`
    );
    return;
  }

  setMirror(mirror.queue.shift());
};
setInterval(updateMirror, 1000);

io.on("connection", socket => {
  const {
    client: {
      conn: { remoteAddress }
    }
  } = socket;
  console.log(`connection from ${remoteAddress}`);

  socket.on("register", (data, fn) => {
    if (fn == undefined) {
      fn = () => {};
    }
    const { type, name, ...properties } = data;
    let registrar;
    properties.socket = socket;
    if (type == "display") {
      registrar = registers.displays;
      socket.on("mirror.request", () => {
        console.log(`${remoteAddress} request mirror ${name}`);
        requestMirror(name);
      });
    } else if (type == "neopixel") {
      registrar = registers.neopixels;
    } else if (type == "emitter") {
      registrar = registers.emitters;
      socket.on("render", data => {
        const display = registers.displays[properties.display.name];
        if (display && display.password == properties.display.password) {
          display.socket.emit("render", data);
        }
        if (mirror.displaying == properties.display.name) {
          const now = new Date().getTime();
          mirror.lastActiveAt = now;
          for (const name in registers.displays) {
            const display = registers.displays[name]
            display.socket.emit("render.mirror", data);
          }
          for (const name in registers.neopixels) {
            const neopixel = registers.neopixels[name]
            console.log(`emit to ${neopixel}`)
            neopixel.socket.emit("render.mirror", data);
          }
        }
      });
    } else if (type == "buttonshim") {
      registrar = registers.buttonshims;
      socket.on("button.press", index => {
        console.log(`button.press ${index}`);
        socket.emit("render", [[255, 0, 0]]);
        # FIXME: This should not globally rebroadcast
        socket.broadcast.emit("button.press", index);
      });
      socket.on("button.release", index => {
        console.log(`button.release ${index}`);
        socket.emit("render", [[0, 255, 0]]);
        # FIXME: This should not globally rebroadcast
        socket.broadcast.emit("button.release", index);
      });
    } else {
      const message = `${remoteAddress} failed to register invalid type ${type}`;
      console.log(message);
      return fn({ success: false, message });
    }

    if (registrar.hasOwnProperty(name)) {
      const message = `${remoteAddress} failed to register ${type} of duplicate name ${name}`;
      console.log(message);
      return fn({ success: false, message });
    }

    console.log(`${remoteAddress} registering ${type} ${name}`);
    registrar[name] = properties;

    socket.on("disconnect", () => {
      console.log(`${remoteAddress} unregistering ${type} ${name}`);
      delete registrar[name];
    });

    fn({ success: true, message: `Successfully registered ${name}` });
  });
});

nextApp.prepare().then(() => {
  app.get("/mirror/info", (req, res) => {
    res.json(mirror);
  });

  app.get("*", (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
  });
});
