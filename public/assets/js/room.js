const stage = document.querySelector('#room-stage');
const render = document.querySelector('#room-render');
const toggle = document.querySelector('#room-toggle');
const reset = document.querySelector('#room-reset');
const status = document.querySelector('#room-status');
const asset = new URL('../room/workshop.glb', import.meta.url);
const viewerModule = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
const startingOrbit = '35deg 59deg 97%';
let viewer;

// Keep the original render available if the interactive viewer cannot load.
function withDeadline(promise) {
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error('3D load timed out')), 15000);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timeout));
}

async function loadViewer() {
  if (!customElements.get('model-viewer')) await withDeadline(import(viewerModule));

  viewer = document.createElement('model-viewer');
  viewer.alt = render.alt;
  viewer.setAttribute('camera-controls', '');
  viewer.setAttribute('camera-orbit', startingOrbit);
  viewer.setAttribute('max-camera-orbit', 'auto 88deg auto');
  viewer.setAttribute('interaction-prompt', 'none');
  viewer.setAttribute('loading', 'eager');
  viewer.setAttribute('shadow-intensity', '0.65');
  const ready = new Promise((resolve, reject) => {
    viewer.addEventListener('load', resolve, { once: true });
    viewer.addEventListener('error', reject, { once: true });
  });
  viewer.src = asset.href;
  stage.append(viewer);
  await withDeadline(ready);
}

reset.addEventListener('click', () => {
  viewer.cameraOrbit = startingOrbit;
  viewer.cameraTarget = 'auto auto auto';
  viewer.fieldOfView = 'auto';
  viewer.jumpCameraToGoal();
});

toggle.hidden = false;
toggle.addEventListener('click', async () => {
  if (toggle.getAttribute('aria-disabled') === 'true') return;

  if (toggle.getAttribute('aria-expanded') === 'true') {
    viewer.hidden = true;
    render.hidden = false;
    reset.hidden = true;
    toggle.textContent = 'Explore in 3D';
    status.textContent = 'Workshop model';
    toggle.setAttribute('aria-expanded', 'false');
    return;
  }

  toggle.setAttribute('aria-disabled', 'true');
  status.textContent = 'Loading 3D view…';
  try {
    if (!viewer) await loadViewer();
    viewer.hidden = false;
    render.hidden = true;
    reset.hidden = false;
    toggle.textContent = 'Still image';
    status.textContent = 'Drag to rotate';
    toggle.setAttribute('aria-expanded', 'true');
  } catch {
    viewer?.remove();
    viewer = null;
    status.textContent = '3D view unavailable. Try again.';
  } finally {
    toggle.removeAttribute('aria-disabled');
  }
});
