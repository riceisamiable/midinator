const ffmpeg = require('fluent-ffmpeg')

const ImportedProgram = require('../importedprogram')
const progressElem = document.getElementById('progress')

let ProgramWrapper = {
  _index: {
    'solid': require('./solid')
  }
}

ProgramWrapper.run = function (name, params) {
  return this._index[name].run(params)
}

ProgramWrapper.runTest = function (name, params, columns) {
  return this._index[name].runTest(params, columns)
}

ProgramWrapper.renderParams = function(name, params) {
  return this._index[name].renderParams(params)
}

ProgramWrapper.load = async function(filepaths) {
  progressElem.removeAttribute('value')
  //debugger;
  for (let i=0; i < filepaths.length; i++) {
    const filepath = filepaths[i]
    const importedprogram = new ImportedProgram(filepath)
    if (!this._index[importedprogram.filename]) {
      this._index[importedprogram.filename] = importedprogram
      await importedprogram.load()

    }
  }
  await preRender()
   //preRender()
  progressElem.value = 0
}

ProgramWrapper.list = function () {
  return Object.keys(this._index)
}

module.exports = ProgramWrapper
