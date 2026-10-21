// Camera controls for the 3D scene
// Left-drag orbits the camera, wheel zooms. Bound to the canvas only,
// so UI buttons and the code editor keep their normal mouse behaviour.

export function resetInput() {
  // Reset all movement keys
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'KeyW', 'KeyA', 'KeyS', 'KeyD']
  keys.forEach(key => {
    const event = new KeyboardEvent('keyup', { key, bubbles: true })
    window.dispatchEvent(event)
  })
}

export function setMovementKey(code, pressed) {
  // Store movement key state
  const movementKeys = {
    'ArrowUp': false, 'ArrowDown': false,
    'ArrowLeft': false, 'ArrowRight': false,
    'KeyW': false, 'KeyA': false, 'KeyS': false, 'KeyD': false
  }
  if (movementKeys[code] !== undefined) {
    movementKeys[code] = pressed
  }
}

export function rotateCamera(amount) {
  // Rotate camera by amount
  const canvas = document.querySelector('.nex-canvas')
  if (!canvas) return
  const camera = canvas.getObject3D('camera')
  if (camera) {
    // Simple rotation update
    camera.rotation.y += amount
  }
}