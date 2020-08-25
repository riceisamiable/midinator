  const ipc = require('electron').ipcRenderer
const config = require('./config')



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

//This count is for drawing lines
let count = 0



//Utility Functions

function distance (x1, y1, x2, y2){
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));

}

console.log(process.pid);

let mouse = new THREE.Vector2(), INTERSECTED;
let radius = 100, theta = 0;

function setup () {
  scene = new THREE.Scene()
  // Background
  scene.background = new THREE.Color(0xf0f0f0) //0x000000
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 2, 1000)
  camera.position.z = roomDepth
  camera.position.x = roomWidth
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

  geometry = new THREE.BoxGeometry(singleColumnWidth, colHeight, singleColumnWidth)

//For Lights
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaInput = true;
	renderer.gammaOutput = true;
//For Lights
  var spotLight = new THREE.SpotLight( 0xFFffff, 1.0 );
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

  /*for (let i = 0; i < 16; i++) {
      var criclex = Math.random() * 300;
      var criclez = Math.random() * 300;


      var circleGeo = new THREE.PlaneGeometry( 5, 20, 32 );
      var circleMat = new THREE.MeshBasicMaterial( { color: 0xff0090 } );
      circle = new THREE.Mesh( circleGeo, circleMat );
      circle.rotation.x = -Math.PI / 2;
      circle.position.x = criclex;
      circle.position.z = criclez;
      circle.position.y = -40;

      circles[i] = circle;

      //console.log(circles[i])
      //circles.push( new ci)

      scene.add( circle )

    }*/




   // Add ground for light to shine on
      // var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
      // var groundMat = new THREE.MeshPhongMaterial({
      // color : 0xffffff,
      //   });
      // var ground = new THREE.Mesh(groundGeo, groundMat);
      // ground.rotation.x = -Math.PI / 2;
      // ground.position.y = -50;
      // ground.receiveShadow = true;
      // scene.add(ground);


  for (let i = 0; i < 16; i++) {
    const z = Math.floor(i / 4)
    const x = i % 4
    const xValue = Math.round(x * colSpacing)
    const zValue = Math.round(z * colSpacing)

    materials[i] = new THREE.MeshBasicMaterial({ map: defaultTexture })
    materials[i].transparent = true
    const transparentObject = new THREE.Mesh( geometry, [
      materials[i], // Left side
      materials[i], // Right side
      defaultMaterial, // Top side
      defaultMaterial, // Bottom side
      materials[i], // Front side
      materials[i] // Back side
    ])
    transparentObject.position.set(xValue, 0, zValue)

  //Rotate columns on Y axis
  if( z % 2 === 0  ){
    if (i % 2=== 0){
      transparentObject.rotation.y = Math.PI / 4;
  }
} else {
  if(i % 2 === 1){
    transparentObject.rotation.y = Math.PI / 4;
  }
}

    scene.add(transparentObject)


  //   //Adds "visible columns"

    const regularObject = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xC0C0C0 } ))
    regularObject.position.set(xValue, 0, zValue)

    //console.log(z % 2  );

    if( z % 2 === 0  ){
      if (i % 2=== 0){
        regularObject.rotation.y = Math.PI / 4;
    }
  } else {
    if(i % 2 === 1){
      regularObject.rotation.y = Math.PI / 4;
    }
  }
    //}
    regularObject.type = 'Interact'

    //console.log(materials[i])
    //console.log(regularObject)
    //console.log(regularObject)

    scene.add(regularObject)

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


//Box Verticies Notes:
// Top Verticies in array are: 0,1 4,5
// Bottom Verticies in array are: 2,3,6,7

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


// let linematerial = new THREE.LineBasicMaterial({
// 	color: 0x0000ff,
//   linewidth: 10
// });
//
// var points = [];
// points.push( new THREE.Vector3( 300, 0, 300 ) );
// points.push( new THREE.Vector3( 300, 0, 200 ) );
//
// var linegeometry = new LineGeometry();
// linegeometry.setPositions( points );
//
// var bop = new Line2 ( linegeometry, linematerial );
// scene.add( bop );


//For Detectig Where mouse is
  raycaster = new THREE.Raycaster();
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  window.addEventListener( 'resize', onWindowResize, false );

  clock = new THREE.Clock;

  document.body.appendChild(renderer.domElement)
}

function draw () {
  requestAnimationFrame(draw)
  render();
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


  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( scene.children );
  //console.log(intersects)

  if ( intersects.length > 0 ) {



    mouseon = true
    //console.log(mouseon)
    //console.log(raycaster)
        let obj = intersects[interactWithit(intersects)]
        //console.log(obj.object.position)

					if ( INTERSECTED != obj.object ) {

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


//Circles
  // for (let i = 0; i < 16; i++ ){
  //   console.log(circles[i].position.x)
  //
  //   circles[i].position.x = circles[i].position.x + 1;
  //   circles[i].position.z = circles[i].position.z + 1;
  //  }


}


setup()
draw()

ipc.on('render', (event, message) => {
  for (let i = 0; i < 16; i++) {
    if (textures[i]) textures[i].dispose()
    const data = new Uint8ClampedArray(message.images[i].data)
    const imageData = new ImageData(data, 32, config.videoHeight)
    textures[i] = new THREE.Texture(imageData)
    textures[i].needsUpdate = true
    materials[i].map = textures[i]
  }
})



function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onDocumentMouseUp ( event ){

  event.preventDefault();

  if(mouseon === true){

    addPoint(INTERSECTED.position)
    console.log(INTERSECTED.position)
    line.geometry.attributes.position.needsUpdate = true;

  }
}

function interactWithit (intersects){
  for (let i = 0; i < intersects.length; i++ ){
    if(intersects[i].object.type === 'Interact'){
      return i
    }
  }
}


function addPoint (point){
  console.log(positions)
  if (count > 2) {
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
