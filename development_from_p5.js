

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

 canvas.width = 640
 canvas.height = 360


let data  = {   yStart: 0,
                yEnd: 300,
             // in Milli Sec
                duration: 2000,
                opacityStart: 1,
                opacityEnd: .5,
                opacity2Start: 1,
                opacity2End: .2,
                  hStart:199,
                hEnd:60,
                offsetStart: 1000,
                offsetEnd: 1000,
                secondColor: true
            }

// Sample Key Frame Data Structure

let dataSample = {
  "offsetStart": 100,
  "offsetEnd": 100,
  "offSetEase": "easeCubicOut",
  "keyFrames": [
        { "keyName": "1",
          "duration": 300,
          "y": { "ease": "easeCubicOut",
                 "start": 0,
                 "end": 180,
                 "speed": 1
                },
          "height": {
            "ease": "easeCubicOut",
            "start": 40,
            "end": 100,
            "speed": 1
          },
          "color": [
            {
              "value": "rgba(255, 0, 0, 1)",
              "opacity": {
                "ease": "easeCubicOut",
                "start": 1,
                "end": .2,
                "speed": 1
              }
            },
            {
              "value": "rgba(140, 0, 252, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": 1,
                "speed": 1

              }
            }
          ]
        },
        { "keyName": "2",
          "duration": 1000,
          "y": { "ease": "easeCubicOut",
                 "start": 180,
                 "end": 0,
                 "speed": 1
                },
          "height": {
            "ease": "easeCubicOut",
            "start": 100,
            "end": 40,
            "speed": 1
          },
          "color": [
            {
              "value": "rgba(255, 0, 0, 1)",
              "opacity": {
                "ease": "easeCubicOut",
                "start": 1,
                "end": .2,
                "speed": 1
              }
            },
            {
              "value": "rgba(140, 0, 252, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": 1,
                "speed": 1
              }
            }
          ]
        },
        { "keyName": "3",
          "duration": 500,
          "y": { "ease": "easeBounce",
                 "start": 0,
                 "end": 360,
                 "speed": 1
                },
          "height": {
            "ease": "easeCubic",
            "start": 40,
            "end": 300,
            "speed": 1
          },
          "color": [
            {
              "value": "rgba(255, 0, 0, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": .2,
                "speed": 1
              }
            },
            {
              "value": "rgba(140, 0, 252, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": 1,
                "speed": 1
              }
            }
          ]
        },
        { "keyName": "4",
          "duration": 1000,
          "y": { "ease": "easeBounce",
                 "start": 360,
                 "end": 0,
                 "speed": 1
                },
          "height": {
            "ease": "easeCubicOut",
            "start": 90,
            "end": 0,
            "speed": 1
          },
          "color": [
            {
              "value": "rgba(0, 0, 255, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": 0,
                "speed": 1
              }
            },
            {
              "value": "rgba(140, 0, 134, 1)",
              "opacity": {
                "ease": "easeCubicIn",
                "start": 1,
                "end": 1,
                "speed": 1
              }
            }
          ]
        }
      ]
}



let colSpacing = 100
let boxWidth = 360
let boxHeight = 40
//let yValue =50
let xVlaue = 0
let opacity = 0.9
//let color3 = "rgba(255, 0, 0, 1)"
//let color4 = "rgba(255, 245, 42, 1)"
let columns = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
let columns2D = [1,2,3,4,5,6,8,9,10,11,12,14,15,16]
let coords = {}
let selectedColumns = []
let startTime = (new Date()).getTime()
let cycle = 0

let count = 0


//ctx.fillStyle = color.replace(/[^\,)]+\)/, `${opacity})`);

//ctx.fillRect(xVlaue, yValue, boxWidth, boxHeight)
let cycles = 0
let offsets = 0




const draw = () => {

//-------------------------------
//-----------Chase Animation
//-- Define : Offsets


  ctx.clearRect(0, 0, 640, 360);

  let time = (new Date()).getTime() - startTime;
  let delta = time % data.duration
  //let totalDuration = data.offset * selectedColumns.length + data.duration
//--------------------------------------------
//Calculate Total Duration/ Start Times/ Key Frame Time
  let totalDuration = 0
  let totalOffset = 0
  let startTimes = {}
  let keyFrameDuration = []

  let duration = 0
  for (i = 0; i < dataSample.keyFrames.length; i ++){
    duration = duration + dataSample.keyFrames[i].duration
    keyFrameDuration.push(duration)

  }

  //console.log(keyFrameDuration)

    for (let i=0; i < groupedColumns.length; i++) {
      let offSetEase = d3.easeCubicOut(i/groupedColumns.length)
      //console.log('Column: '+i+' - '+ offSetEase)

      let offsetChange = offSetEase * ((dataSample.offsetStart - dataSample.offsetEnd) *  1 )
      //console.log('Column: '+i+' - '+ offsetChange)
      let offsetdirection = dataSample.offsetEnd - dataSample.offsetStart
  let offsetValue = offsetdirection >=0 ? (dataSample.offsetStart + (offsetChange * -1 ) ) : (dataSample.offsetStart - offsetChange);
        //console.log(i+' - '+offsetValue)

      totalOffset += offsetValue
      startTimes[i] = [totalOffset]

      for (p = 1; p < dataSample.keyFrames.length; p++){
        let previousKey = p - 1
        let keyStartTime = dataSample.keyFrames[previousKey].duration + startTimes[i][previousKey]
        startTimes[i].push(keyStartTime)
      }

    }

    totalDuration = totalOffset + duration
    //console.log(totalDuration)
    //console.log(keyFrameDuration)
  //console.log(startTimes)


//-----------------------------------------
  let totalDelta = time % totalDuration
  //console.log(totalDelta)

// This is for creating an Ease for the offset itself
  let totalNormalized = totalDelta / totalDuration

  let offSetEase = d3.easeCubicOut(totalNormalized);
  //let offSetEase = d3.easeLinear(totalNormalized);
  //console.log(offSetEase)

  let offChange = offSetEase * (dataSample.offsetStart - dataSample.offsetEnd);
  let offsetdirection = dataSample.offsetEnd - dataSample.offsetStart
  let offsetValue = offsetdirection >=0 ? (dataSample.offsetStart + offChange) : (dataSample.offsetStart - offChange);


 for (const [index, group] of groupedColumns.entries()) {

    // Unchanging Offset
    // const columnStart = data.offset * index

    // Offset Constantly Changing
     //const columnStart = offsetValue * index

    // Offset Precalculated
    const columnStart = startTimes[index][0]

    //console.log('Column: '+index+' - '+ columnStart)
    const columnEnd = columnStart + duration
    const columnDelta = totalDelta - columnStart
    //console.log('Delta'+index+': '+columnDelta)

    //Prevent animation before starttime
    if (columnDelta <= 0) continue

    //Prevent animaiton after end time
    if (columnDelta > duration) continue

    //let normalized = columnDelta / duration;
    //let easeValue = d3.easeCubicOut(normalized);
    //let easeValue = d3.easePolyOut(normalized);
    //let easeValue = d3.easeLinear(normalized);

  //------------------------------------
  // For interpreting Key Frames
    //Height variables
    let hStart
    let hEnd
    let hEase

    //Y Coordinate variables
    let yStart
    let yEnd
    let yEase

    //Color1 Opacity variables
    let color1
    let colorOp1Start
    let colorOp1End
    let colorOp1Ease

    //Color2 Opacity variables
    let color2
    let colorOp2Start
    let colorOp2End
    let colorOp2Ease


    let normalized
    let previousKeyDuration = 0

    for (let j = 0 ; j < dataSample.keyFrames.length; j++) {

      let previous = 0
      if (j > 0) {
       previous = j - 1
       previousKeyDuration =  previousKeyDuration +  dataSample.keyFrames[previous].duration
     }



     let currentKeyEnd =  dataSample.keyFrames[j].duration + startTimes[index][j]


     let currenKeyStart = previousKeyDuration
     let currentKey = dataSample.keyFrames[j];


     if (columnDelta >= currenKeyStart  && columnDelta < currentKeyEnd) {
       //console.log('here')
       hStart = currentKey.height.start
       hEnd = currentKey.height.end

       yStart = currentKey.y.start
       yEnd = currentKey.y.end

       color1 = currentKey.color[0].value
       colorOp1Start = currentKey.color[0].opacity.start
       colorOp1End = currentKey.color[0].opacity.end

       color2 = currentKey.color[1].value

       colorOp2Start = currentKey.color[1].opacity.start
       colorOp2End = currentKey.color[1].opacity.end

       // Create Ease Values
       let keyFrameDelta = totalDelta - startTimes[index][j]
       normalized = keyFrameDelta / currentKey.duration;
       yEase = d3[currentKey.y.ease](normalized)
       hEase = d3[currentKey.height.ease](normalized * .1)
       colorOp1Ease = d3[currentKey.color[0].opacity.ease](normalized )
       colorOp2Ease = d3[currentKey.color[1].opacity.ease](normalized)


     }
    }

    //let easeValue = d3.easeCubic(normalized);

//-------------------------------------

    // Change of Opacity 1
    let opacity1Change = colorOp1Ease * (colorOp1Start - colorOp1End);
    let opacity1direction = colorOp1End - colorOp1Start
    let opacity1Value = opacity1direction >=0 ? (colorOp1Start + (opacity1Change * -1 )) : (colorOp1Start - opacity1Change);

   // Change of Opacity 2
    let opacity2Change = colorOp2Ease * (colorOp2Start - colorOp2End);
   //console.log(colorOp2Ease)
    let opacity2direction = colorOp2End - colorOp2Start
    let opacity2Value = opacity2direction >=0 ? (colorOp2Start + (opacity2Change * -1 )) : (colorOp2Start - opacity2Change);

    // Change of the Height of the Rectangle
    let hChange = hEase * (hStart - hEnd);
    let hdirection = hEnd - hStart
    let hValue = hdirection >=0 ? (hStart + (hChange * -1) ) : (hStart - hChange);

    // Change of the Y position of the Rectangle
    let yChange = yEase * (yStart - yEnd);
    let ydirection = yEnd - yStart
    let yValue = ydirection <=0 ? (yStart + (yChange * -1 )) : (yStart - yChange);



  // Bottom (Second) Color - This is the rectangle that is on the Bottom layer
  for (const col of group) {
    const columnWidth = 640 / 16
    const sx = (col * columnWidth) - columnWidth
    const sy = yValue
    const columnHeight = 360

    // //Add Color Gradient
    // let gradient = ctx.createLinearGradient(320,0, 320,360);
    // gradient.addColorStop(0, 'green');
    // gradient.addColorStop(.2, 'cyan');
    // gradient.addColorStop(.6, 'purple');
    // gradient.addColorStop(1, 'pink');
    // ctx.fillStyle = gradient;

    ctx.fillStyle = color2.replace(/[^\,)]+\)/, `${opacity2Value})`);
    ctx.fillRect(sx, sy, columnWidth, hValue)
    }

   //Top (First) Color - This is the rectangle that is on the top layer

     for (const col of group) {
      const columnWidth = 640 / 16
      const sx = (col * columnWidth) - columnWidth
      const sy = yValue
      const columnHeight = 360
      //console.log('sx:'+sx)
      ctx.fillStyle = color1.replace(/[^\,)]+\)/, `${opacity1Value})`);
      ctx.fillRect(sx, sy, columnWidth, hValue)
      }


  }
//-------------------------------------------------
//-----Harminoic Wave Function

  // let amplitude = 50;
  // // in ms
  // let period = 2000;
  // //var centerX = canvas.width / 2 - myRectangle.width / 2;
  // let nextY = amplitude * Math.sin(time * 2 * Math.PI / period) + yValue;
  // console.log(nextY)
  //yValue = nextY;


//---------------------------------------------------
//-------Counter of Animation Cycles

  // currentCycle = Math.floor(time / data.duration)
  // if (currentCycle > cycles) {
  //    //console.log(currentCycle)
  //   chaseColumn = currentCycle % selectedColumns.length
  //   columns2D = [selectedColumns[chaseColumn]]
  // }
  // cycles = currentCycle



//--------------------------------------------------
//--------- Regular Animation

//   let normalized = delta / data.duration;
//   let easeValue = d3.easeCubicOut(normalized);
//   //console.log(delta)
//   let yChange = easeValue * (data.yStart - data.yEnd);
//   let direction = data.yEnd - data.yStart
//   //Find Final Y Position at this given time
//   let yValue = direction <=0 ? (data.yStart + yChange) : (data.yStart - yChange);

//   const columnWidth = 640 / 16
//   for (let i=0; i < columns2D.length; i++) {
//     const column = columns2D[i]
//     const sx = (column * columnWidth) - columnWidth
//     const sy = yValue
//     const columnHeight = 360
//     //console.log('sx:'+sx)
//     ctx.fillRect(sx, sy, columnWidth, boxHeight)

//   }
//----------------------------------------------

  window.requestAnimationFrame(draw);

}




//---------------------------------------------------------------
//----------- Code For Coordinates and Column Selection

// This creates a list of 16 columns and their respective coordinates
for (let i = 0; i < 16; i++) {
    const z = Math.floor(i / 4)
    const x = i % 4
    const xValue = Math.round(x * colSpacing)
    const zValue = Math.round(z * colSpacing)
    //console.log('('+xValue+', '+zValue+')')
    coords[columns[i]] = [xValue,zValue]
    }

console.log(coords)



//Find Slope of a Line
//((y2 - y1) / (x2 - x1))

let coordsList =  [{1:[0,0]}, {4: [300,0]}, {16: [300,300]}, {13: [0,300]},{1:[0,0]}]

//let coordsList =  [{1:[0,0]},{1:[0,0]},{4: [300,0]}]


function distance (x1, y1, x2, y2){
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  //May Need to find different method. Results can return long decimals that eventualy can differ. So May need to round in some way.
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));

}


function GetColumnSelectionList(coordsList){
  //Since Checking Pairs of points, only neet n - 1 iterations
  let iterations =  coordsList.length - 1
  if (iterations === 0) {
    // if only one coordinate in list
    selectedColumns.push(parseInt(Object.keys(coordsList[0])))
  }
  for (let i = 0; i < iterations; i++){
  let point1 = i
  let point2 = i + 1
  let points = []
  points.push(coordsList[point1])
  points.push(coordsList[point2])
  console.log('Line: '+i)
  console.log('-------------')
  let line = checkPairsOfPoints(points)
    if(i > 0 ) {
         //Removes the First item of the list if its not the first iteration
         line.shift()
     }
    for (let p = 0; p < line.length ; p++){
      selectedColumns.push(line[p])
    }

  }

}


//This function determines if a point exists between two other points
function checkPairsOfPoints ( points ){
 // If Line segment AB = AC + BC then a given point is on the line.

  let key1 = parseInt(Object.keys(points[0]))
  let key2 = parseInt(Object.keys(points[1]))
  let A = points[0][key1]
  let B = points[1][key2]
  let AB = distance(A[0],A[1],B[0],B[1])
  let results = []

 //For Determining Intersects
  for( let i = 0; i < 16; i ++) {
    //console.log(coords[i])
    let column = i+1
    let x = coords[column][0]
    let y = coords[column][1]
    let ACBC = distance(A[0],A[1],x,y) + distance(B[0],B[1],x,y)

    if (ACBC === AB) {
      //console.log('Column: '+column+' - true')
      results.push(column)
     }
  }

  //Determine Direction for chase
   if (key2 > key1) {
    console.log('Use Ascending List of Columns')
  } else if (key2 < key1) {
    results.sort((a,b)=>b-a)
    console.log('Use Descending List of Columns')
  } else {
    console.log('Points are equal' )
    //Push Column Twice Since the Collumn was Selected ?
    results.push(results[0])
    return results
  }

  //console.log(results)


  return results
}

GetColumnSelectionList(coordsList)

console.log(selectedColumns)

 //let groupedColumns = [[1,2,3],[4,5,6],[7,8,9],[10,11,12],[13,14,15],[16],[15],[14],[13],[12],[11],[10],[9],[8],[7],[6],[5],[4],[3],[2],[1]]

let groupedColumns = [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[15],[14],[13],[12],[11],[10],[9],[8],[7],[6],[5],[4],[3],[2],[1]]

//let groupedColumns = [[1],[2],[3],[4],[5]]

let bob = {type: 'sequence',
    manualSelections:  [[1],[1,2,3],[4,5,6],[3,15,2,5],[13,2,4,3,4,10]]
}

  draw();
