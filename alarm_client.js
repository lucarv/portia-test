require('dotenv').config()

const WebSocket = require('ws')
const connection = new WebSocket(process.env.WSSURL)

const ackAlarm = () => {
  console.log('agent has cleared alarm')
    connection.send(JSON.stringify({"msg": "alarm cleared"})) 
}
connection.onopen = () => {
  connection.send(JSON.stringify({"msg": "client connected"})) 
}

connection.onerror = (error) => {
  console.log('WebSocket error')
  console.log(error)
}

connection.onmessage = (e) => {
  msg = JSON.parse(e.data)
  if (msg.hasOwnProperty('ts')){
    let elapsed = Date.now() - msg.ts
    console.log('now: ' + Date.now())
    console.log('enqueued: ' + msg.ts)
    console.log('elapsed: ' + elapsed)
    console.log('-------------------------------')
    connection.send(JSON.stringify({"msg": "alarm received"})) 
    setTimeout(ackAlarm, 10000, 'funky');
  } else
    console.log('mgmt message: ' + msg.msg)


}
