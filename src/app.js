const eases = require('d3-ease')

const timeline = document.getElementById('timeline')
const PROGRAMS = require('./programs')
const {
  clearProgramActive,
  clearNoteActive,
  clearProgramParams,
  renderProgramParam
} = require('./utils')

const LENGTH_DEFAULT = 10

let Project = require('./project')
let selectedNotes = []

const getNoteElem = (byteIndex) => document.querySelector(`.note[data-byte-index="${byteIndex}"]`)
const getMidiEvent = (byteIndex) => Project.midiEvents.find(e => e.byteIndex == byteIndex)
const getMidiRange = (start, end) => {
  return Project.midiEvents.filter(e => {
    if (e.name !== 'Note on') return false
    return e.byteIndex > start && e.byteIndex < end
  })
}

const drawProgramList = (programs) => {
  clearProgramParams()
  const programListElem = document.getElementById('program-list')
  programListElem.innerHTML = ''

  programs.forEach((p, idx) => {
    const programElem = document.createElement('div')
    programElem.className = 'program-item'

    const remove = document.createElement('div')
    remove.className = 'close'
    programElem.appendChild(remove)
    remove.addEventListener('click', (event) => {
      event.stopPropagation()
      programs.splice(idx, 1)
      if (!programs.length) {
        selectedNotes.forEach((note) => {
          const elem = getNoteElem(note.byteIndex)
          elem.classList.remove('not-empty')
        })
      }
      drawProgramList(programs)
    })

    const select = document.createElement('select')
    Object.keys(PROGRAMS).forEach((name) => {
      const option = document.createElement('option')
      option.text = name
      select.add(option)
    })
    if (p.name) select.value = p.name

    const drawActiveProgram = () => {
      clearProgramActive()
      programElem.classList.add('active')

      const programParamElem = document.getElementById('program-params')
      programParamElem.innerHTML = ''

      const programName = select.value
      PROGRAMS[programName].renderParams({
        params: p.params,
        parent: programParamElem
      })

      const easeSelectLabel = document.createElement('label')
      easeSelectLabel.innerHTML = 'Easing:'
      const easeSelect = document.createElement('select')
      Object.keys(eases).forEach((ease) => {
        const option = document.createElement('option')
        option.text = ease
        easeSelect.add(option)
      })
      if (p.params.ease) easeSelect.value = p.params.ease
      easeSelect.addEventListener('input', () => {
        p.params.ease = easeSelect.value
      })
      renderProgramParam({
        label: 'Easing:',
        inputElem: easeSelect,
        parent: programParamElem
      })

      const columnInput = document.createElement('input')
      columnInput.value = p.columns.length ? p.columns.toString() : ''
      columnInput.oninput = () => {
        const values = JSON.parse('[' + columnInput.value + ']')
        //TODO: validate
        p.columns = values
      }
      renderProgramParam({
        label: 'Columns:',
        inputElem: columnInput,
        parent: programParamElem
      })

      const canvas = document.getElementById('preview')
      const ctx = canvas.getContext('2d')
      const rect = canvas.parentNode.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height

      let delta = 0
      const animate = () => {
        if (programElem.classList.contains('active') && programElem.parentNode)
          window.requestAnimationFrame(animate)

        if (delta > p.params.length) delta = 0
        else delta += 1

        canvas.width = canvas.width
        const cnvs = PROGRAMS[programName].run({ height: canvas.height, width: canvas.width, delta, ...p.params })
        ctx.drawImage(cnvs, 0, 0)
      }

      window.requestAnimationFrame(animate)
    }

    select.addEventListener('input', () => {
      p.name = select.value
      drawActiveProgram()
    })
    programElem.addEventListener('click', drawActiveProgram)
    programElem.appendChild(select)
    programListElem.appendChild(programElem)
  })

  const addProgramElem = document.createElement('div')
  addProgramElem.className = 'program-item'
  addProgramElem.innerHTML = 'Add Program'
  addProgramElem.addEventListener('click', () => {
    const firstProgram = Object.keys(PROGRAMS)[0]
    if (!programs.length) {
      selectedNotes.forEach((note) => {
        const elem = getNoteElem(note.byteIndex)
        elem.classList.add('not-empty')
      })
    }
    programs.push({ name: firstProgram, params: { length: LENGTH_DEFAULT }, columns: [] })
    drawProgramList(programs)
  })
  programListElem.appendChild(addProgramElem)
}

const drawMeasure = (measureNumber) => {
  const elem = document.createElement('div')
  elem.className = 'measure'
  elem.dataset.measureNumber = measureNumber
  timeline.appendChild(elem)
}

const renderApp = ({ Player }) => {
  timeline.innerHTML = '' //clear timeline

  const totalTicks = Player.totalTicks
  const measureLength = Player.division * 4
  const totalMeasures = Math.ceil(totalTicks / measureLength)
  console.log(`Total ticks: ${totalTicks}`)
  console.log(`Division: ${Player.division}`)
  console.log(`Tempo: ${Player.tempo}`)
  console.log(`Measures: ${totalMeasures}`)

  document.getElementById('tempo').innerHTML = `Tempo: ${Player.tempo}`
  document.getElementById('division').innerHTML = `Division: ${Player.division}`

  const drawNote = (midiEvent) => {
    const elem = document.createElement('div')
    elem.className = 'note'

    if (midiEvent.programs.length) elem.classList.add('not-empty')
    const measureNumber = Math.floor(midiEvent.tick / measureLength) + 1
    const parent = document.querySelector(`.measure:nth-child(${measureNumber})`)
    const position = ((midiEvent.tick % measureLength) / measureLength) * 100
    elem.setAttribute('style', `left: ${position}%;`)
    elem.dataset.byteIndex = midiEvent.byteIndex
    parent.appendChild(elem)
  }

  const loadNote = (event) => {
    if (!event.metaKey && !event.shiftKey) clearNoteActive()
    clearProgramParams()
    event.target.classList.add('active')
    const { byteIndex } = event.target.dataset
    const midiEvent = getMidiEvent(byteIndex)

    if (event.metaKey) selectedNotes.push(midiEvent)
    else if (event.shiftKey && selectedNotes.length) {
      const lastNote = selectedNotes[selectedNotes.length - 1]

      const start = Math.min(byteIndex, lastNote.byteIndex)
      const end = Math.max(byteIndex, lastNote.byteIndex)
      const notes = getMidiRange(start, end)

      notes.forEach((n) => {
        const elem = getNoteElem(n.byteIndex)
        elem.classList.add('active')
      })

      selectedNotes = selectedNotes.concat(notes)
      selectedNotes.push(midiEvent)

      // get all the values in between
    } else selectedNotes = [midiEvent]

    // set program var
    let { programs } = selectedNotes[0]
    programs = programs.slice(0)

    // check if equal
    let matchingPrograms = true
    for (let i=0; i < selectedNotes.length; i++) {
      let p = selectedNotes[i].programs
      if (JSON.stringify(p) !== JSON.stringify(programs)) {
        matchingPrograms = false
        break
      }
    }

    if (!matchingPrograms) programs = []

    // set selectedNotes to program
    selectedNotes.forEach((note) => {
      if (!programs.length) {
        const elem = getNoteElem(note.byteIndex)
        elem.classList.remove('not-empty')
      }
      note.programs = programs
    })
    drawProgramList(programs)
  }

  for (let i=1; i<=totalMeasures;i++) {
    drawMeasure(i)
  }

  for (let i=0; i < Project.midiEvents.length; i++) {
    const midiEvent = Project.midiEvents[i]
    if (midiEvent.name !== 'Note on') continue
    midiEvent.programs = midiEvent.programs || []
    drawNote(midiEvent)
  }

  const noteElems = document.querySelectorAll('.note')
  noteElems.forEach((elem) => elem.addEventListener('click', loadNote))
}

module.exports = {
  renderApp
}