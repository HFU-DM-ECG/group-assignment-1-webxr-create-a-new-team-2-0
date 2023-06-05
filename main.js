import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, camera, scene, renderer, geometry, material, mesh, spaceSphere, gate, time, portal, controller, reticle;

const manager = new THREE.LoadingManager();

let xenon_Gate_Loaded = false;
let space_Loaded = false;

var materialPhong = new THREE.MeshPhongMaterial();

manager.onLoad = function (url){
  if (url == './assets/models/xenon_Gate.gltf')
    {
      xenon_Gate_Loaded = true;
    }
  if (url == './assets/models/space_Sphere.gltf')
    {
      space_Loaded = true;
    }
};

let modelLoader = new GLTFLoader(manager);
let loader = new THREE.TextureLoader();
let texture = loader.load('./assets/images/AlternateUniverse.png');

let hitTestSource = null;
let hitTestSourceRequested = false;
let xr_mode = "xr";

let randomModels = [
"./assets/models/portalmodel.glb", 
"./assets/models/star_of_sun.glb", 
"./assets/models/mercury_planet.glb", 
"./assets/models/purple_planet.glb",
"./assets/models/saturn_planet.glb",
"./assets/models/death_row_spaceship.glb", 
"./assets/models/intergalactic_spaceship_only_model.glb", 
"./assets/models/spaceship.glb",
"./assets/models/pod.glb"
]

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
  document.getElementById("ARButton").addEventListener("click", () => xr_mode = "ar");
  document.getElementById("VRButton").addEventListener("click", () => xr_mode = "vr");
  //

  addObjects();
  animate();
  //

  window.addEventListener( 'resize', onWindowResize );

}

function addObjects() {
    gate = new THREE.Object3D();
    modelLoader.load('./assets/models/xenon_Gate.gltf', function (gltf) {
      gate = gltf.scene;
      gate.name = "gate";
      gate.position.set(0, 0.20, -0.3);
      gate.scale.set(0.2, 0.2, 0.2);
      scene.add(gate);
      xenon_Gate_Loaded = true;
    }, undefined, function (error) {
      console.error(error);
    })

    spaceSphere = new THREE.Object3D();
    modelLoader.load('./assets/models/space_Sphere.gltf', function (gltf) {
      spaceSphere = gltf.scene;
      spaceSphere.name = "spaceSphere";
      spaceSphere.position.set(0, 0, 0);
      spaceSphere.scale.set(1, 1, 1);
      spaceSphere.rotation.set(5, 5, 5);
      spaceSphere.renderOrder = 1;
      scene.add(spaceSphere);
      space_Loaded = true;
    }, undefined, function (error) {
    console.error(error);
    })

    portal = new THREE.CircleGeometry( 1.3, 32 ); 
    material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
    });

    mesh = new THREE.Mesh(portal, materialPhong.clone());
    mesh.material.side = THREE.DoubleSide;
    mesh.material.colorWrite = false;
    mesh.renderOrder = 2;
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.position.set(0, 0.2, -0.3);
    scene.add(mesh);




    geometry = new THREE.Object3D();
				function onSelect() {

					if ( reticle.visible ) {

            let randomScale = Math.random() * 0.1;
            let randomRotate = Math.random() * 360;

            geometry = new THREE.Object3D();
              modelLoader.load(randomModels[Math.floor(Math.random() * randomModels.length)], function (gltf) {
                geometry.add(gltf.scene.children[0]);
                geometry.name = "random_model";
                reticle.matrix.decompose( geometry.position, geometry.quaternion, geometry.scale );

                geometry.scale.set(randomScale, randomScale, randomScale);
                geometry.rotation.set(randomRotate, randomRotate, randomRotate);
                scene.add(geometry);
            }, undefined, function (error) {
                console.error(error);
            })
					}
				}

				controller = renderer.xr.getController( 0 );
				controller.addEventListener( 'select', onSelect );
				scene.add( controller );

				reticle = new THREE.Mesh(
					new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
					new THREE.MeshBasicMaterial()
				);
				reticle.matrixAutoUpdate = false;
				reticle.visible = false;
				scene.add( reticle );
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
  if(gate && mesh && spaceSphere && xenon_Gate_Loaded == true && space_Loaded == true){
    const currentTime = Date.now() / 1000; 
    time = currentTime;
      
    gate.traverse( function( child ) {
      if ( child instanceof THREE.Mesh ) {
  
          child.material.emissiveIntensity = Math.sin(time)*0.2+1.3; // Adjust brightness
          const emissiveR = Math.floor((((Math.cos(time)+1)/2)*255)); // " + (((Math.sin(time/1000)+1)/2)*255) + "
          const emissiveG = Math.floor((((Math.sin(time)+1)/2)*255));
          const emissiveB = Math.floor((((Math.cos(time+77.0)+1)/2)*255));
          const emissiveRGB = "rgb(" + emissiveR + "," + emissiveG +","+ emissiveB + ")" ;
          child.material.emissive = new THREE.Color(emissiveRGB); // Adjust Color "rgb(0, 255, 0)"
        }
    } );
  
    animateObject(gate, 1, 1, 0, time, "position");
    animateObject(mesh, 1, 1, 0, time, "position");
    animateObject(mesh, 1, 1, 0, time, "rotation");
    animateObject(gate.children[1], 1, 1, 0, -1.5*time, "rotation"); // gate.children[0] is the Outer ring of the Gate model. gate.children[1] is the inner ring.
    animateObject(mesh, 1, 0.005, 0, 0.15*time, "scale");
  }

  requestAnimationFrame(animate);
  renderer.setAnimationLoop( render );

}

function render( timestamp, frame ) {
  if (xr_mode == "ar") {  
  if ( frame ) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if ( hitTestSourceRequested === false ) {
        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
          session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
            hitTestSource = source;
          } );
        } );
        session.addEventListener( 'end', function () {
          hitTestSourceRequested = false;
          hitTestSource = null;
        } );
        hitTestSourceRequested = true;
      }

      if ( hitTestSource ) {
        const hitTestResults = frame.getHitTestResults( hitTestSource );
        if ( hitTestResults.length ) {
          const hit = hitTestResults[ 0 ];
          reticle.visible = true;
          reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
        } else {
          reticle.visible = false;
        }
      }
    }
  }

  material.uniforms.uTime.value += 0.01;
  material.uniforms.uResolution.value.set(
    renderer.domElement.width,
    renderer.domElement.height
  );

  renderer.render( scene, camera );
}