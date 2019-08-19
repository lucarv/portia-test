// client.js

const WebSocket = require('ws')
const url = 'ws://localhost:8080'
const connection = new WebSocket(url)

const ackAlarm = () => {
    connection.send('ack') 
}
connection.onopen = () => {
  // connection.send('Message From Client') 
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}

connection.onmessage = (e) => {
  msg = JSON.parse(e.data)
  let elapsed = Date.now() - msg.ts
  console.log('now: ' + Date.now())
  console.log('enqueued: ' + msg.ts)
  console.log('elapsed: ' + elapsed)

  connection.send('rcv') 
  setTimeout(ackAlarm, 10000, 'funky');

}
