console.log(process.pid);

const fs = require('fs')

const leftpad = require('leftpad')
const Frame  = require('canvas-to-buffer')
const rimraf = require('rimraf')
const ffmpeg = require('fluent-ffmpeg')
const jsonfile = require('jsonfile')
const userPrompt = require('electron-osx-prompt')

const { dialog, getCurrentWindow } = require('electron').remote
const ipc = require('electron').ipcRenderer
const win = getCurrentWindow()

const config = require('./config')
let ProgramWrapper = require('./src/programs')
const { renderApp, setPosition } = require('./src/app')
const { renderColumns, getColumns } = require('./src/columns')
const { getPlayer, loadMidiPlayer } = require('./src/player')
const { getProject, setProject } = require('./src/project')
const { getMidiEvent } = require('./src/utils')
let Audio = require('./src/audio')
let frameDataFile
let columns = []
//console.log(render[7439])


require('./src/shortcuts')

const columnWidth = config.videoWidth / config.totalColumns
const progressElem = document.getElementById('progress')
const timeline = document.getElementById('timeline')
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')


canvas.width = config.videoWidth
canvas.height = config.videoHeight

const init = () => {
  const Project = getProject()
  if (Project.midiFile) {
    console.log(`loading midiFile: ${Project.midiFile}`)

    loadMidiPlayer(Project.midiFile, () => {
      const player = getPlayer()
      const midiFileEvents = player.getEvents()[0]

      const merged = {}

      Project.midiEvents.forEach((midiEvent) => {
        if (midiEvent.name !== 'Note on') return

        const hasProgram = (e) => e.programs && e.programs.length

        if (!merged[midiEvent.tick]) {
          merged[midiEvent.tick] = midiEvent
        } else if (!hasProgram(merged[midiEvent.tick]) && hasProgram(midiEvent.programs)) {
          merged[midiEvent.tick] = midiEvent
        }
      })

      midiFileEvents.forEach((midiEvent) => {
        if (midiEvent.name !== 'Note on') return

        if (!merged[midiEvent.tick]) {
          merged[midiEvent.tick] = midiEvent
        }
      })

      Project.midiEvents = Object.values(merged).sort((a, b) => a.tick - b.tick)

//Load the External Program (Animaiton) videos
      if (Project.programs.length) {
        ProgramWrapper.load(Project.programs)
        console.log('boom')
      }

      //console.log(render[1])

    //  console.log(bongo[1])

      if (Project.tempo) {
        const player = getPlayer()
        player.setTempo(Project.tempo)
      }
      console.log('one')
      renderApp()

    })
  }



  if (!fs.existsSync('./frames')) {
    fs.mkdirSync('./frames')
  }

  if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp')
  }
}

const loadMidiFile = () => {
  dialog.showOpenDialog({
    title: 'Load Midi File',
    message: 'select a .mid file',
    properties: ['openFile'],
    filters: [
      { name: 'Midi', extensions: ['mid', 'midi'] }
    ]
  }, function (files) {
    if (files !== undefined) {
      const Project = getProject()
      Project.midiFile = files[0]
      loadMidiPlayer(Project.midiFile)
      const player = getPlayer()
      Project.midiEvents = player.getEvents()[0]
      //console.log(Project)
      renderApp()

    }
  })
}
//---------------------- Pre Render Utility Functions  --------------------------
//Helper Function to Normalize Data to 0 - 100 pixels high.
function normalizeHeightData(value, transformTo) {
    if(transformTo === 'ThreeJS'){
      //console.log('Orig: '+ value)
      let x = value
      //  x = 640 - x
      x = x / 360
      x = x * 100
      //console.log('New: '+ x )
      return x
    }
    if(transformTo === 'DataStore'){
      //console.log('Orig: '+ value)
      let x = value
      //  x = 640 - x
      x = x / 100
      x = x * 360
      //console.log('New: '+ x )
      return x
    }
}

function normalizeYValueData(value, transformTo) {
  if(transformTo === 'ThreeJS'){
    //console.log('Orig: '+ value)
    let x = value
    x = 360 - x
    x = x / 360
    x = x * 100
    x = x - 50
    //console.log('New: '+ x )
    return x
  }
  if(transformTo === 'DataStore'){
    //console.log('Orig: '+ value)
    let x = value
    x = x + 50
    x = x / 100
    x = x * 360
    x = 360 - x
    //console.log('New: '+ x )
    return x
  }
}


//---------------------------------------------------------------------------


//----------------------- Pre Render ---------------------------------------
//Pre Render All Positions of Animations
let render = {}
preRender = () => {
  const player = getPlayer()
  const Project = getProject()
  const RenderProject = getProject()
  console.log('Bruh Bruh')

  //---------------- Scale the values to 0 - 100 px ------------------------------------
  for (let d = 0; d < Project.midiEvents.length; d++) {
    const midiEvent = Project.midiEvents[d]
    midiEvent.programs.forEach((program) => {
      //Adjust Height Parameter
      program.params.height.start = normalizeHeightData(program.params.height.start,'ThreeJS')
      program.params.height.end = normalizeHeightData(program.params.height.end,'ThreeJS')
      //Adjust Y Parameter
      program.params.y.start = normalizeYValueData(program.params.y.start,'ThreeJS')
      program.params.y.end = normalizeYValueData(program.params.y.end,'ThreeJS')

    })
  }
  //-----------------------------------------------------

   for (let i = 1; i < player.totalTicks + 1; i++ ){
     let tic = []
      for(let p = 0; p < Project.midiEvents.length; p++){
        const midiEvent = Project.midiEvents[p]

        if (midiEvent.tick > i ) continue
        if (midiEvent.name !== 'Note on') continue
        if (!midiEvent.programs.length) continue

        midiEvent.programs.forEach((program) => {
          const end = program.params.length + midiEvent.tick
          if ( i > end) return
          const delta = i - midiEvent.tick
          const cnvs = ProgramWrapper.preRender(program.name, {
            canvasHeight: canvas.height,
            canvasWidth: canvas.width,
            delta,
            ...program.params
            }, program.columnParams)

          tic.push(cnvs)
        })
      }
      //console.log(tic)
      render[i] = tic
    }

    jsonfile.writeFileSync('frameData.json', render)
    frameDataFile = JSON.parse(fs.readFileSync('./frameData.json'))

      // Convert Project Back to Normal
    for(let d = 0; d < Project.midiEvents.length; d++){
      const midiEvent = Project.midiEvents[d]
      midiEvent.programs.forEach((program) => {
        program.params.height.start = normalizeHeightData(program.params.height.start,'DataStore')
        program.params.height.end = normalizeHeightData(program.params.height.end,'DataStore')

        program.params.y.start = normalizeYValueData(program.params.y.start,'DataStore')
        program.params.y.end = normalizeYValueData(program.params.y.end,'DataStore')
      })
    }

    console.log('Pre Render Complete')
    console.log(Project)
}
//----------------------- Begin Play Function -----------------------------------------------
const play = () => {
  const player = getPlayer()
  const audio = Audio.getPlayer()
  if (!player) return
  if (player.isPlaying()) {
    player.stop()
    if (audio) audio.stop()
    setPosition()
    const elem = document.getElementById('current-position')
    if (elem && elem.parentNode) elem.parentNode.removeChild(elem)
    return document.querySelector('#play').innerHTML = 'Play'
  }

  let currentTick = 0
  const currentPosition = document.createElement('div')
  currentPosition.id = 'current-position'
  const Project = getProject()
  //console.log(Project)
  //------------------- Begin Animate Function ------------------------------------
  const animate = () => {
    if (currentPosition.parentNode) currentPosition.parentNode.removeChild(currentPosition)
    const measureLength = player.division * 4
    const currentMeasure = Math.ceil(currentTick / measureLength)
    const parent = document.querySelector(`.measure:nth-child(${currentMeasure})`)
    const position = ((currentTick % measureLength) / measureLength) * 100
    currentPosition.setAttribute('style', `left: ${position}%;`)
    if (parent && player.isPlaying()) parent.appendChild(currentPosition)

    //This resets the canvas
    canvas.width = canvas.width

    //------------------------- Use Data in Pre Rendered Data File -------------------------------------------
    // This draws the preprendered data
    const currentFrame = frameDataFile[currentTick] //render[currentTick]
      if(currentFrame){
      currentFrame.forEach((item, i) => {
        if(currentFrame[i].img){
          let img = document.createElement('img')
          img.src = currentFrame[i].img //currentFrame[i].img
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        } else {

      //Original Stuff
        //console.log('no img')
        ctx.fillStyle = currentFrame[i].color
        ctx.fillRect(0, currentFrame[i].yValue, currentFrame[i].canvasWidth, currentFrame[i].heightValue)

      //New Attempt
        // ipc.send('video', { color: currentFrame[i].color,
        //                     height: currentFrame[i].heightValue,
        //                     y: currentFrame[i].yValue,
        //                     type: 'internal' })

        }
      });
      ctx.drawImage(canvas, 0, 0)
    }
    // --------------------------------------------------------------------------------

    // -------------------- Render on the Fly -----------------------------------------
    //This is the origninal working code
      // const Project = getProject()
      // for (let e=0; e < Project.midiEvents.length; e++) {
      //   const midiEvent = Project.midiEvents[e]
      //
      //   if (midiEvent.tick > currentTick) continue
      //   if (midiEvent.name !== 'Note on') continue
      //   if (!midiEvent.programs.length) continue
      //
      //   midiEvent.programs.forEach((program) => {
      //     const end = program.params.length + midiEvent.tick
      //     if (currentTick > end) return
      //     //console.log(program.params);
      //     const delta = currentTick - midiEvent.tick
      //     const cnvs = ProgramWrapper.run(program.name, {
      //       canvasHeight: canvas.height,
      //       canvasWidth: canvas.width,
      //       delta,
      //       ...program.params
      //     })
      //
      //     const columns = getColumns({ delta, ...program.columnParams, ...program.params })
      //     if (!columns.length) return ctx.drawImage(cnvs, 0, 0)
      //     renderColumns({ cnvs, ctx, columns })
      //
      //   })
      // }
      // ---------------------------------------------------------------------------------

    let images = {}
    for (let i = 0; i < config.totalColumns; i++) {
      images[i] = ctx.getImageData(i * columnWidth, 0, columnWidth, canvas.height)
    }

    //---------- Send To Renderer -------------------
    ipc.send('render', { currentFrame })

    //This is to send the rendered images from CANVAS to the renderer Window.
    //ipc.send('render', { images })
    //-----------------------------------------------

    //---------- Send To Video ---------------------
    ipc.send('video', { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) })
    //-----------------------------------------------
    if (player.isPlaying()) setImmediate(animate)
  }
  // -------------- End Animate Function ----------------------------------------------------------

  player.on('playing', (tick) => currentTick = tick.tick)
  player.play()
  if (audio) audio.play()
  document.querySelector('#play').innerHTML = 'Reset'
  setImmediate(animate)
}
//---------------- End Play Function ----------------------------------------------------

const showExportDialog = () => {
  dialog.showSaveDialog({
    title: 'Save Video File',
    defaultPath: '~/Downloads/output',
    //message: 'select a .mid file',
    filters: [
      { name: 'Video', extensions: ['mp4'] }
    ]
  }, function (file) {
    if (file) exportVideo(file)
  })
}

const exportVideo = (outputPath) => {
  console.log('clearing frames')
  rimraf.sync('tmp/*')

  let f = 0

  const renderFrame = () => {
    // reset canvas
    canvas.width = canvas.width
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const Project = getProject()
    for (let e=0; e < Project.midiEvents.length; e++) {
      const midiEvent = Project.midiEvents[e]

      if (midiEvent.tick > f) continue
      if (midiEvent.name !== 'Note on') continue
      if (!midiEvent.programs.length) continue

      midiEvent.programs.forEach((program) => {
        const end = (program.params.length || 10) + midiEvent.tick
        if (f > end) return

        const delta = f - midiEvent.tick
        const cnvs = ProgramWrapper.run(program.name, {
          canvasHeight: canvas.height,
          canvasWidth: canvas.width,
          delta,
          ...program.params
        })

        const columns = getColumns({ delta, ...program.columnParams, ...program.params })
        if (!columns.length) return ctx.drawImage(cnvs, 0, 0)
        renderColumns({ cnvs, ctx, columns })
      })
    }

    const frame = new Frame(canvas, { quality: 1, image: { types: ['png'] }})
    fs.writeFileSync('tmp/' + leftpad(f, 5) + '.png', frame.toBuffer())

    const player = getPlayer()
    if (f < player.totalTicks) {
      const percent = `${Math.round(f/player.totalTicks * 100)}`

      f += 1
      if (progressElem.value != percent) {
        progressElem.value = parseInt(percent, 10)
        setTimeout(() => renderFrame(), 30)
      } else renderFrame()
    } else runFFmpeg(outputPath)
  }

  //console.log('rendering frames')
  renderFrame()
}

const runFFmpeg = (outputPath) => {
  const player = getPlayer()
  console.log('running ffmpeg')
  //TODO: run ffmpeg generate video
  // ffmpeg -r 192 -i frames/%5d.png -c:v libx264 -r 30 -pix_fmt yuv420p mp4/chappell.mp4
  const inputFPS = 1000 / (60000 / (player.tempo * player.division))
  const cmd = ffmpeg('tmp/%5d.png')
    .inputFPS(inputFPS)
    .videoCodec('libx264')
    .outputOptions(['-pix_fmt yuv420p'])
    .outputFps(40)
    .output(outputPath)
    .on('progress', function(progress) {
      progressElem.value = Math.floor(progress.percent)
    })
    .on('end', function() {
      dialog.showMessageBox({ type: 'info', message: 'Export Finished' })
      console.log('Finished processing')
    })
    .on('error', function(err, stdout, stderr) {
      dialog.showErrorBox(err.message, err)
      console.log('Cannot process video: ' + err.message)
    })
    .run()
}

const save = () => {

  dialog.showSaveDialog({
    title: 'Save Project File',
    defaultPath: '~/Downloads/light-project',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }, function (file) {
    if (file) {
      const Project = getProject()
      console.log(Project)
     // Convert Project Back to Normal
      // for(let d = 0; d < Project.midiEvents.length; d++){
      //   const midiEvent = Project.midiEvents[d]
      //   midiEvent.programs.forEach((program) => {
      //     program.params.height.start = normalizeHeightData(program.params.height.start,'DataStore')
      //     program.params.height.end = normalizeHeightData(program.params.height.end,'DataStore')
      //
      //     program.params.y.start = normalizeYValueData(program.params.y.start,'DataStore')
      //     program.params.y.end = normalizeYValueData(program.params.y.end,'DataStore')
      //   })
      // }


      jsonfile.writeFileSync(file, Project)
      localStorage.setItem('projectFile', file)

      //const projects = localStorage.getItem('projects') || []
      //console.log(localStorage.getItem('projects'))
      //projects.push(file)
      //localStorage.setItem('projects', projects)
    }
  })
}

const loadJSON = () => {
  dialog.showOpenDialog({
    title: 'Load JSON File',
    message: 'select a .json file',
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }, (files) => {
    if (files !== undefined) {
      const file = files[0]
      const Project = setProject(jsonfile.readFileSync(file))
      loadMidiPlayer(Project.midiFile, () => {
        const player = getPlayer()
        player.tracks[0].events = Project.midiEvents
        player.events[0] = Project.midiEvents
        console.log('three')
        renderApp()

      })

      if (Project.programs.length) ProgramWrapper.load(Project.programs)
      preRender()
    }
  })
}

const showProgramDialog = () => {
  dialog.showOpenDialog({
    title: 'Load MOV File',
    message: 'select a .mov file',
    properties: ['openFile'],
    filters: [
      { name: 'MOV', extensions: ['mov'] }
    ]
  }, async (files) => {
    if (files !== undefined) {
      const file = files[0]
      const Project = getProject()
      Project.programs.push(file)
      ProgramWrapper.load(Project.programs)
    }
  })
}

const loadAudio = () => {
  dialog.showOpenDialog({
    title: 'Load Audio File',
    message: 'select an audio file',
    properties: ['openFile'],
    filters: [
      { name: 'Audio', extensions: ['flac', 'mp3', 'wav'] }
    ]
  }, async (files) => {
    if (files !== undefined) {
      const file = files[0]
      const Project = getProject()
      Project.audioFile = file
      Audio.load(file)
    }
  })
}

const setTempo = () => {
  userPrompt('Set Tempo', '120').then(input => {
    if (input) {
      const player = getPlayer()
      const tempo = parseInt(input, 10)
      const Project = getProject()
      Project.tempo = tempo
      player.setTempo(tempo)
      document.getElementById('tempo').innerHTML = `Tempo: ${player.tempo}`
    }
  }).catch(err => {
    console.log(err)
  })
}

document.querySelector('#play').addEventListener('click', play)
document.querySelector('#loadProgram').addEventListener('click', showProgramDialog)
document.querySelector('#loadAudio').addEventListener('click', loadAudio)
document.querySelector('#setTempo').addEventListener('click', setTempo)

ipc.on('new', loadMidiFile)
ipc.on('open', loadJSON)
ipc.on('export', showExportDialog)
ipc.on('save', save)

init()
