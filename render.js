const ipc = require('electron').ipcRenderer
const config = require('./config')

let scene
let camera
let renderer
let loader
let controls

let materials = {}
let textures = {}
let defaultTexture = new THREE.Texture()
let defaultMaterial = new THREE.MeshBasicMaterial({ map: defaultTexture })

const singleColumnWidth = 10
const colHeight = 100
const colRowCount = 4
const colDepthCount = 4
const colSpacing = singleColumnWidth * 10
const roomWidth = (colSpacing + singleColumnWidth) * colRowCount
const roomDepth = (colSpacing + singleColumnWidth) * colDepthCount
const imageColumnWidth = 40


function setup () {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 2, 1000)
  camera.position.z = roomDepth
  camera.position.x = roomWidth
  camera.position.y = colHeight * 2
  renderer = new THREE.WebGLRenderer()
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



   // Add ground for light to shine on
      var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
      var groundMat = new THREE.MeshPhongMaterial({
      color : 0xffffff,
        });
      var ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -50;
      ground.receiveShadow = true;
      scene.add(ground);

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
    scene.add(transparentObject)

    const regularObject = new THREE.Mesh( geometry, defaultMaterial)
    regularObject.position.set(xValue, 0, zValue)
    scene.add(regularObject)
    //scene.add(regularObject)
  }

  document.body.appendChild(renderer.domElement)
}

function draw () {
  requestAnimationFrame(draw)
  controls.update()
  renderer.render(scene, camera)
}

setup()
draw()

ipc.on('render', (event, message) => {
  for (let i = 0; i < 16; i++) {
    if (textures[i]) textures[i].dispose()
    const data = new Uint8ClampedArray(message.images[i].data)
    const imageData = new ImageData(data, 40, config.videoHeight)
    textures[i] = new THREE.Texture(imageData)
    textures[i].needsUpdate = true
    materials[i].map = textures[i]
  }
})
