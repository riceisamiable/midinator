const path = require('path')

const eases = require('d3-ease')
const ffmpeg = require('fluent-ffmpeg')
const leftpad = require('leftpad')

const { renderInput } = require('./utils')

const LENGTH_DEFAULT = 10
const EASE_DEFAULT = 'easeLinear'
const REVERSE_DEFAULT = false

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const loadImage = async (imgpath) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => {
      reject('failed to load')
    }
    img.onload = () => {
      resolve(img)
    }
    img.src = `file://${imgpath}`
  })
}

class ImportedProgram {
  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.basename(filepath)
    this.images = []
  }

  load() {
    return new Promise((resolve, reject) => {
      ffmpeg(this.filepath).ffprobe((err, data) => {
        if (err) return reject(err)
        this.totalFrames = data.streams[0].nb_frames
        console.log(`Loading Imported program with ${this.totalFrames} frames`)

        //ffmpeg -i video.webm -vf "select=eq(pict_type\,I)" -vsync vfr thumb%04d.jpg -hide_banner
        const outputPath = path.resolve(__dirname, `../frames/${this.filename}-%05d.png`)
        const cmd = ffmpeg(this.filepath)
          .filterGraph(['select=eq(pict_type\\,I)'])
          .outputOption('-vsync vfr')
          .outputOption('-hide_banner')
          .output(outputPath)
          .on('end', async () => {
            console.log('Loading images')
            for (let i=1; i <= this.totalFrames; i++) {
              const filename = `${this.filename}-${leftpad(i, 5)}.png`
              const imgpath = path.resolve(__dirname, '../frames/', filename)
              const img = await loadImage(imgpath)
              this.images.push(img)
            }
            console.log('ImportedProgram loaded!')
            resolve()
          })
          .on('error', (err, stdout, stderr) => {
            reject(err)
          })
          .run()


      })
    })



  }

  run({ delta, length, ease, reverse, canvasWidth, canvasHeight }) {
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    length = length || LENGTH_DEFAULT
    ease = ease || EASE_DEFAULT
    reverse = reverse || REVERSE_DEFAULT

    // console.log('delta: '+delta)
    // console.log('length: '+length)
    // console.log('total frames: '+ this.totalFrames)

    const easeFn = eases[ease]
    const t = delta / length
    // console.log('t:'+ t)

    let easeValue = easeFn(t)
    if (reverse) easeValue = 1 - easeValue
    // console.log('Ease Value: '+ easeValue)
    let frame = Math.floor(easeValue * this.totalFrames)
    // console.log('Frame: '+ frame)
    const img = this.images[frame]
    // console.log(img)

    if (!img) return canvas

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  runTest({ delta, length, ease, reverse, canvasWidth, canvasHeight },{type, manualSelections}) {
    let frameData = {}
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    length = length || LENGTH_DEFAULT
    ease = ease || EASE_DEFAULT
    reverse = reverse || REVERSE_DEFAULT

    // console.log('delta: '+delta)
    // console.log('length: '+length)
    // console.log('total frames: '+ this.totalFrames)

    const easeFn = eases[ease]
    const t = delta / length
    //console.log('t:'+ t)

    let easeValue = easeFn(t)
    if (reverse) easeValue = 1 - easeValue
    //console.log('Ease Value: '+ easeValue)
    let frame = Math.floor(easeValue * this.totalFrames)
    //console.log('Frame: '+ frame)
    const img = this.images[frame]
    //console.log(img)

    if (!img) return frameData
    frameData.img = img.src
    //console.log( frameData.img )
    frameData.canvasWidth = canvas.width
    frameData.canvasHeight = canvas.height
    frameData.columntype = type
    frameData.manualSelections = {}

    return frameData

    //ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    //return canvas
  }




  renderParams({ params, parent }) {
    const reverseInput = document.createElement('input')
    reverseInput.type = 'checkbox'
    reverseInput.checked = !!params.reverse
    reverseInput.oninput = () => {
      params.reverse = reverseInput.checked
    }
    renderInput({ label: 'Reverse:', input: reverseInput, parent })
  }
}

module.exports = ImportedProgram
