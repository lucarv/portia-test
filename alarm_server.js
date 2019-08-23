// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

require('dotenv').config()
const WebSocket = require('ws')
const wss = new WebSocket.Server({
  port: process.env.WSPORT
})
console.log('Alarm Server listening to ws messages on port: ' + wss.options.port)
var wsc = [],
  alarmFlag = false;

wss.on('connection', (ws, req) => {
  // lines below will not work behind NAT
  /*
  const ip = req.connection.remoteAddress;
  console.log(`web socket ${ip} connected`)
  */
  wsc.push(ws);
  console.log(`client connected\n # ${wsc.length} clients connected`)
  wsc[wsc.length - 1].send(JSON.stringify({
    "msg": "connected to server"
  }))

  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    let msg = JSON.parse(message);
    if (msg.msg == "alarm cleared" && alarmFlag == true) {
      console.log('agent has cleared alarm')
      alarmFlag = false
    }
  })

  ws.on('close', (code) => {
    let index = wsc.indexOf(ws)
    wsc.splice(index, 1)

    if (wsc.length == 0) {
      console.log('no more clients connected')
      alarmFlag = false
    } else
      console.log(`client terminated with error code ${code}\n #${wsc.length} clients connected`)
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
  let displayName = (message.body.DisplayName)
  let value = message.body.Value.Value
  let deviceId = message.annotations['iothub-connection-device-id']
  console.log('----------------------------------------------------------')
  console.log(`received telemetry from ${deviceId}\nTag: [${displayName}] Value => ${value}`)
  if (displayName == 'Pressure Alarm On' && value && !alarmFlag && wsc.length > 0) {
    console.log('HUB TIME')
    console.log(new Date(message.annotations['iothub-enqueuedtime']))
    let now = Date.now()
    console.log('NOW TIME')
    console.log(new Date(now))

    let processing = now - message.annotations['iothub-enqueuedtime'];
    console.log(' # processing time: ' + processing)
    console.log(`send alarm to ${wsc.length} operators`)
    alarmFlag = true
    let alarm = JSON.stringify({
      "deviceId": deviceId,
      "processing": processing
    });
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(alarm);
      }
    });
  }
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