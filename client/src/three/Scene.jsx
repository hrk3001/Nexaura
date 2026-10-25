// Array Fair 3D scene.
//
// Props come from App.jsx:
//   interactive  - true while exploring (false while the Java challenge is open)
//   evidence     - worlds.arrays.evidence (id, title, object, position, ...)
//   nearbyId     - id of the evidence the player is standing next to
//   onNearby     - (id | null) => void
//   onInspect    - (id) => void   (called when the player presses E)
//   paused       - true while the evidence panel is open
//
// Rules this file follows (these caused earlier crashes):
//   * R3F hooks (useFrame) are only used in components rendered INSIDE <Canvas>.
//   * Every geometry / material lives inside a <mesh>.
//   * Only names that are imported or defined here are used.
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three'
import Detective from './Detective.jsx'
import { useGame } from '../game/store.js'

const NONE = []

// ---------------------------------------------------------------- layout
const SPAWN = { x: -2, z: 8 }
const BOUNDS = { minX: -13, maxX: 13, minZ: -4.5, maxZ: 11 }
const PLAYER_RADIUS = 0.45
const SPEED = 5.2
const INTERACT_RADIUS = 2.2
const CAMERA_OFFSET = { y: 6.2, z: 9.5 }

// Solid props the detective cannot walk through (centre + half sizes).
const BLOCKERS = [
  { x: 0.2, z: 3.3, hw: 1.2, hd: 0.5 }, // sign-in desk
  { x: 2.4, z: 2.9, hw: 1.0, hd: 0.6 }, // Table 7
  { x: 7, z: -1, hw: 2.0, hd: 1.5 }, // fair office
]

const STALL_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6']
const TREES = [
  [-16.5, -3, 1],
  [-17, 4, 1.1],
  [-16, 10, 0.9],
  [16.5, -4, 1],
  [17, 3, 1.1],
  [16, 10, 0.9],
  [-9, -12, 1.2],
  [0, -13, 1.3],
  [9, -12, 1.2],
  [-15, -9, 1],
  [15, -9, 1],
]

// ---------------------------------------------------------------- pure helpers
function isBlocked(x, z) {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  for (const b of BLOCKERS) {
    if (Math.abs(x - b.x) < b.hw + PLAYER_RADIUS && Math.abs(z - b.z) < b.hd + PLAYER_RADIUS) {
      return true
    }
  }
  return false
}

function turnToward(current, target, amount) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * Math.min(1, amount)
}

function nearestEvidence(list, x, z) {
  let best = null
  let bestDist = INTERACT_RADIUS
  for (const entry of list) {
    const d = Math.hypot(entry.position[0] - x, entry.position[2] - z)
    if (d < bestDist) {
      best = entry.id
      bestDist = d
    }
  }
  return best
}

function roundedRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.lineTo(x + w - r, y)
  g.quadraticCurveTo(x + w, y, x + w, y + r)
  g.lineTo(x + w, y + h - r)
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  g.lineTo(x + r, y + h)
  g.quadraticCurveTo(x, y + h, x, y + h - r)
  g.lineTo(x, y + r)
  g.quadraticCurveTo(x, y, x + r, y)
  g.closePath()
}

function makeLabelTexture(title, sub, accent) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 160
  const g = canvas.getContext('2d')
  g.fillStyle = 'rgba(8, 16, 32, 0.9)'
  roundedRect(g, 4, 4, 504, 152, 28)
  g.fill()
  g.lineWidth = 6
  g.strokeStyle = accent
  roundedRect(g, 4, 4, 504, 152, 28)
  g.stroke()
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = sub ? 44 : 64
  g.font = `700 ${size}px system-ui, sans-serif`
  while (g.measureText(title).width > 450 && size > 20) {
    size -= 2
    g.font = `700 ${size}px system-ui, sans-serif`
  }
  g.fillStyle = '#f1f5f9'
  g.fillText(title, 256, sub ? 62 : 80)
  if (sub) {
    g.font = '600 30px system-ui, sans-serif'
    g.fillStyle = accent
    g.fillText(sub, 256, 116)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// ---------------------------------------------------------------- small parts
function Label({ title, sub = '', accent = '#34d399', position, width = 3.4 }) {
  const map = useMemo(() => makeLabelTexture(title, sub, accent), [title, sub, accent])
  useEffect(() => () => map.dispose(), [map])
  return (
    <sprite position={position} scale={[width, width / 3.2, 1]} renderOrder={10}>
      <spriteMaterial map={map} transparent depthTest={false} toneMapped={false} />
    </sprite>
  )
}

function Tree({ x, z, scale = 1 }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 2, 8]} />
        <meshStandardMaterial color="#7c4a21" flatShading />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshStandardMaterial color="#3e9c5a" flatShading />
      </mesh>
      <mesh position={[0.5, 3.7, 0.2]} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#4cb26a" flatShading />
      </mesh>
    </group>
  )
}

function Stall({ x, z, index, color }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.1, 1.5]} />
        <meshStandardMaterial color="#f1f5f9" flatShading />
      </mesh>
      <mesh position={[-1.3, 1.65, -0.6]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.3, 8]} />
        <meshStandardMaterial color="#64748b" flatShading />
      </mesh>
      <mesh position={[1.3, 1.65, -0.6]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.3, 8]} />
        <meshStandardMaterial color="#64748b" flatShading />
      </mesh>
      <mesh position={[0, 3.1, 0]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[3.3, 0.18, 2.3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <Label title={`[${index}]`} position={[0, 4.0, 0]} width={0.9} accent={color} />
    </group>
  )
}

function Table({ x, z, w, d, label, paper = false }) {
  const legs = [
    [-w / 2 + 0.1, -d / 2 + 0.1],
    [w / 2 - 0.1, -d / 2 + 0.1],
    [-w / 2 + 0.1, d / 2 - 0.1],
    [w / 2 - 0.1, d / 2 - 0.1],
  ]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color="#a16207" flatShading />
      </mesh>
      {legs.map(([lx, lz]) => (
        <mesh key={`${lx}:${lz}`} position={[lx, 0.45, lz]} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#78350f" flatShading />
        </mesh>
      ))}
      {paper ? (
        <mesh position={[0, 0.97, 0]}>
          <boxGeometry args={[0.8, 0.03, 0.55]} />
          <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
      ) : null}
      {label ? <Label title={label} position={[0, 1.5, 0]} width={1.0} accent="#fbbf24" /> : null}
    </group>
  )
}

function Office() {
  return (
    <group position={[7, 0, -1]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 3]} />
        <meshStandardMaterial color="#dbe4ee" flatShading />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[4.5, 0.3, 3.5]} />
        <meshStandardMaterial color="#b45309" flatShading />
      </mesh>
      <mesh position={[-2.02, 1, 0]}>
        <boxGeometry args={[0.12, 2, 1.1]} />
        <meshStandardMaterial color="#7c3f00" flatShading />
      </mesh>
      <mesh position={[-2.02, 1.7, -1.05]}>
        <boxGeometry args={[0.1, 0.8, 0.7]} />
        <meshStandardMaterial color="#93c5fd" flatShading />
      </mesh>
      <Label title="FAIR OFFICE" position={[-1.2, 4.2, 0]} width={1.7} accent="#38bdf8" />
    </group>
  )
}

function Banner({ x, z, color }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 4, 8]} />
        <meshStandardMaterial color="#64748b" flatShading />
      </mesh>
      <mesh position={[0.65, 3.5, 0]}>
        <planeGeometry args={[1.3, 0.85]} />
        <meshStandardMaterial color={color} side={DoubleSide} flatShading />
      </mesh>
    </group>
  )
}

function Lanterns() {
  const bulbs = useMemo(() => {
    const out = []
    for (let i = 0; i <= 13; i += 1) {
      const u = i / 13
      out.push([-13 + 26 * u, 4.6 - Math.sin(u * Math.PI) * 0.9, -3.2])
    }
    return out
  }, [])
  return (
    <group>
      {[-13, 0, 13].map((px) => (
        <mesh key={px} position={[px, 2.4, -3.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 4.8, 8]} />
          <meshStandardMaterial color="#64748b" flatShading />
        </mesh>
      ))}
      {bulbs.map(([bx, by, bz], i) => (
        <mesh key={bx} position={[bx, by, bz]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 ? '#fde68a' : '#fca5a5'}
            emissive={i % 2 ? '#f59e0b' : '#ef4444'}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#7cc576" />
      </mesh>
      <mesh position={[1, 0.02, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 26]} />
        <meshStandardMaterial color="#e9d9a8" />
      </mesh>
    </group>
  )
}

function FairWorld() {
  return (
    <group>
      <Ground />
      {Array.from({ length: 7 }).map((_, i) => (
        <Stall key={i} x={-12 + i * 4} z={-6.5} index={i} color={STALL_COLORS[i]} />
      ))}
      <Lanterns />
      <Banner x={-6} z={0} color="#ef4444" />
      <Banner x={-9} z={5} color="#3b82f6" />
      <Banner x={11} z={6} color="#f59e0b" />
      <Office />
      <Table x={0.2} z={3.3} w={2.4} d={1} paper />
      <Table x={2.4} z={2.9} w={2} d={1.2} label="Table 7" />
      {TREES.map(([tx, tz, ts]) => (
        <Tree key={`${tx}:${tz}`} x={tx} z={tz} scale={ts} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- evidence
function MarkerShape({ kind, color }) {
  if (kind === 'laptop') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.9, 0.07, 0.6]} />
          <meshStandardMaterial color="#e2e8f0" emissive={color} emissiveIntensity={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.3, -0.28]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.9, 0.55, 0.05]} />
          <meshStandardMaterial color="#0f172a" emissive={color} emissiveIntensity={0.9} flatShading />
        </mesh>
      </group>
    )
  }
  if (kind === 'crystal') {
    return (
      <mesh castShadow>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} flatShading />
      </mesh>
    )
  }
  return (
    <mesh castShadow>
      <boxGeometry args={[0.75, 0.06, 0.95]} />
      <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.5} flatShading />
    </mesh>
  )
}

function Marker({ entry, isNearby, isFound }) {
  const body = useRef(null)
  const clock = useRef(entry.position[0] * 3)

  useFrame((_state, delta) => {
    clock.current += delta
    const node = body.current
    if (!node) return
    node.position.y = 1.15 + Math.sin(clock.current * 2) * 0.12
    node.rotation.y += delta * 0.9
  })

  const color = isFound ? '#60a5fa' : isNearby ? '#fbbf24' : '#34d399'
  // Small title when far away; bigger with a hint only when the player is close.
  const sub = isNearby ? 'Press E to inspect' : isFound ? 'Logged' : ''
  const [x, , z] = entry.position

  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.6, 0.9, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <group ref={body} scale={isNearby ? 1.25 : 1}>
        <MarkerShape kind={entry.object} color={color} />
      </group>
      <Label
        title={entry.title}
        sub={sub}
        accent={color}
        position={[0, 2.1, 0]}
        width={isNearby ? 2.1 : 1.35}
      />
    </group>
  )
}

// ---------------------------------------------------------------- player
function PlayerRig({ interactive, paused, evidence, onNearby, onInspect }) {
  const group = useRef(null)
  const player = useRef({ x: SPAWN.x, z: SPAWN.z, heading: 0, leanX: 0, leanZ: 0, time: 0 })
  const held = useRef(new Set())
  const nearby = useRef(null)
  const walking = useRef(false)
  const live = useRef({ interactive, paused, evidence, onNearby, onInspect })

  useEffect(() => {
    live.current = { interactive, paused, evidence, onNearby, onInspect }
  })

  useEffect(() => {
    const MOVE_KEYS = [
      'w', 'a', 's', 'd',
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    ]
    const isTyping = (target) =>
      !!target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable === true)

    const onKeyDown = (event) => {
      const state = live.current
      if (!state.interactive || state.paused) return
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return
      const key = String(event.key).toLowerCase()
      if (MOVE_KEYS.includes(key)) {
        held.current.add(key)
        event.preventDefault()
        return
      }
      if (key === 'e' && !event.repeat && nearby.current) {
        event.preventDefault()
        if (state.onInspect) state.onInspect(nearby.current)
      }
    }
    const onKeyUp = (event) => {
      held.current.delete(String(event.key).toLowerCase())
    }
    const onBlur = () => held.current.clear()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((state, delta) => {
    const s = live.current
    const p = player.current
    const dt = Math.min(delta, 0.05)
    const active = s.interactive && !s.paused
    p.time += dt

    if (!active) held.current.clear()
    const keys = held.current
    let dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0)
    let dz = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0)
    const moving = dx !== 0 || dz !== 0
    walking.current = moving

    if (moving) {
      const len = Math.hypot(dx, dz)
      dx /= len
      dz /= len
      const nx = p.x + dx * SPEED * dt
      if (!isBlocked(nx, p.z)) p.x = nx
      const nz = p.z + dz * SPEED * dt
      if (!isBlocked(p.x, nz)) p.z = nz
    }

    // The detective keeps facing the camera. He only turns a little toward
    // sideways movement and leans into the direction he walks.
    const blend = Math.min(1, dt * 10)
    p.heading = turnToward(p.heading, dx * 0.5, blend)
    p.leanZ += (-dx * 0.12 - p.leanZ) * blend
    p.leanX += (dz * 0.1 - p.leanX) * blend

    const node = group.current
    if (node) {
      node.position.set(p.x, moving ? Math.abs(Math.sin(p.time * 10)) * 0.08 : 0, p.z)
      node.rotation.y = p.heading
      node.rotation.x = p.leanX
      node.rotation.z = p.leanZ + (moving ? Math.sin(p.time * 10) * 0.03 : 0)
    }

    // Camera follows from behind and above.
    const camera = state.camera
    const k = 1 - Math.exp(-6 * dt)
    camera.position.x += (p.x - camera.position.x) * k
    camera.position.y += (CAMERA_OFFSET.y - camera.position.y) * k
    camera.position.z += (p.z + CAMERA_OFFSET.z - camera.position.z) * k
    camera.lookAt(p.x, 1.1, p.z - 1.5)

    // Which evidence is the player standing next to?
    if (active) {
      const best = nearestEvidence(s.evidence || NONE, p.x, p.z)
      if (best !== nearby.current) {
        nearby.current = best
        if (s.onNearby) s.onNearby(best)
      }
    } else if (!s.interactive && nearby.current !== null) {
      nearby.current = null
      if (s.onNearby) s.onNearby(null)
    }
  })

  return (
    <group ref={group} position={[SPAWN.x, 0, SPAWN.z]} scale={0.85}>
      <Detective movingRef={walking} />
    </group>
  )
}

// ---------------------------------------------------------------- scene
export default function Scene({
  interactive = true,
  evidence = NONE,
  nearbyId = null,
  onNearby,
  onInspect,
  paused = false,
}) {
  const found = useGame((s) => s.caseState?.evidence ?? NONE)

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{
        position: [SPAWN.x, CAMERA_OFFSET.y, SPAWN.z + CAMERA_OFFSET.z],
        fov: 50,
        near: 0.1,
        far: 140,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#cfe8f7']} />
      <fog attach="fog" args={['#cfe8f7', 38, 85]} />

      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#dbeafe', '#6b8f5a', 0.9]} />
      <directionalLight
        position={[10, 18, 12]}
        intensity={2.2}
        color="#fff4d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />

      <FairWorld />

      {evidence.map((entry) => (
        <Marker
          key={entry.id}
          entry={entry}
          isNearby={nearbyId === entry.id}
          isFound={found.includes(entry.id)}
        />
      ))}

      <PlayerRig
        interactive={interactive}
        paused={paused}
        evidence={evidence}
        onNearby={onNearby}
        onInspect={onInspect}
      />
    </Canvas>
  )
}
