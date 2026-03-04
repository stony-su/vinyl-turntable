import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Environment } from './Environment.js';
import { Turntable } from './Turntable.js';
import { RecordCrate } from './RecordCrate.js';
import { AudioEngine } from './AudioEngine.js';
import { Interaction } from './Interaction.js';

// Song data mapping
const SONGS = [
  { name: 'A Million Dreams', mp3: 'A Million Dreams.mp3', image: 'images/a million dreams.png' },
  { name: 'Ghost Duet', mp3: 'Ghost Duet - Louie Zong.mp3', image: 'images/ghost duet.jpg' },
  { name: 'Just the Two of Us', mp3: 'Just the Two of Us.mp3', image: 'images/just the two of us.jpg' },
  { name: 'Quiet Galaxy', mp3: 'Quiet Galaxy.mp3', image: 'images/quiet galaxy.jpg' },
  { name: 'Secret Base', mp3: 'Secret Base.mp3', image: 'images/secret base.webp' },
  { name: '忘れじの言の葉', mp3: '忘れじの言の葉.mp3', image: 'images/忘れじの言の葉.jpg' }
];

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1e1e);
scene.fog = new THREE.FogExp2(0x0d1e1e, 0.008);

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(12, 22, 32);
camera.lookAt(3, 3, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(3, 3, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minPolarAngle = 0.4;
controls.maxPolarAngle = 1.35;
controls.minDistance = 22;
controls.maxDistance = 55;
controls.update();

// Environment (room, table, lights)
const environment = new Environment(scene);

// Turntable
const turntable = new Turntable();
turntable.group.position.set(-5, 1.2, -1);
scene.add(turntable.group);

// Record crate (rotated so album art faces +Z toward camera)
const crate = new RecordCrate(SONGS);
crate.group.position.set(17, 1.2, 1);
crate.group.rotation.y = Math.PI / 2;
scene.add(crate.group);

// Poster on back wall
const poster = environment.buildPoster();
poster.position.set(-5, 18, -29.5);
scene.add(poster);

// Generate subtle environment map for metallic reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const envRT = pmremGenerator.fromScene(scene, 0, 0.1, 100);
scene.environment = envRT.texture;
scene.environmentIntensity = 0.4;
pmremGenerator.dispose();

// Audio engine
const audioEngine = new AudioEngine();

// Interaction system
const interaction = new Interaction(camera, scene, renderer, turntable, crate, audioEngine, controls);

// Dust particles
const dustCount = 80;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
const dustVelocities = [];
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 60;
  dustPositions[i * 3 + 1] = Math.random() * 25 - 5;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  dustVelocities.push({
    x: (Math.random() - 0.5) * 0.02,
    y: (Math.random() - 0.5) * 0.01 + 0.003,
    z: (Math.random() - 0.5) * 0.02
  });
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMat = new THREE.PointsMaterial({
  color: 0x80ffe0,
  size: 0.08,
  transparent: true,
  opacity: 0.3,
  sizeAttenuation: true,
  depthWrite: false
});
const dustParticles = new THREE.Points(dustGeo, dustMat);
scene.add(dustParticles);

// Opening camera animation
let introProgress = 0;
const introFrom = new THREE.Vector3(25, 28, 45);
const introTo = camera.position.clone();
camera.position.copy(introFrom);

// Preload audio and start
async function init() {
  await audioEngine.loadAll(SONGS);
  // Hide loading screen
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('fade');
    setTimeout(() => loadingEl.remove(), 900);
  }
}

// First user interaction to unlock audio context
let audioResumed = false;
const resumeAudio = () => {
  if (!audioResumed) {
    audioResumed = true;
    audioEngine.init();
    if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {
      audioEngine.ctx.resume();
    }
    init();
  }
};
window.addEventListener('pointerdown', resumeAudio, { once: false });
window.addEventListener('keydown', resumeAudio, { once: false });

// Start loading immediately too (will work if autoplay is allowed)
init();

// Clock for delta time
const clock = new THREE.Clock();

// Render loop
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  // Intro camera dolly
  if (introProgress < 1) {
    introProgress += delta * 0.4;
    const t = smoothstep(Math.min(introProgress, 1));
    camera.position.lerpVectors(introFrom, introTo, t);
    controls.update();
  }

  // Update systems
  controls.update();
  turntable.update(delta);
  interaction.update(delta);

  // Dust particle animation
  const positions = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    positions[i * 3] += dustVelocities[i].x;
    positions[i * 3 + 1] += dustVelocities[i].y;
    positions[i * 3 + 2] += dustVelocities[i].z;

    // Wrap around
    if (positions[i * 3 + 1] > 25) positions[i * 3 + 1] = -5;
    if (positions[i * 3] > 30) positions[i * 3] = -30;
    if (positions[i * 3] < -30) positions[i * 3] = 30;
    if (positions[i * 3 + 2] > 20) positions[i * 3 + 2] = -20;
    if (positions[i * 3 + 2] < -20) positions[i * 3 + 2] = 20;
  }
  dustGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
