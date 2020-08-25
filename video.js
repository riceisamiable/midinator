const ipc = require('electron').ipcRenderer
const config = require('./config')

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = config.videoWidth
canvas.height = config.videoHeight

ipc.on('video', (event, message) => {

//New Attempt
    canvas.width = canvas.width
    // console.log(message)
    // if(message.type === 'external'){
    // //ctx.drawImage(message.data, 0, 0, canvas.width, canvas.height)
    // null
    // } else {
    //
    //   ctx.fillStyle = message.color
    //   ctx.fillRect(0, message.y, canvas.width, message.height)
    //
    // }
    // ctx.drawImage(canvas, 0, 0)


//Original Stuff Here
  const { imageData } = message
  const data = new Uint8ClampedArray(imageData.data)
  const ig = new ImageData(data, config.videoWidth, config.videoHeight)
  ctx.putImageData(ig, 0, 0)


})
