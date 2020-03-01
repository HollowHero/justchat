const { send } = require('./send.js');

class User {
  constructor(username, ip) {
    this.username = username;
    this.ip = ip;
  }
}

class Session {
  constructor() {
    this.user = undefined;
    this.status = 'offline';
    this.start = Date.now();
    this.history = [];
    this.onlines = [];
  }

  //Initialise a session
  init(username, ip, mask, port) {
    this.user = new User(username, ip);
    this.network = { mask: mask, port: port };
    this.status = 'initialised';
    return true;
  }

  //Connect to the network, skan for users
  connect() {
    this.status = 'connecting';
    let done = [0, 0];
    for (let i = 1; i < ip.toLong(this.network.mask); i++) {
      send({ uri: ip.fromLong(ip.toLong(ip.mask(this.user.ip, this.network.mask)) + i), port: this.network.port }, { user: this.user, type: 'ping', data: true, time: this.start }, (res, err) => {
        if (err) {
          console.log(err); //TODO: change later
          done[0]++;
        } else if (res.type == 'ping' && res.data) {
          this.onlines.push(res.user);
          done[1]++;
        }
        if (done[0] + done[1] == ip.toLong(this.network.mask) - 1) {
          this.status = 'online';
          return true;
        }
      });
    }
  }

  //Send a message
  send(message) {
    let time = Date.now();
    fullMessage = { user: this.user, type: 'message', data: message, time: time };
    this.history.push(fullMessage);
    for (member of this.onlines) {
      send({ uri: member.ip, port: this.network.port }, fullMessage, (res, err) => {
        if (err) { //TODO: change later
          console.log(err);
        }
      });
    }
  }

  //Save a message to the history
  save(message) {
    let l = this.history.push(message);
    while (this.history[l - 1].time < this.history[l - 2].time) {
      this.history.splice(l - 2, 2, this.history[l - 1], this.history[l - 2]);
    }

    if (message.type == 'message') {
      return true;
    } else if (message.type == 'ping') {
      if (message.data) {
        this.onlines = this.onlines.filter((e) => { e.user.ip != message.user.ip }).push(message.user);
      } else {
        this.onlines = this.onlines.filter((e) => { e.user.ip != message.user.ip });
      }
      send({ uri: message.user.ip, port: this.network.port }, { user: this.user, type: 'ping', data: true, time: Date.now() }, (res, err) => {
        if (err) console.log(err);
      });
      return true;
    } else if (message.type == 'synchronize') {
      //Sync
    }
  }

  //Go offline
  offline() {
    let time = Date.now();
    let done = 0;
    for (member of onlines) {
      send({ uri: member.ip, port: this.network.port }, { user: this.user, type: 'ping', data: false, time: time }, (res, err) => {
        if (err) console.log(err); //TODO: change later
        if (done == onlines.length) {
          this.status = 'offline';
          this.user = undefined;
          this.history = [];
          this.onlines = [];
        }
      });
    }
  }

  //Re-check onlines (And re-ping others)
  check() {
    this.status = 're-check';
    this.onlines = [];
    let done = [0, 0];
    let time = Date.now();
    for (let i = 1; i < ip.toLong(this.network.mask); i++) {
      send({ uri: ip.fromLong(ip.toLong(ip.mask(this.user.ip, this.network.mask)) + i), port: this.network.port }, { user: this.user, type: 'ping', data: true, time: time }, (res, err) => {
        if (err) {
          console.log(err); //TODO: change later
          done[0]++;
        } else if (res.type == 'ping' && res.data) {
          this.onlines.push(res.user);
          done[1]++;
        }
        if (done[0] + done[1] == ip.toLong(this.network.mask) - 1) {
          this.status = 'online';
          return true;
        }
      });
    }
  }
}

module.exports = () => {
  return new Session();
};
