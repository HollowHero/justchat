const ip = require('ip');
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
    console.log('User initialised');
    return true;
  }

  //Connect to the network, skan for users
  connect() {
    this.status = 'connecting';
    let done = [0, 0];
    let time = Date.now();
    console.time('Pinged the network! Elapsed time');
    for (let i = 2; i < ip.toLong(ip.not(this.network.mask)); i++) {
      let uri = ip.fromLong(ip.toLong(ip.mask(this.user.ip, this.network.mask)) + i);
      if (uri != this.user.ip) {
        send({ uri: uri, port: this.network.port }, { user: this.user, type: 'ping', data: true, time: time }, (res, err) => {
          if (err) {
            console.log(err); //TODO: change later
            done[0]++;
          } else if (res.type == 'ping' && res.data) {
            this.onlines.push(res.user);
            done[1]++;
          }
          if (done[0] + done[1] == ip.toLong(ip.not(this.network.mask)) - 3) {
            this.status = 'online';
            console.timeEnd('Pinged the network! Elapsed time');
            console.log(`Onlines: ${(this.onlines.length) ? this.onlines : 'nobody'}`);
            return true;
          }
        });
      } else {
        console.log(`Checked my own IP: ${uri}`);
      }
    }
  }

  //Send a message
  send(message) {
    let time = Date.now();
    let fullMessage = { user: this.user, type: 'message', data: message, time: time };
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
    if (l > 1) {
      while (this.history[l - 1].time < this.history[l - 2].time) {
        this.history.splice(l - 2, 2, this.history[l - 1], this.history[l - 2]);
      }
    }

    if (message.type == 'message') {
      console.log(`${message.user.username}: ${message.data}`);
      return true;
    } else if (message.type == 'ping') {
      console.log(`${message.user.username} goes ${message.data ? 'online' : 'offline'}!`);
      if (message.data) {
        this.onlines = this.onlines.filter((e) => { e.ip != message.user.ip });
        this.onlines.push(message.user);
      } else {
        this.onlines = this.onlines.filter((e) => { e.ip != message.user.ip });
      }
      return true;
    } else if (message.type == 'synchronize') {
      //Sync
    }
  }

  //Go offline
  offline() {
    let time = Date.now();
    let done = 0;
    if (this.onlines.length) {
      for (member of this.onlines) {
        send({ uri: member.ip, port: this.network.port }, { user: this.user, type: 'ping', data: false, time: time }, (res, err) => {
          if (err) console.log(err); //TODO: change later
          if (done == this.onlines.length) {
            this.status = 'offline';
            this.user = undefined;
            this.history = [];
            this.onlines = [];
          }
        });
      }
    } else {
      this.status = 'offline';
      this.user = undefined;
      this.history = [];
      this.onlines = [];
    }
  }

  //Re-check onlines (And re-ping others)
  check() {
    this.status = 're-check';
    this.onlines = [];
    let done = [0, 0];
    let time = Date.now();
    console.time('Checked the network! Elapsed time');
    for (let i = 2; i < ip.toLong(ip.not(this.network.mask)); i++) {
      let uri = ip.fromLong(ip.toLong(ip.mask(this.user.ip, this.network.mask)) + i);
      if (uri != this.user.ip) {
        send({ uri: uri, port: this.network.port }, { user: this.user, type: 'ping', data: true, time: time }, (res, err) => {
          if (err) {
            console.log(err); //TODO: change later
            done[0]++;
          } else if (res.type == 'ping' && res.data) {
            this.onlines.push(res.user);
            done[1]++;
          }
          if (done[0] + done[1] == ip.toLong(ip.not(this.network.mask)) - 3) {
            this.status = 'online';
            console.timeEnd('Checked the network! Elapsed time');
            console.log(`Onlines: ${(this.onlines.length) ? this.onlines : 'nobody'}`);
            return true;
          }
        });
      } else {
        console.log(`Checked my own IP: ${uri}`);
      }
    }
  }
}

module.exports = () => {
  return new Session();
};
