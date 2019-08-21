// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

require('dotenv').config()
const WebSocket = require('ws')
const wss = new WebSocket.Server({
  port: process.env.WSPORT
})
console.log('listening to ws messages on port: ' + wss.options.port)
var wsc = [], alarmFlag = false;

wss.on('connection', (ws, req) => {
  const ip = req.connection.remoteAddress;
  console.log(`web socket ${ip} connected`)

  wsc.push(ws);
  console.log(`now with ${wsc.length} operators connected`)
  wsc[wsc.length - 1].send(JSON.stringify({
    "msg": "connected to server"
  }))

  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    let msg = JSON.parse(message);
    if (msg.msg == 'alarm cleared')
      alarmFlag = false
  })

})

var connectionString = process.env.ServiceCS;
var {
  EventHubClient,
  EventPosition
} = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};

var dispatch = function (message) {
  let msg_id = message.properties.message_id
  //let deviceId = message.annotations['iothub-connection-device-id']
  //if (deviceId == 'simulated4fo') {
    console.log(message.body)
    if (message.body.temperature > 30 && !alarmFlag) {
      console.log(`send alarm to ${wsc.length} operators`)
      alarmFlag = true
      let alarm = JSON.stringify({
        "msgid:": msg_id,
        "elapsed": Date.now() - message.body.timestamp
      });
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(alarm);
        }
      });
    }
  //};
}

// Connect to the partitions on the IoT Hub's Event Hubs-compatible endpoint.
// This example only reads messages sent after this application started.
var ehClient;
EventHubClient.createFromIotHubConnectionString(connectionString).then(function (client) {
  console.log("connected to default endpoint");
  ehClient = client;
  return ehClient.getPartitionIds();
}).then(function (ids) {
  return ids.map(function (id) {
    return ehClient.receive(id, dispatch, printError, {
      eventPosition: EventPosition.fromEnqueuedTime(Date.now())
    });
  });
}).catch(printError);