const ip = require('ip');
const express = require('express');
const readline = require('readline');
const { send } = require('./scripts/send.js');
const session = require('./scripts/session.js');
const mask = '255.255.255.0';   //TODO: Subnet mask autodetection
const port = 40204;
var app = express();
var ses = session();

//Console Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//Console Input
rl.on('line', (input) => {
    command = input.split(' ');
    if (command[0] == 'login' && ses.status == 'offline') {
        if (command[1]) {
            ses.init(command[1], ip.address(), mask, port)
            ses.connect();
        } else {
            console.log(`Please enter a username after 'login'`);
        }
    } else if (command[0] == 'send' && ses.status == 'online') {
        if (command[1]) {
            ses.send(command[1]);
        }
    } else if (command[0] == 'check' && ses.status == 'online') {
        ses.check();
    } else if (command[0] == 'offline' && ses.status == 'online') {
        ses.offline();
    }
});

app.get('/', (req, res) => {
    ses.save(req.query.message);
});

//Start server listening
app.listen(port, () => console.log(`App is listening on port ${port}`));
