const config = require('../config')


const convertCoordsToColumn = (x, y) => {
  const rows = config.totalColumns / config.columnWidth
  let row = y % rows
  if (!row) row = rows
  return x + (y * row)
}

const randomWalk = ({ delta, length }) => {
  const t = delta / length

  const totalSteps = config.totalColumns
  const column = Math.round(Math.random() * totalSteps)
  return [column]
}

const slide = ({ delta, length }) => {
  const loops = 1

  const t = delta / length
  const totalSteps = config.totalColumns / config.columnWidth
  const step = Math.floor(t * totalSteps)
  const base = [1, 2, 3, 4]
  const columns = base.map(c => (c + (step * totalSteps)))
  return columns
}

const manual = ({ manualSelections, columns }) => {
  const c = manualSelections || columns || {}
  return Object.keys(c).map(c => parseInt(c, 10))
}

let sequenceSteps = []

const sequence = ({ manualSelections, delta, offsetEnd, offsetStart, sequenceSelections }) => {
  const c = manualSelections  || {}
  return Object.keys(c).map(c => parseInt(c, 10))
  // should return the appropriate array of columns for this given moment

  // Im pretty sure that the place that this is interpreted for a given moment is solid.js 
}

//  [ [1],[1,2,3],[4,5,6],[3,15,2,5],[13,2,4,3,4,10] ]

const columnFns = {
  manual,
  sequence,
  slide,
  randomWalk
}

const getColumns = ({ type, delta, ...params }) => {
  if (!type) {
    return manual({ delta, ...params })
  }

  const columnFn = columnFns[type]
  return columnFn({ delta, ...params })
}

const renderColumns = ({ cnvs, ctx, columns }) => {
  const columnWidth = config.videoWidth / config.totalColumns
  for (let i=0; i < columns.length; i++) {
    const column = columns[i]
    const sx = (column * columnWidth) - columnWidth
    const sy = 0
    const columnHeight = config.videoHeight
    const dx = sx
    const dy = sy
    ctx.drawImage(
      cnvs, sx, sy, columnWidth, columnHeight,
      dx, dy, columnWidth, columnHeight
    )
  }
}

const isColumnActive = (columnNumber, params) => {
  const columns = getColumns(params)
  return columns.includes(columnNumber)
}

/*
   columnParams = {
     type: 'manual',
     manualSelections: {},
     params: {}
   }
*/

//Reorders the Columns in a sequence when a column in the sequence is removed
function reorderColumnLabels (sequenceSteps){
  for (i = 0; i < sequenceSteps.length; i ++ ){
    let div = sequenceSteps[i][0]
    document.getElementById(div).innerHTML = i+1
  }

}

//Clears Sequence titles / numbers when the clear button is pressed
function clearSeqTitles (){
   sequenceSteps = []
  for (i = 1; i < config.totalColumns + 1; i ++ ){
    let div = i
    document.getElementById(div).innerHTML = ''
  }

}

//---------------------------------------------------------------------
// Create the Elements/Buttons to select Columns and Column Sequences
const renderColumnParams = ({ programParamElem, program }) => {
  let { columnParams } = program

  if (!columnParams) {
    columnParams = program.columnParams = { type: 'manual', manualSelections: {} }
  }

  if (program.columns) columnParams.manualSelections = program.columns

  const columnParamsElem = document.createElement('div')
  columnParamsElem.className = 'column-params'

  const columnInputs = document.createElement('div')
  columnInputs.className = 'column-container'



  let delta = 0
  const animate = () => {
    if (programParamElem.parentNode) window.requestAnimationFrame(animate)

    if (delta >= program.params.length) delta = 0
    else delta += 1

    const columnInputElems = document.querySelectorAll('.column-container .column')
    columnInputElems.forEach((elem, index) => {
      const columnActive = isColumnActive((index + 1), { delta, ...program.params, ...columnParams })
      if (columnActive)
        elem.classList.add('active')
      else
        elem.classList.remove('active')
    })
  }

  window.requestAnimationFrame(animate)

  var isClick = false;
  let firstClick


  for (let i=1; i < (config.totalColumns + 1); i++) {
    const columnInput = document.createElement('div')
    const columnLabel = document.createElement('div')
    columnLabel.classList.add('columnLabel')
    columnLabel.setAttribute("id", i );
    columnInput.appendChild(columnLabel)
    columnInput.className = 'column'

    columnInput.addEventListener('mousedown', (event) => {
      isClick = true;

      if (columnParams.type !== 'manual' && columnParams.type !== 'sequence') return event.stopPropagation()

      if (columnParams.manualSelections[i]) {

        delete columnParams.manualSelections[i]
        columnInput.classList.remove('active')

        // Remove Column in sequence - Mouse Down
        if (columnParams.type === 'sequence') {
          let index = parseInt(columnLabel.innerHTML, 10) - 1
          sequenceSteps.splice(index, 1)
          columnLabel.innerHTML = ''
          //Re Order the Remaining Columns in Sequence
          if (sequenceSteps.length > 0){
            reorderColumnLabels(sequenceSteps)
          }
        }

      } else {
        columnParams.manualSelections[i] = true
        //console.log(i)
        columnInput.classList.add('active')

        //Add Column in Sequence
        if (columnParams.type === 'sequence') {
          let seqStep = [i]
          sequenceSteps.push(seqStep)
          let count = sequenceSteps.length
          columnLabel.innerHTML = count
          console.log(sequenceSteps)
        }

      }



    })

    columnInput.addEventListener('mouseup', (event) => {
      isClick = false;

    })

    columnInput.addEventListener('mouseover', (event) => {

      if(!isClick) return;

      if (columnParams.type !== 'manual' && columnParams.type !== 'sequence') return event.stopPropagation()

          if (columnParams.manualSelections[i]) {
            delete columnParams.manualSelections[i]
            columnInput.classList.remove('active')

            // Remove Column in sequence - Mouse Over
            if (columnParams.type === 'sequence') {
              let index = parseInt(columnLabel.innerHTML, 10) - 1
              sequenceSteps.splice(index, 1)
              columnLabel.innerHTML = ''
              //Re Order the Remaining Columns in Sequence
              if (sequenceSteps.length > 0){
                reorderColumnLabels(sequenceSteps)
              }

            }

          } else {
            columnParams.manualSelections[i] = true
            //console.log(columnParams.manualSelections)
            columnInput.classList.add('active')

            //Add Column in Sequence
            if (columnParams.type === 'sequence') {
              let seqStep = [i]
              sequenceSteps.push(seqStep)
              let count = sequenceSteps.length
              columnLabel.innerHTML = count
            }
          }
    })
    columnInputs.appendChild(columnInput)


  }

  const clearColumnsButton = document.createElement('button')
  clearColumnsButton.innerText = 'Clear'
  clearColumnsButton.addEventListener('click', () => {
    columnParams.manualSelections = {}
    clearSeqTitles()
  })
  clearColumnsButton.disabled = columnParams.type !== 'manual' && columnParams.type !== 'sequence'

  const columnSelect = document.createElement('select')
  Object.keys(columnFns).forEach((type) => {
    const option = document.createElement('option')
    option.text = type
    //console.log(option)
    columnSelect.add(option)
  })
  if (columnParams.type) columnSelect.value = columnParams.type
  columnSelect.addEventListener('input', () => {
    columnParams.type = columnSelect.value
    clearColumnsButton.disabled = columnParams.type !== 'manual' && columnParams.type !== 'sequence'

  })
  columnParamsElem.appendChild(columnSelect)

  columnParamsElem.appendChild(columnInputs)
  columnParamsElem.appendChild(clearColumnsButton)
  programParamElem.appendChild(columnParamsElem)
}



module.exports = {
  getColumns,
  renderColumns,
  renderColumnParams
}
