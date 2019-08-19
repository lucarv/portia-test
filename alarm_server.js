// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
require('dotenv').config()
const WebSocket = require('ws')
const wss = new WebSocket.Server({
  port: process.env.WSPORT
})
var wsc, alarmFlag = false;

wss.on('connection', ws => {
  console.log('web socket client connected')

  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    if (message == 'ack')
      alarmFlag = false
  })
  wsc = ws;
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
  let enq_time = message.annotations['iothub-enqueuedtime']
  let deviceId = message.annotations['iothub-connection-device-id']
  if (deviceId == 'simulated4fo') {
    console.log(message.body)
    if (message.body.temperature > 30 && !alarmFlag) {
      console.log('send alarm to operator')
      alarmFlag = true
      let alarm = JSON.stringify({
        "msgid:": msg_id,
        "ts": message.body.timestamp
      })
      console.log(alarm)
      wsc.send(alarm)
    }
  }
};

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