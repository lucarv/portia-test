require('dotenv').config()

const WebSocket = require('ws')
const client = new WebSocket(process.env.WSSURL)

const ackAlarm = () => {
  console.log('agent has cleared alarm')
  client.send(JSON.stringify({
    "msg": "alarm cleared"
  }))
}

client.onopen = () => {
  // do nothing for now
  /*
  client.send(JSON.stringify({
    "msg": "agent connected"
  }))
  */
}

client.onerror = (error) => {
  console.log('WebSocket error')
  console.log(error)
}

client.onmessage = (e) => {
  msg = JSON.parse(e.data)
  if (msg.hasOwnProperty('deviceId')) {
    let totalLatency = Date.now() - msg.generated;
    console.log(' # total latency: ' + totalLatency)
    console.log(' # azure latency: ' + msg.processing)


    console.log('-------------------------------')
    client.send(JSON.stringify({
      "msg": "alarm received"
    }))
    setTimeout(ackAlarm, 600000, 'funky');

    
  } else
    console.log('mgmt message: ' + msg.msg)

}