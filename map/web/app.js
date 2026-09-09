import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { FACILITY_INFO, DEPARTMENTS, SPECIMENS, WALK_ZONES, COLLISION_OBSTACLES, getDepartmentById, isInsideAnyZone, resolveObstacleCollision } from './data.js';
import { sound } from './audio.js';

// ==========================================================================
// 1. Scene, Camera & ACES Filmic Renderer
// ==========================================================================
const canvas = document.getElementById('canvas3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#06070a');
scene.fog = new THREE.FogExp2('#06070a', 0.008);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  180
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

// ==========================================================================
// 2. Calibrated Architectural Lighting (Emulating Cycles Engine Look)
// ==========================================================================
const ambientLight = new THREE.AmbientLight(0x111624, 1.35);
scene.add(ambientLight);

// Key directional light representing overhead skylight bounce
const sunLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
sunLight.position.set(20, 45, 10);
scene.add(sunLight);

// Fill light for soft shadow bounce
const fillLight = new THREE.DirectionalLight(0x1e293b, 0.8);
fillLight.position.set(-25, 20, -20);
scene.add(fillLight);

// High-output strip lights along Creature Concourse
[-12, -4, 4, 12].forEach((zPos) => {
  const stripLight = new THREE.PointLight(0xaad4ff, 32, 18, 1.8);
  stripLight.position.set(0, 5.8, zPos);
  scene.add(stripLight);
});

// Saturated chamber point lights
const chamberLights = [
  { pos: [-6.9, 2.5, 10.5], color: 0x00e5ff, intensity: 40 },
  { pos: [-6.9, 2.5, 3.5],  color: 0xff6d00, intensity: 45 },
  { pos: [-6.9, 2.5, -3.5], color: 0xffd600, intensity: 40 },
  { pos: [-6.9, 2.5, -10.5],color: 0x00e676, intensity: 40 },
  { pos: [6.9, 2.5, 10.5],  color: 0x00b0ff, intensity: 40 },
  { pos: [6.9, 2.5, 3.5],   color: 0x00e5ff, intensity: 40 },
  { pos: [6.9, 2.5, -3.5],  color: 0xb388ff, intensity: 45 },
  { pos: [6.9, 2.5, -10.5], color: 0xff1744, intensity: 40 }
];

chamberLights.forEach((cfg) => {
  const p = new THREE.PointLight(cfg.color, cfg.intensity, 12, 1.6);
  p.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
  scene.add(p);
});

// Nexus Rotunda Center glow
const nexusLight = new THREE.PointLight(0x00e5ff, 45, 28, 1.6);
nexusLight.position.set(0, 6.5, 55.0);
scene.add(nexusLight);

// Weapons Forge Thermal glow
const weaponsLight = new THREE.PointLight(0xff6d00, 48, 22, 1.5);
weaponsLight.position.set(0, 4.0, 29.0);
scene.add(weaponsLight);

// ==========================================================================
// 3. Navigation State & Controls
// ==========================================================================
let currentMode = 'walk'; // 'walk' | 'tour'
let activeDeptId = 'entrance';
let isTweening = false;
let tweenStartPos = new THREE.Vector3();
let tweenEndPos = new THREE.Vector3();
let tweenStartTarget = new THREE.Vector3();
let tweenEndTarget = new THREE.Vector3();
let tweenProgress = 0;
let tweenDuration = 1.6;

const currentTarget = new THREE.Vector3(0, 1.8, 65.0);

// Orbit Controls (for Tour Mode)
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.maxDistance = 50;
orbitControls.minDistance = 0.8;
orbitControls.maxPolarAngle = Math.PI / 2 + 0.02;

// PointerLock Controls (for Walk Mode)
const pointerControls = new PointerLockControls(camera, document.body);

// Walk Physics State
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  canJump: true
};
const concourseFloorY = 1.8;
let headBobTimer = 0;

// Initial spawn: Inside Welcome Lounge facing into the Nexus
camera.position.set(0.0, 1.8, 84.0);
currentTarget.set(0.0, 1.8, 65.0);
orbitControls.target.copy(currentTarget);
orbitControls.update();

// Interactive Meshes
const interactiveMeshes = [];
const floatingEntities = [];

// ==========================================================================
// 4. Asset Loading (The_Asset_Archive.glb)
// ==========================================================================
const loader = new GLTFLoader();
const progressFill = document.getElementById('progressFill');
const loaderStatus = document.getElementById('loaderStatus');
const loadingScreen = document.getElementById('loadingScreen');

loader.load(
  `./The_Asset_Archive.glb?v=${Date.now()}`,
  (gltf) => {
    const root = gltf.scene;

    root.traverse((child) => {
      if (child.isMesh) {
        // High-clarity architectural glass
        if (child.name.includes('Glass') || (child.material && child.material.name && child.material.name.includes('Glass'))) {
          child.material.transparent = true;
          child.material.opacity = 0.18;
          child.material.roughness = 0.02;
          child.material.metalness = 0.05;
          child.material.depthWrite = false;
          interactiveMeshes.push(child);
        }

        // Floating specimen animations
        if (child.name.startsWith('C0') && (child.name.includes('Core') || child.name.includes('Armor') || child.name.includes('Visor'))) {
          floatingEntities.push({
            mesh: child,
            baseY: child.position.y,
            speed: 1.2 + Math.random() * 0.8,
            rotSpeed: (Math.random() - 0.5) * 0.3
          });
        }
      }
    });

    scene.add(root);

    // Hide loader and show Entrance arrival portal
    setTimeout(() => {
      loadingScreen.classList.add('loaded');
      openEntranceModal();
    }, 400);
  },
  (xhr) => {
    if (xhr.lengthComputable) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      progressFill.style.width = pct + '%';
      loaderStatus.textContent = `LOADING ARCHITECTURAL FACILITY (${pct}%)`;
    }
  },
  (err) => {
    console.error('Error loading GLB:', err);
    loaderStatus.textContent = 'READY TO ENTER FACILITY';
    setTimeout(() => {
      loadingScreen.classList.add('loaded');
      openEntranceModal();
    }, 500);
  }
);

// ==========================================================================
// 5. Entrance Arrival Modal Workflow
// ==========================================================================
const entranceModal = document.getElementById('entranceModal');
const btnEnterFacility = document.getElementById('btnEnterFacility');
const cardModeWalk = document.getElementById('cardModeWalk');
const cardModeTour = document.getElementById('cardModeTour');
const cardModeCycles = document.getElementById('cardModeCycles');

let selectedEntranceMode = 'walk';

function openEntranceModal() {
  entranceModal.classList.add('open');
}

function closeEntranceModal() {
  entranceModal.classList.remove('open');
}

[cardModeWalk, cardModeTour, cardModeCycles].forEach((card) => {
  card.addEventListener('click', () => {
    [cardModeWalk, cardModeTour, cardModeCycles].forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    selectedEntranceMode = card.getAttribute('data-mode');
    sound.playBeep(600, 'sine', 0.05);
  });
});

btnEnterFacility.addEventListener('click', () => {
  sound.playAccessGranted();
  closeEntranceModal();

  if (selectedEntranceMode === 'walk') {
    setMode('walk');
    pointerControls.lock();
  } else if (selectedEntranceMode === 'tour') {
    setMode('tour');
    flyToDepartment('nexus');
  } else if (selectedEntranceMode === 'cycles') {
    setMode('tour');
    openCyclesModal('entrance');
  }
});

// ==========================================================================
// 6. Dual Mode Switching (Walk vs Tour)
// ==========================================================================
const btnModeWalk = document.getElementById('btnModeWalk');
const btnModeTour = document.getElementById('btnModeTour');
const crosshair = document.getElementById('crosshair');
const walkInstructions = document.getElementById('walkInstructions');

function setMode(mode) {
  currentMode = mode;
  sound.playBeep(700, 'sine', 0.06);

  if (mode === 'tour') {
    btnModeTour.classList.add('active');
    btnModeWalk.classList.remove('active');
    crosshair.style.opacity = '0';
    walkInstructions.style.opacity = '0';
    pointerControls.unlock();
    orbitControls.enabled = true;
  } else {
    btnModeWalk.classList.add('active');
    btnModeTour.classList.remove('active');
    crosshair.style.opacity = '1';
    walkInstructions.style.opacity = '1';
    orbitControls.enabled = false;
    closeInspectorDrawer();

    // If outside walkable facility bounds or elevated, reset to Welcome Lounge
    if (!isInsideAnyZone(camera.position.x, camera.position.z) || camera.position.y > 8.0) {
      camera.position.set(0.0, 1.8, 84.0);
      camera.lookAt(0.0, 1.8, 60.0);
    }

    pointerControls.lock();
  }
}

btnModeWalk.addEventListener('click', () => setMode('walk'));
btnModeTour.addEventListener('click', () => setMode('tour'));

pointerControls.addEventListener('unlock', () => {
  if (currentMode === 'walk') {
    walkInstructions.style.opacity = '1';
    walkInstructions.textContent = 'Click viewport to resume mouse look · [ESC] to release';
  }
});

pointerControls.addEventListener('lock', () => {
  walkInstructions.style.opacity = '0';
});

canvas.addEventListener('click', () => {
  if (currentMode === 'walk' && !pointerControls.isLocked && !entranceModal.classList.contains('open') && !cyclesModal.classList.contains('open')) {
    pointerControls.lock();
  }
});

// WASD Keyboard Listeners
const onKeyDown = (e) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveState.forward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveState.backward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveState.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveState.right = true;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      moveState.sprint = true;
      break;
    case 'Space':
      if (moveState.canJump) {
        velocity.y += 8.5;
        moveState.canJump = false;
        sound.playBeep(320, 'square', 0.04);
      }
      break;
    case 'KeyC':
      // Toggle Cycles Raytraced View
      toggleCyclesView();
      break;
  }
};

const onKeyUp = (e) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveState.forward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveState.backward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveState.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveState.right = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      moveState.sprint = false;
      break;
  }
};

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

// ==========================================================================
// 7. Department Navigation & Camera Tweening
// ==========================================================================
const currentLocationText = document.getElementById('currentLocationText');
const locationDot = document.getElementById('locationDot');
const dockButtons = document.querySelectorAll('.dept-dock-btn');

function flyToDepartment(deptId, duration = 1.6) {
  const dept = getDepartmentById(deptId);
  if (!dept) return;

  activeDeptId = deptId;
  updateLocationBadge(dept);
  updateDockHighlight(deptId);

  tweenStartPos.copy(camera.position);
  tweenEndPos.set(dept.camPos[0], dept.camPos[1], dept.camPos[2]);
  tweenStartTarget.copy(orbitControls.target);
  tweenEndTarget.set(dept.targetPos[0], dept.targetPos[1], dept.targetPos[2]);

  tweenProgress = 0;
  tweenDuration = duration;
  isTweening = true;
  orbitControls.enabled = false;

  sound.playBeep(580, 'sine', 0.08);
}

function updateLocationBadge(dept) {
  currentLocationText.textContent = `${dept.number}: ${dept.name.toUpperCase()}`;
  locationDot.style.background = dept.color;
  locationDot.style.boxShadow = `0 0 10px ${dept.color}`;
}

function updateDockHighlight(deptId) {
  dockButtons.forEach((btn) => {
    if (btn.getAttribute('data-dept') === deptId) {
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      btn.classList.remove('active');
    }
  });
}

dockButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const deptId = btn.getAttribute('data-dept');
    flyToDepartment(deptId);
    if (inspectorDrawer.classList.contains('open')) {
      populateDrawer(deptId);
    }
  });
});

// Ease In-Out Cubic for smooth architectural camera choreography
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ==========================================================================
// 8. Location Arrival Notification Toast
// ==========================================================================
const locationToast = document.getElementById('locationToast');
const toastTitle = document.getElementById('toastTitle');
const toastSubtitle = document.getElementById('toastSubtitle');
let toastTimer = null;
let lastDetectedDeptId = 'entrance';

function showLocationToast(dept) {
  if (!dept || dept.id === lastDetectedDeptId) return;
  lastDetectedDeptId = dept.id;

  toastTitle.textContent = dept.name.toUpperCase();
  toastSubtitle.textContent = dept.subtitle;
  locationToast.style.borderColor = dept.color;

  locationToast.classList.add('show');
  sound.playBeep(640, 'triangle', 0.06);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    locationToast.classList.remove('show');
  }, 2800);
}

// ==========================================================================
// 9. Cycles Raytraced Full-Screen Modal
// ==========================================================================
const cyclesModal = document.getElementById('cyclesModal');
const cyclesModalTitle = document.getElementById('cyclesModalTitle');
const cyclesModalImage = document.getElementById('cyclesModalImage');
const cyclesModalClose = document.getElementById('cyclesModalClose');
const btnReturnTo3D = document.getElementById('btnReturnTo3D');
const btnLive3D = document.getElementById('btnLive3D');
const btnCyclesView = document.getElementById('btnCyclesView');

function openCyclesModal(deptId = activeDeptId) {
  const dept = getDepartmentById(deptId);
  if (!dept) return;

  pointerControls.unlock();
  cyclesModalTitle.textContent = `${dept.name.toUpperCase()} // CYCLES PATH-TRACED EXHIBITION`;
  cyclesModalImage.src = dept.cyclesImage;
  cyclesModal.classList.add('open');
  btnCyclesView.classList.add('active');
  btnLive3D.classList.remove('active');
  sound.playBeep(720, 'sine', 0.08);
}

function closeCyclesModal() {
  cyclesModal.classList.remove('open');
  btnLive3D.classList.add('active');
  btnCyclesView.classList.remove('active');
}

function toggleCyclesView() {
  if (cyclesModal.classList.contains('open')) {
    closeCyclesModal();
  } else {
    openCyclesModal(activeDeptId);
  }
}

btnCyclesView.addEventListener('click', () => openCyclesModal(activeDeptId));
btnLive3D.addEventListener('click', closeCyclesModal);
cyclesModalClose.addEventListener('click', closeCyclesModal);
btnReturnTo3D.addEventListener('click', closeCyclesModal);

// ==========================================================================
// 10. Department Inspector Drawer
// ==========================================================================
const inspectorDrawer = document.getElementById('inspectorDrawer');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const btnInspectDept = document.getElementById('btnInspectDept');
const drawerCategory = document.getElementById('drawerCategory');
const drawerTitle = document.getElementById('drawerTitle');
const drawerSubtitle = document.getElementById('drawerSubtitle');
const drawerCyclesImg = document.getElementById('drawerCyclesImg');
const drawerSpecsTable = document.getElementById('drawerSpecsTable');
const drawerDescription = document.getElementById('drawerDescription');
const btnOpenFullCycles = document.getElementById('btnOpenFullCycles');
const specimensSection = document.getElementById('specimensSection');
const drawerSpecimensList = document.getElementById('drawerSpecimensList');

function openInspectorDrawer() {
  populateDrawer(activeDeptId);
  inspectorDrawer.classList.add('open');
  sound.playBeep(650, 'sine', 0.05);
}

function closeInspectorDrawer() {
  inspectorDrawer.classList.remove('open');
}

function populateDrawer(deptId) {
  const dept = getDepartmentById(deptId);
  if (!dept) return;

  drawerCategory.textContent = dept.category;
  drawerCategory.style.color = dept.color;
  drawerTitle.textContent = dept.name;
  drawerSubtitle.textContent = dept.subtitle;
  drawerCyclesImg.src = dept.cyclesImage;
  drawerDescription.textContent = dept.description;

  // Render specifications
  drawerSpecsTable.innerHTML = `
    ${dept.specs.heroModel ? `
    <div class="spec-row" style="background: rgba(0, 229, 255, 0.08); padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid rgba(0, 229, 255, 0.22);">
      <span class="spec-label" style="color: var(--accent-cyan); font-weight: 600;">Hero Asset:</span>
      <span class="spec-val" style="color: #ffffff; font-weight: 600; text-align: right; max-width: 65%;">${dept.specs.heroModel}</span>
    </div>` : ''}
    ${dept.specs.secondaryExhibits ? `
    <div class="spec-row" style="background: rgba(255, 214, 0, 0.06); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; border: 1px solid rgba(255, 214, 0, 0.22); flex-direction: column; align-items: flex-start; gap: 4px;">
      <span class="spec-label" style="color: #ffd600; font-weight: 600; font-size: 10px; letter-spacing: 0.5px;">SECONDARY & DIORAMA EXHIBITS:</span>
      <span class="spec-val" style="color: rgba(255, 255, 255, 0.9); font-size: 11px; line-height: 1.4; text-align: left; max-width: 100%;">${dept.specs.secondaryExhibits}</span>
    </div>` : ''}
    <div class="spec-row">
      <span class="spec-label">Area Footprint:</span>
      <span class="spec-val">${dept.specs.dimensions}</span>
    </div>
    <div class="spec-row">
      <span class="spec-label">Ceiling Height:</span>
      <span class="spec-val">${dept.specs.ceilingHeight}</span>
    </div>
    <div class="spec-row">
      <span class="spec-label">Lighting Kelvin:</span>
      <span class="spec-val">${dept.specs.lighting}</span>
    </div>
    <div class="spec-row">
      <span class="spec-label">Polygon Budget:</span>
      <span class="spec-val">${dept.specs.triangles}</span>
    </div>
    <div class="spec-row">
      <span class="spec-label">Materials Setup:</span>
      <span class="spec-val">${dept.specs.materials}</span>
    </div>
    <div class="spec-row">
      <span class="spec-label">Cycles Offline Render:</span>
      <span class="spec-val" style="color: var(--accent-cyan);">${dept.specs.cyclesSamples}</span>
    </div>
  `;

  // Specimens list for Creature Containment
  if (deptId === 'creatures') {
    specimensSection.style.display = 'block';
    drawerSpecimensList.innerHTML = SPECIMENS.map(
      (s) => `
      <div class="specimen-chip" data-specimen="${s.id}">
        <div class="chip-chamber">${s.chamber}</div>
        <div class="chip-name" style="color: ${s.color};">${s.name}</div>
      </div>
    `
    ).join('');

    drawerSpecimensList.querySelectorAll('.specimen-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const sId = parseInt(chip.getAttribute('data-specimen'));
        const spec = SPECIMENS.find((x) => x.id === sId);
        if (spec) {
          flyToChamber(spec);
        }
      });
    });
  } else {
    specimensSection.style.display = 'none';
  }
}

function flyToChamber(spec) {
  tweenStartPos.copy(camera.position);
  tweenEndPos.set(spec.camPos[0], spec.camPos[1], spec.camPos[2]);
  tweenStartTarget.copy(orbitControls.target);
  tweenEndTarget.set(spec.targetPos[0], spec.targetPos[1], spec.targetPos[2]);

  tweenProgress = 0;
  tweenDuration = 1.4;
  isTweening = true;
  orbitControls.enabled = false;
  sound.playBeep(740, 'triangle', 0.06);
}

btnInspectDept.addEventListener('click', openInspectorDrawer);
drawerCloseBtn.addEventListener('click', closeInspectorDrawer);
btnOpenFullCycles.addEventListener('click', () => openCyclesModal(activeDeptId));

// ==========================================================================
// 11. Facility Radar Minimap (Performance-Optimized with Offscreen Caching)
// ==========================================================================
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const radarContainer = document.getElementById('radarContainer');

const offscreenRadar = document.createElement('canvas');
offscreenRadar.width = 96;
offscreenRadar.height = 96;
const offscreenCtx = offscreenRadar.getContext('2d');
let cachedRadarDept = null;

function renderOffscreenRadar() {
  const w = offscreenRadar.width;
  const h = offscreenRadar.height;
  offscreenCtx.clearRect(0, 0, w, h);

  // Background frame
  offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  offscreenCtx.lineWidth = 1;
  offscreenCtx.strokeRect(3, 3, w - 6, h - 6);

  const mapX = (x) => ((x - (-55)) / 141) * (w - 16) + 8;
  const mapZ = (z) => ((z - (-36)) / 128) * (h - 16) + 8;

  WALK_ZONES.forEach((zone) => {
    const x0 = mapX(zone.minX);
    const z0 = mapZ(zone.minZ);
    const x1 = mapX(zone.maxX);
    const z1 = mapZ(zone.maxZ);

    const isCurrent = zone.deptId === activeDeptId;
    offscreenCtx.fillStyle = isCurrent ? 'rgba(0, 229, 255, 0.22)' : 'rgba(255, 255, 255, 0.04)';
    offscreenCtx.strokeStyle = isCurrent ? 'rgba(0, 229, 255, 0.7)' : 'rgba(255, 255, 255, 0.12)';
    offscreenCtx.lineWidth = isCurrent ? 1.5 : 0.8;

    offscreenCtx.fillRect(x0, z0, x1 - x0, z1 - z0);
    offscreenCtx.strokeRect(x0, z0, x1 - x0, z1 - z0);
  });

  // Render Structural Pillars & Major Exhibits onto Radar
  COLLISION_OBSTACLES.forEach((obs) => {
    if (obs.type === 'circle') {
      const cx = mapX(obs.x);
      const cz = mapZ(obs.z);
      const r = Math.max(1.2, (obs.radius / 141) * (w - 16));
      offscreenCtx.fillStyle = obs.deptId === activeDeptId ? 'rgba(0, 229, 255, 0.65)' : 'rgba(255, 255, 255, 0.25)';
      offscreenCtx.beginPath();
      offscreenCtx.arc(cx, cz, r, 0, Math.PI * 2);
      offscreenCtx.fill();
    } else if (obs.type === 'box') {
      const x0 = mapX(obs.minX);
      const z0 = mapZ(obs.minZ);
      const x1 = mapX(obs.maxX);
      const z1 = mapZ(obs.maxZ);
      offscreenCtx.fillStyle = obs.deptId === activeDeptId ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
      offscreenCtx.fillRect(x0, z0, Math.max(1.5, x1 - x0), Math.max(1.5, z1 - z0));
    }
  });
}

let lastRadarTime = 0;
let lastPlayerX = 0;
let lastPlayerZ = 0;
let lastPlayerDirX = 0;
let lastPlayerDirZ = 0;

function updateRadar(force = false) {
  const now = performance.now();
  if (!force && now - lastRadarTime < 33) return; // Cap at 30 FPS

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  const dx = Math.abs(camera.position.x - lastPlayerX);
  const dz = Math.abs(camera.position.z - lastPlayerZ);
  const ddir = Math.abs(dir.x - lastPlayerDirX) + Math.abs(dir.z - lastPlayerDirZ);

  if (cachedRadarDept !== activeDeptId) {
    cachedRadarDept = activeDeptId;
    renderOffscreenRadar();
  } else if (!force && dx < 0.04 && dz < 0.04 && ddir < 0.015) {
    return; // Minimal movement: skip canvas draw
  }

  lastRadarTime = now;
  lastPlayerX = camera.position.x;
  lastPlayerZ = camera.position.z;
  lastPlayerDirX = dir.x;
  lastPlayerDirZ = dir.z;

  const w = radarCanvas.width;
  const h = radarCanvas.height;
  radarCtx.clearRect(0, 0, w, h);

  // Blit pre-cached geometry
  radarCtx.drawImage(offscreenRadar, 0, 0);

  const mapX = (x) => ((x - (-55)) / 141) * (w - 16) + 8;
  const mapZ = (z) => ((z - (-36)) / 128) * (h - 16) + 8;

  const px = mapX(camera.position.x);
  const pz = mapZ(camera.position.z);

  // Orientation line
  radarCtx.strokeStyle = '#00e5ff';
  radarCtx.lineWidth = 2;
  radarCtx.beginPath();
  radarCtx.moveTo(px, pz);
  radarCtx.lineTo(px + dir.x * 12, pz + dir.z * 12);
  radarCtx.stroke();

  // Position dot
  radarCtx.fillStyle = '#ffffff';
  radarCtx.beginPath();
  radarCtx.arc(px, pz, 3.5, 0, Math.PI * 2);
  radarCtx.fill();
}

radarContainer.addEventListener('click', () => {
  openInspectorDrawer();
});

// ==========================================================================
// 12. Header Controls (Audio, Help)
// ==========================================================================
const btnAudioToggle = document.getElementById('btnAudioToggle');
const audioIcon = document.getElementById('audioIcon');
const btnHelpToggle = document.getElementById('btnHelpToggle');
const helpModal = document.getElementById('helpModal');
const helpCloseBtn = document.getElementById('helpCloseBtn');

btnAudioToggle.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  audioIcon.style.opacity = isMuted ? '0.35' : '1.0';
});

btnHelpToggle.addEventListener('click', () => {
  sound.playBeep(520, 'sine', 0.05);
  helpModal.classList.toggle('open');
});

helpCloseBtn.addEventListener('click', () => {
  helpModal.classList.remove('open');
});

// ==========================================================================
// 13. Main High-Performance Animation Loop (60 FPS)
// ==========================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.08);
  const elapsedTime = clock.getElapsedTime();

  // 1. Idle Floating Creature Entities
  floatingEntities.forEach((item) => {
    item.mesh.position.y = item.baseY + Math.sin(elapsedTime * item.speed) * 0.12;
    item.mesh.rotation.y += item.rotSpeed * delta;
  });

  // 2. Camera Tweening
  if (isTweening) {
    tweenProgress += delta / tweenDuration;
    if (tweenProgress >= 1.0) {
      tweenProgress = 1.0;
      isTweening = false;
      orbitControls.enabled = currentMode === 'tour';
    }
    const ease = easeInOutCubic(tweenProgress);
    camera.position.lerpVectors(tweenStartPos, tweenEndPos, ease);
    currentTarget.lerpVectors(tweenStartTarget, tweenEndTarget, ease);

    orbitControls.target.copy(currentTarget);
    camera.lookAt(currentTarget);
  } else if (currentMode === 'tour') {
    orbitControls.update();
  }

  // 3. First-Person Walk Mode Physics with Sub-Stepping, Pillar/Obstacle Sliding & Elevation
  if (currentMode === 'walk' && pointerControls.isLocked) {
    const isMoving = (moveState.forward || moveState.backward || moveState.left || moveState.right);

    // Dynamic Sprint Speed & Acceleration
    const speed = moveState.sprint ? 150.0 : 85.0;

    // Dynamic Sprint Field of View (smooth lens widening for speed sensation)
    const targetFov = (moveState.sprint && isMoving) ? 76 : 62;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 7.0);
      camera.updateProjectionMatrix();
    }

    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left);
    direction.normalize();

    // 2 Sub-steps per frame to prevent tunneling at 15 m/s sprint velocity
    const subSteps = 2;
    const subDelta = delta / subSteps;
    let groundTargetY = concourseFloorY;

    for (let step = 0; step < subSteps; step++) {
      velocity.x -= velocity.x * 11.5 * subDelta;
      velocity.y -= 26.0 * subDelta; // Gravity
      velocity.z -= velocity.z * 11.5 * subDelta;

      if (moveState.forward || moveState.backward) {
        velocity.z -= direction.z * speed * subDelta;
      }
      if (moveState.left || moveState.right) {
        velocity.x -= direction.x * speed * subDelta;
      }

      const prevX = camera.position.x;
      const prevZ = camera.position.z;

      pointerControls.moveRight(-velocity.x * subDelta);
      pointerControls.moveForward(-velocity.z * subDelta);
      camera.position.y += velocity.y * subDelta;

      // 1. Structural Pillar & Interior Obstacle Collision Resolution
      const obsRes = resolveObstacleCollision(camera.position.x, camera.position.z, 0.25);
      if (obsRes.collided) {
        camera.position.x = obsRes.x;
        camera.position.z = obsRes.z;
      }

      // 2. Staircase & Elevated Walkway Zones
      const px = camera.position.x;
      const pz = camera.position.z;
      const onCreatureStairs = (px >= -4.4 && px <= -2.6 && pz >= -0.4 && pz <= 3.9);
      const onCreatureCatwalk = (pz >= -1.5 && pz <= 0.4 && px >= -4.8 && px <= 4.8);
      const onEnvStairs = (px >= 55.0 && px <= 58.0 && pz >= 36.1 && pz <= 43.3);
      const onControlSteps = (px >= -2.0 && px <= 2.0 && pz >= -14.0 && pz <= -12.5);

      if (camera.position.y > 4.5 && !onCreatureStairs && onCreatureCatwalk) {
        camera.position.x = Math.max(-4.6, Math.min(4.6, camera.position.x));
        camera.position.z = Math.max(-1.4, Math.min(0.3, camera.position.z));
      } else if (onCreatureStairs) {
        camera.position.x = Math.max(-4.3, Math.min(-2.7, camera.position.x));
        camera.position.z = Math.max(-0.4, Math.min(3.9, camera.position.z));
      } else if (onEnvStairs) {
        camera.position.x = Math.max(55.2, Math.min(57.8, camera.position.x));
        camera.position.z = Math.max(36.1, Math.min(43.3, camera.position.z));
      } else {
        // Multi-zone smooth sliding wall restriction (0.25m capsule contact)
        const nextX = camera.position.x;
        const nextZ = camera.position.z;
        if (!isInsideAnyZone(nextX, nextZ)) {
          if (isInsideAnyZone(nextX, prevZ)) {
            camera.position.z = prevZ;
            velocity.z = 0;
          } else if (isInsideAnyZone(prevX, nextZ)) {
            camera.position.x = prevX;
            velocity.x = 0;
          } else {
            camera.position.x = prevX;
            camera.position.z = prevZ;
            velocity.x = 0;
            velocity.z = 0;
          }
        }
      }

      // Secondary obstacle check post-wall-clamp to ensure zero pillar overlap
      const postObs = resolveObstacleCollision(camera.position.x, camera.position.z, 0.25);
      if (postObs.collided) {
        camera.position.x = postObs.x;
        camera.position.z = postObs.z;
      }

      // 3. Dynamic Ground & Stair Height Calculation
      groundTargetY = concourseFloorY;
      const currentZone = isInsideAnyZone(camera.position.x, camera.position.z);
      if (currentZone && currentZone.floorY) {
        groundTargetY = currentZone.floorY;
      }

      if (onCreatureStairs) {
        const t = Math.max(0, Math.min(1, (3.9 - pz) / (3.9 - (-0.4))));
        groundTargetY = concourseFloorY + t * 3.35;
      } else if (onCreatureCatwalk && (camera.position.y > 3.8 || onCreatureStairs)) {
        groundTargetY = 5.15;
      } else if (onEnvStairs) {
        const t = Math.max(0, Math.min(1, (43.3 - pz) / (43.3 - 36.1)));
        groundTargetY = 1.8 + t * (5.3 - 1.8);
      } else if (currentZone && currentZone.name === 'Environment_Catwalk') {
        groundTargetY = camera.position.y > 3.5 ? 5.3 : 1.8;
      } else if (onControlSteps) {
        const t = Math.max(0, Math.min(1, (-12.5 - pz) / 1.5));
        groundTargetY = concourseFloorY + t * 0.4;
      } else if (pz < -13.5 && pz >= -18.5 && px >= -4.0 && px <= 4.0) {
        groundTargetY = concourseFloorY + 0.4;
      }

      // Ground landing
      if (camera.position.y <= groundTargetY) {
        velocity.y = 0;
        camera.position.y = groundTargetY;
        moveState.canJump = true;
      }

      // Dynamic department detection & arrival notification
      if (currentZone && currentZone.deptId && currentZone.deptId !== activeDeptId) {
        activeDeptId = currentZone.deptId;
        const d = getDepartmentById(activeDeptId);
        updateLocationBadge(d);
        updateDockHighlight(activeDeptId);
        showLocationToast(d);
      }
    }

    // Subtle athletic head-bob cadence when grounded and running
    if (camera.position.y <= groundTargetY + 0.05 && isMoving) {
      headBobTimer += delta * (moveState.sprint ? 20.0 : 13.0);
      camera.position.y += Math.sin(headBobTimer) * (moveState.sprint ? 0.024 : 0.014);
    }
  }

  // 4. Update Radar Minimap
  updateRadar();

  // 5. Render Viewport
  renderer.render(scene, camera);
}

animate();

// ==========================================================================
// 14. Responsive Window Resize
// ==========================================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});
