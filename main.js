import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
let modelLoader = new GLTFLoader();
let container, camera, scene, renderer, geometry, material, mesh, spaceSphere, gate, time;
let loader = new THREE.TextureLoader();
let texture = loader.load('./assets/images/AlternateUniverse.png');

init();

async function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
  camera.position.set(0, 0, 3);

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(0, 10, 0);
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  //
  document.getElementById("buttonContainer").appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );
  document.getElementById("buttonContainer").appendChild( VRButton.createButton( renderer ) );
  //

  addObjects();
  animate();
  //

  window.addEventListener( 'resize', onWindowResize );

}

function addObjects() {
    geometry = new THREE.CircleGeometry( 0.95, 32 ); 
    material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.material.side = THREE.DoubleSide;
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.position.set(0, 0.2, -0.3);
    scene.add(mesh);

    gate = new THREE.Object3D();
    modelLoader.load('./assets/models/Xenon_Gate.gltf', function (gltf) {
      gate = gltf.scene;
      gate.name = "gate";
      scene.add(gate);
      gate.position.set(0, 0.21, -0.3);
      gate.scale.set(0.2, 0.2, 0.2);

    }, undefined, function (error) {
      console.error(error);
    })

    spaceSphere = new THREE.Object3D();
    modelLoader.load('./assets/models/Space_Sphere.gltf', function (gltf) {
      spaceSphere = gltf.scene;
      spaceSphere.name = "spaceSphere";
      scene.add(spaceSphere);
      spaceSphere.position.set(0, 0, 0);
      spaceSphere.scale.set(1, 1, 1);
      spaceSphere.rotation.set(5, 5, 5);
    }, undefined, function (error) {
      console.error(error);
    })
}

function animateObject(object, freq, amplitude, delay, currentTime, transform) { 
  switch (transform) {
    case "position":
        window.setTimeout(() => {
          var midPosition = object.position.y;
          object.position.y = midPosition + (Math.sin(currentTime * freq) * amplitude * 0.001);
        }, delay);
      break;
    case "rotation":
      window.setTimeout(() => {
        object.rotation.z = currentTime / 2;
      }, delay);
    break;
    case "scale":
      window.setTimeout(() => {
        object.scale.set((Math.sin(currentTime * freq) * amplitude) + 0.08, (Math.sin(currentTime * freq) * amplitude) + 0.08, 0);
      }, delay);
    break;
    default:
      break;
  }

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {
  const currentTime = Date.now() / 1000; 
  time = currentTime;
    
  gate.traverse( function( child ) {
    if ( child instanceof THREE.Mesh ) {

        child.material.emissiveIntensity = Math.sin(time * 0.25) * 0.4 + 0.8; // Adjust brightness
        child.material.emissive = new THREE.Color(0xFFFFFF); // Adjust Color
      }
  } );

  animateObject(gate, 1, 1, 0, time, "position");
  animateObject(mesh, 1, 1, 500, time, "position");
  animateObject(mesh, 1, 1, 0, time, "rotation");
  animateObject(gate.children[1], 1, 1, 0, -1.5*time, "rotation"); // gate.children[0] is the Outer ring of the Gate model. gate.children[1] is the inner ring.
  animateObject(mesh, 10, 0.005, 0, 0.1*time, "scale");
  requestAnimationFrame(animate);
  renderer.setAnimationLoop( render );

}

function render( timestamp, frame ) {

  material.uniforms.uTime.value += 0.01;
  material.uniforms.uResolution.value.set(
    renderer.domElement.width,
    renderer.domElement.height
  );

  renderer.render( scene, camera );

}