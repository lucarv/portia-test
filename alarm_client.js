require('dotenv').config()

const WebSocket = require('ws')
const connection = new WebSocket(process.env.WSSURL)

const ackAlarm = () => {
    connection.send('ack') 
}
connection.onopen = () => {
  // connection.send('Message From Client') 
}

connection.onerror = (error) => {
  console.log('WebSocket error')
  console.log(error)
}

connection.onmessage = (e) => {
  msg = JSON.parse(e.data)
  let elapsed = Date.now() - msg.ts
  console.log('now: ' + Date.now())
  console.log('enqueued: ' + msg.ts)
  console.log('elapsed: ' + elapsed)
  console.log('-------------------------------')


  connection.send('rcv') 
  setTimeout(ackAlarm, 10000, 'funky');

}
