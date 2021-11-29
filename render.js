const ipc = require('electron').ipcRenderer
const config = require('./config')

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

/* ------------------------------------
BoxGeometry Vertices Notes:

  Top Vertices in array are: 0,1 4,5
  Bottom Vertices in array are: 2,3,6,7
-------------------------------------*/
/* ----------------------------------
BoxBufferGeometry Vertices Notes: (Each face of a side is made up of 2 triangles)

  All Top Vertices: [0,1,4,5,8,9,10,11,16,17,20,21]
  All Bottom Vertices: [2,3,6,7,12,13,14,15,18,19,22,23]
    Front Side: [Top: 0,1 Bottom: 2,3]
    Back Side: [Top: 4,5 Bottom: 6,7]
    Left Side: [Top: 16,17 Bottom: 18,19]
    Right Side: [Top: 20,21 Bottom: 22,23]
    Top Side: [All Four: 8,9,10,11]
    Bottom Side: [All Four: 12,13,14,15]
---------------------------------------*/
/*Notes:
HTML Canvas sets its x,y origin (0,0) in the top left corner. Coming down from the top.
Changing the Vertex positions in Three JS makes the change relative to the center of itself (the box object).
This means that Y value appled to each vertex needs to be split in half.

---------------------------*/



let scene
let camera
let renderer
let mixer
let clock
let loader
let controls
let circle
let circles = {}
let raycaster
let counter = 0

let materials = {}
let textures = {}
let defaultTexture = new THREE.Texture()
//Original Code
let defaultMaterial = new THREE.MeshBasicMaterial({ map: defaultTexture } )
let mouseon = false
//let shineyMaterial = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) //{ map: defaultTexture }

const singleColumnWidth = 10
const colHeight = 100
const colRowCount = 4
const colDepthCount = 4
const colSpacing = singleColumnWidth * 10
const roomWidth = (colSpacing + singleColumnWidth) * colRowCount
const roomDepth = (colSpacing + singleColumnWidth) * colDepthCount
const imageColumnWidth = 40
const topVertices = [0,1,4,5,8,9,10,11,16,17,20,21]
const bottomVertices = [2,3,6,7,12,13,14,15,18,19,22,23]

let layerId = {0: [], 1: [], 2: [], 3: [], 4: []}
const totalLayers = 5 // Layers of Three JS Objects (Columns)

let active

//This count is for drawing lines
let count = 0
// For interacting with objects with mouse
let mouse = new THREE.Vector2(), INTERSECTED;
let radius = 100, theta = 0;
//-----------------------------------------------------------------
//--------------------- Utility Functions --------------------------

function distance (x1, y1, x2, y2){
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));

}

console.log(process.pid);



function setup () {
  scene = new THREE.Scene()
  // Background
  scene.background = new THREE.Color(0xf0f0f0) //0x000000
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 2, 1000)
  camera.position.z = roomDepth + 200
  camera.position.x = roomWidth -250
  camera.position.y = colHeight * 2
  renderer = new THREE.WebGLRenderer()

//The default is false
  //renderer.antialias = true

  //This is the defualt setting
  renderer.precision = 'highp'
  // This makes the geometry smoother looking
  renderer.setPixelRatio( window.devicePixelRatio );
  //renderer.setPixelRatio(window.devicePixelRatio * 1.5);

  renderer.setSize(window.innerWidth, window.innerHeight)
  loader = new THREE.TextureLoader()
  controls = new THREE.OrbitControls(camera, renderer.domElement)


  // Subtract on
  solidGeometry = new THREE.BoxBufferGeometry(singleColumnWidth - .1, colHeight+ .1, singleColumnWidth - .1)

//For Lights
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaInput = true;
	renderer.gammaOutput = true;
//For Lights
  let spotLight = new THREE.SpotLight( 0xFFffff, 1.0 );
      spotLight.position.set( 400, 200, 400 );
      spotLight.castShadow = true;
      spotLight.angle = 0.70;
      spotLight.decay = 1.5;
      spotLight.distance = 800;
      //spotLight.penumbra = 0.9;
      scene.add(spotLight);

      console.log('here');

    //Add point where SpotLight points towards
      scene.add(spotLight.target);
      spotLight.target.position.x = 0;
      spotLight.target.position.y = 0;
      spotLight.target.position.z = 0;


    //Spotlight Helper
      //var helper = new THREE.CameraHelper( spotLight.shadow.camera );
      //scene.add( helper );

    //For testing animation groups -- Not Working
      //let  animationGroup = new THREE.AnimationObjectGroup();


    //Add ground for light to shine on
      // var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
      // var groundMat = new THREE.MeshPhongMaterial({
      // color : 0xffffff,
      //   });
      // var ground = new THREE.Mesh(groundGeo, groundMat);
      // ground.rotation.x = -Math.PI / 2;
      // ground.position.y = 0;
      // ground.receiveShadow = true;
      // scene.add(ground);

  //--------------------- Create Column Objects ------------------------------
    //Create 16 Columns Start
    for (q = 0; q < totalLayers; q ++){
      let columnId = []
      for (let i = 0; i < 16; i++) {
        const z = Math.floor(i / 4)
        const x = i % 4
        const xValue = Math.round(x * colSpacing)
        const zValue = Math.round(z * colSpacing)
        // This is to prevent 'Z-Fighting'. To object overlaping the same space not rendering properly
        let sizeOffset = q * 0.1
        geometry = new THREE.BoxBufferGeometry(singleColumnWidth + sizeOffset, colHeight, singleColumnWidth + sizeOffset)
      // --------- Invisible Columns ----------
        // materials[i] = new THREE.MeshBasicMaterial({ map: defaultTexture })
        // materials[i].transparent = true
        // // Transparent Objects are invisible columns that receive the canvas images as a texture.
        // const transparentObject = new THREE.Mesh( geometry,   [materials[i], // Left side
        //                                                       materials[i], // Right side
        //                                                       defaultMaterial, // Top side
        //                                                       defaultMaterial, // Bottom side
        //                                                       materials[i], // Front side
        //                                                       materials[i] // Back side
        //                                                       ])
        // transparentObject.position.set(xValue, 0, zValue)
        //
        // //Rotate columns on Y axis
        // if( z % 2 === 0  ){
        //   if (i % 2=== 0){
        //     transparentObject.rotation.y = Math.PI / 4;
        //   }
        // } else {
        //   if(i % 2 === 1){
        //     transparentObject.rotation.y = Math.PI / 4;
        //   }
        // }
        // scene.add(transparentObject)
    // ----------------------------------------

    // --------- Visible Columns --------------
      //Adds "visible columns"
      //This creates makes a "different" geometry for each column.
          // const regularObject = new THREE.Mesh( new THREE.BoxBufferGeometry(singleColumnWidth, colHeight, singleColumnWidth), new THREE.MeshLambertMaterial( { color: 0xC0C0C0 } ))

       const regularObject = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xC0C0C0, opacity: 1, transparent: true, } ))

       //console.log(regularObject)
        //const regularObject = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xC0C0C0 } ))

        regularObject.position.set(xValue, 50, zValue)
        regularObject.material.opacity = 0

        columnId.push(regularObject.id)

      //Rotate columns on Y axis
        if( z % 2 === 0  ){
          if (i % 2=== 0){
            regularObject.rotation.y = Math.PI / 4;
          }
        } else {
          if(i % 2 === 1){
            regularObject.rotation.y = Math.PI / 4;
          }
        }

        //regularObject.type = 'Interact'

        scene.add(regularObject)
      // ---------------------------------------




        //animationGroup.add( regularObject );

      // Add Floor Squares
        // var squareGeo = new THREE.PlaneGeometry( 50, 50, 32 );
        // var squareMat = new THREE.MeshBasicMaterial( { color: 0xff0090 } );
        // square = new THREE.Mesh( squareGeo, squareMat );
        // square.rotation.x = -Math.PI / 2;
        // square.position.x = xValue;
        // square.position.z = zValue;
        // square.position.y = -49;
        // scene.add( square )
      }
      layerId[q] = columnId
    }
  //---------------------- End Create Column Objects----------------------------------------------

  //----------------------------- Create Base Columns that do not change ------------------
  for (let i = 0; i < 16; i++) {
    const z = Math.floor(i / 4)
    const x = i % 4
    const xValue = Math.round(x * colSpacing)
    const zValue = Math.round(z * colSpacing)

    const solidColumn = new THREE.Mesh( solidGeometry, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }))

    // const regularObject = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xC0C0C0 } ))

   solidColumn.position.set(xValue, 50, zValue)

 //Rotate columns on Y axis
   if( z % 2 === 0  ){
     if (i % 2=== 0){
       solidColumn.rotation.y = Math.PI / 4;
     }
   } else {
     if(i % 2 === 1){
       solidColumn.rotation.y = Math.PI / 4;
     }
   }
   solidColumn.type = 'Interact'

   // Adding the columns number to the name of the object so be able to pass it back later.
   solidColumn.name= i+1

   scene.add(solidColumn)
  }
//-----------------------------------------------------------------------------------

  //For Animation Groups and Clips -- Not Working
    // let xAxis = new THREE.Vector3( 1, 0, 0 );
  	// let qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, 0 );
  	// let qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI );
  	// let quaternionKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1, 2 ], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w, qInitial.x, qInitial.y, qInitial.z, qInitial.w ] );
    //
  	// let colorKF = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 1, 2 ], [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );
  	// let opacityKF = new THREE.NumberKeyframeTrack( '.material.opacity', [ 0, 1, 2 ], [ 1, 0, 1 ] );
    //
  	// // create clip
    //
  	// let clip = new THREE.AnimationClip( 'default', 3, [ quaternionKF, colorKF, opacityKF ] );
    //
  	// // apply the animation group to the mixer as the root object
    //
  	// mixer = new THREE.AnimationMixer( animationGroup );
    // console.log(mixer)
    //
  	// let clipAction = mixer.clipAction( clip );

  //----------------------------------------------------------------------------

  //For Drawing line
    let MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    let lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    let lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 1
      });

      line = new THREE.Line(lineGeometry, lineMaterial);
     scene.add( line );
  //----------------------------------------------------------------------------


  //This is for Detectig Where mouse is, and if it is intersecting with any objects
    raycaster = new THREE.Raycaster();
    //console.log(columnId)
    //console.log(columnId[0])
    //let bob = scene.getObjectById(columnId[0])
    //console.log(bob)
 //For Highlighting when mouse over
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

 //This is for adding a line between columns when clicking on them.
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );

  //----------------------------------------------------------------------------
    window.addEventListener( 'resize', onWindowResize, false );

    //clock = new THREE.Clock;
    document.body.appendChild(renderer.domElement)
    console.log(scene)
}
//-------------------- End Setup ------------------------------------------------

function draw () {
  requestAnimationFrame(draw)
  render();
  // This is for turning on the orbit controls
  controls.update()

  renderer.render(scene, camera)
  //console.log(scene)

}

function render(){
      //Attempting to use the Animation Groups and Clips
        // var delta = clock.getDelta();
        //
        //     if ( mixer ) {
        //
        //       mixer.update( delta );
        //       console.log(mixer)
        //
        //     }

      //------------------ Ray Caster For Intersecting with Objects -----------------------------
        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( scene.children );


        if (intersects.length) {


          mouseon = true
          //console.log(mouseon)
          //console.log(raycaster)
              let obj = intersects[interactWithit(intersects)]
              //console.log(obj.object.position)
              //console.log(obj)


      					if ( obj && INTERSECTED != obj.object  ) {

      						if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

      						INTERSECTED = obj.object;
      						INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      						INTERSECTED.material.emissive.setHex( 0xff0000 );

      					}

      				} else {

      					if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

      					INTERSECTED = null;
                mouseon = false
                //console.log(mouseon)
      				}
      //-----------------------------------------------------------------------------

}

setup()
draw()

//------------------------- Receive Data From Editor ------------------------------------

// This is to receive the Rendered CANVAS images from the editor window
// This is uesd for the Original working method.
// ipc.on('render', (event, message) => {
//   for (let i = 0; i < 16; i++) {
//     if (textures[i]) textures[i].dispose()
//     const data = new Uint8ClampedArray(message.images[i].data)
//     const imageData = new ImageData(data, 32, config.videoHeight)
//     textures[i] = new THREE.Texture(imageData)
//     textures[i].needsUpdate = true
//     materials[i].map = textures[i]
//   }
// })

// Recevive Frame Data from the editor so it can be rendered in Threejs
    ipc.on('render', (event, message) => {
      //console.log(message)


      if (message.currentFrame && message.currentFrame.length ) {
        // Loop through all layers of frame data and make a new object for each layer
        // Normalize the Frame data to the height of the columns in the Render window
        // Identify which columns the animations get applied to.
        // Determine Order of layers.
        // Need to fix the interaction wtih ray casting.
        // Need to figure out how /when to delete the shapes.
        let frameData = message.currentFrame
        let layers = frameData.length

        // This Sets all the Opacity to 0 for un-used layers of column objects.
        if (layers < totalLayers ){
          let layNotUsed = totalLayers - layers
          for (l = 0; l < layNotUsed; l++){
              let lay = (totalLayers - 1) - l
              //console.log(lay)
              let layer =  layerId[lay]
              for ( let u = 0; u < 16; u++){
                let col = layer[u]
                let column = scene.getObjectById(col)
                column.material.opacity = 0
              }
          }
        }

        //Loop for the layers in the data
        for (t = 0; t < frameData.length; t ++  ){
        //console.log('hi')
        let yValue = parseInt(frameData[t].yValue)
        let heightValue = parseInt(frameData[t].heightValue)
        let color = frameData[t].colorThree
        let opacity = frameData[t].opacityValue
        let columns = frameData[t].manualSelections
        //console.log(columns)
        //This is to change all the columns if there are no columns listen in the ManualSelections array.
        if (!columns.length) {
          columns = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]

        }
        //Set Opacity to 0 for at the begining on the painitng process
        let colIndex = layerId[t]
        //console.log(colIndex)
        for(let o = 0; o < 16; o ++){
            let col = colIndex[o]
            //console.log(col)
            let column = scene.getObjectById(col)
            column.material.opacity = 0
            //console.log(bob)
        }


        // Loop Through the Columns
        for (let p = 0; p < columns.length; p++ ){
            let col = columns[p]
                col =  col - 1
                col = colIndex[col]
              let column = scene.getObjectById(col)
              //console.log(bob)
            // Loop Through the verticies
            for (let i = 0 ; i < topVertices.length; i++){
                let topIndex = topVertices[i]
                let bottomIndex = bottomVertices[i]
                // The + 1 is to adjust only the Y component.
                let top = (topIndex * 3)+1
                let bottom = (bottomIndex *3)+1

                //console.log(yValue)
                //Change the Position of the Top and Bottom of the Columns
                column.geometry.attributes.position.array[top] = yValue
                column.geometry.attributes.position.array[bottom] = yValue -  heightValue
                column.geometry.attributes.position.needsUpdate = true

                //Change the color of the columns.
                //Color and Opacity can be changed at will and are updated automatically
                column.material.color.setStyle(color)
                column.material.opacity =  opacity
                //scene.children[column].material.needsUpdate = true

              }
        //console.log(frameData)
          }
        }
      }

    })
//----------------------------------------------------------------------------------------

function clearColumnOpacity(){
  // Should Make this function
  null
}


//------------------------------------------------------------------------------------------

function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
}

//----------------------- Highlight Column when Mouse Over ---------------------------------
// For Highlight Column when Mouse Over
function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


//This is a helper function to determine if the object the raycaster is intersecting should be 'Interactable'
function interactWithit (intersects){
  for (let i = 0; i < intersects.length; i++ ){
    if(intersects[i].object.type === 'Interact'){
      return i
    }
  }
}
//---------------------------------------------------------------------------------------------

//------------------------- Adding Lines With Click -------------------------------------------
// For Drawing lines between Columns when you click on them.
function onDocumentMouseUp ( event ){

  event.preventDefault();

  if(mouseon === true){

    addPoint(INTERSECTED.position)
    //console.log('Column Number Clicked: '+INTERSECTED.name)
    line.geometry.attributes.position.needsUpdate = true;

  }
}

// This is to add a point when drawing lines between columns.
function addPoint (point){
  //console.log(positions)
  if (count > 10) {
    count = 0
    for(let i = 0; i < positions.length; i++){
      positions[i] = 0
    }
    line.geometry.setDrawRange(0, count);
  }
  positions[count * 3 + 0 ] = point.x
  positions[count * 3 + 1] = point.y;
  positions[count * 3 + 2] = point.z;
  count++
  line.geometry.setDrawRange(0, count);
}
//---------------------------------------------------------------------------------------

//---------------- Mouse Selection Box --------------------------------------------------
// let selectionBox = new SelectionBox( camera, scene );
// let helper = new SelectionHelper( selectionBox, renderer, 'selectBox' );
//
// // This is for the Selection Box
// document.addEventListener( 'mousedown', function ( event ) {
//   controls.enabled = false
//
// 	for ( var item of selectionBox.collection ) {
// 		item.material.emissive.set( 0x000000 );
// 	}
//
// 	selectionBox.startPoint.set(
// 		( event.clientX / window.innerWidth ) * 2 - 1,
// 		- ( event.clientY / window.innerHeight ) * 2 + 1,
// 		0.5 );
// });
//
// document.addEventListener( 'mousemove', function ( event ) {
// 	if ( helper.isDown ) {
// 		for ( var i = 0; i < selectionBox.collection.length; i ++ ) {
// 			selectionBox.collection[ i ].material.emissive.set( 0x000000 );
// 		}
//
// 		selectionBox.endPoint.set(
// 			( event.clientX / window.innerWidth ) * 2 - 1,
// 			- ( event.clientY / window.innerHeight ) * 2 + 1,
// 			0.5 );
//
// 		var allSelected = selectionBox.select();
//
// 		for ( var i = 0; i < allSelected.length; i ++ ) {
// 			allSelected[ i ].material.emissive.set( 0xff0000 );
// 		}
// 	}
// });
//
// document.addEventListener( 'mouseup', function ( event ) {
//   controls.enabled = true
//
// 	selectionBox.endPoint.set(
// 		( event.clientX / window.innerWidth ) * 2 - 1,
// 		- ( event.clientY / window.innerHeight ) * 2 + 1,
// 		0.5 );
//
// 	var allSelected = selectionBox.select();
//
// 	for ( var i = 0; i < allSelected.length; i ++ ) {
// 		allSelected[ i ].material.emissive.set( 0xff0000 );
// 	}
// });
//-------------------------------------------------------------------
