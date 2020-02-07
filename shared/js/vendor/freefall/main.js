// --
var camera, scene, renderer, controls;

// global flag that can be set true to render
var renderNeeded = true;

var atlas;
var windowWidth = window.innerWidth,
  windowHeight = window.innerHeight;
var rendererWidth, rendererHeight;

function appStart() {
  // setup the atlas
  atlas = new Atlas(params);
  scene.add(atlas.container);
  atlas.loadAllStatics(params, function(){
    console.log('Loaded all statics.');
    onLoadAllStatics();
  }, function(pct){
    console.log(Math.round(pct*100)+'% loaded...');
  });
}

function setup(width, height) {
  // init threejs base items
  initTHREE(width, height);

  appStart();
}

function initTHREE(width, height) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100000);

  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true
    // alpha: true,
    // antialias:true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  var c = new THREE.Color(params.clearColor);
  renderer.setClearColor(c);

  renderer.setSize(width, height);
  var container = document.getElementsByClassName('cilex-content')[0];
  container.appendChild(renderer.domElement);
  rendererWidth = width;
  rendererHeight = height;

  // controls = new THREE.OrbitControls( camera, renderer.domElement );

  camera.position.z = 10000;

  // render once to make sure we have the correct background color
  renderer.render(scene, camera);
  return renderer;
}

function onLoadAllStatics(){
  formula = new SphereFormula();
  formula.apply(atlas.assets);
  // // reset color
  new ColorFormula(new THREE.Color(1, 1, 1)).apply(atlas.assets);

  // renderer.domElement.addEventListener('click', function () {
  //   console.log('click');
  //   renderNeeded = true;
  // }, false);

  animate();

}

function animate() {
  // console.clear();
  requestAnimationFrame(animate);
  atlas.update();
  // controls.update();
  if (renderNeeded) {
    // console.log( renderNeeded, cameraControls.info() );
    // console.time( "render" );
    renderer.render(scene, camera);
    // console.timeEnd( "render" );
    renderNeeded = false;
  }
}

var params = {
  showDebug: true
}

// GO --------------------------------------
setup(window.innerWidth, window.innerHeight);
