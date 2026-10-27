// Fair-stop 3D scenes (one theme per realm).
//
// Props come from App.jsx:
//   interactive  - true while exploring (false while the Java challenge is open)
//   worldId      - arrays | linked | stack | tree | graph | dp (picks the theme)
//   evidence     - worlds[worldId].evidence (id, title, object, position, ...)
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
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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
// BLOCKERS-START
const BLOCKERS_BY_WORLD = {
  arrays: [
    { x: 0.2, z: 3.3, hw: 1.2, hd: 0.5 }, // sign-in desk
    { x: 2.4, z: 2.9, hw: 1.0, hd: 0.6 }, // Table 7
    { x: 7, z: -1, hw: 2.0, hd: 1.5 }, // fair office
  ],
  linked: [
    { x: 11.3, z: -1.5, hw: 1.7, hd: 1.7 }, // maintenance building
    { x: 3.5, z: -0.4, hw: 1.0, hd: 0.6 }, // lost & found booth
  ],
  stack: [
    { x: -9.5, z: 0.5, hw: 1.0, hd: 1.0 }, // ticket stack
    { x: -4, z: 1.2, hw: 1.6, hd: 0.6 }, // prize counter
  ],
  tree: [
    { x: -8, z: -1, hw: 0.8, hd: 0.5 }, // key cabinet
    { x: -1.5, z: -0.8, hw: 0.5, hd: 0.5 }, // play-frame post
    { x: 5.5, z: -0.8, hw: 0.5, hd: 0.5 }, // play-frame post
  ],
  graph: [
    { x: 10.8, z: -1.5, hw: 1.6, hd: 1.1 }, // stage building
    { x: -5, z: 2, hw: 1.1, hd: 0.25 }, // map board
  ],
  dp: [
    { x: -4.5, z: 1.5, hw: 2.1, hd: 0.3 }, // puzzle board
    { x: 3, z: -0.3, hw: 1.2, hd: 0.55 }, // judges' table
    { x: 8.5, z: 1.5, hw: 1.2, hd: 0.55 }, // report desk
  ],
}
// BLOCKERS-END

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
function isBlocked(blockers, x, z) {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  for (const b of blockers) {
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

// ---------------------------------------------------------------- shared bits
function Box({ position, size, color, emissive, intensity = 0.6 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || '#000000'}
        emissiveIntensity={emissive ? intensity : 0}
        flatShading
      />
    </mesh>
  )
}

function Flat({ x, z, w, d, color, y = 0.03 }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function GroundPlane({ color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[140, 140]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// A thin rod between two points in the x/y plane (used by the tree frame).
function Rod({ a, b, z = 0, color = '#94a3b8', radius = 0.09 }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, -Math.atan2(dx, dy)]} castShadow>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

// A flat road between two points on the ground (used by Graph Town).
function Road({ a, b, color = '#475569', width = 0.9 }) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len = Math.hypot(dx, dz)
  return (
    <mesh
      position={[(a[0] + b[0]) / 2, 0.04, (a[1] + b[1]) / 2]}
      rotation={[0, -Math.atan2(dz, dx), 0]}
      receiveShadow
    >
      <boxGeometry args={[len, 0.06, width]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

function Post({ x, z, color = '#ef4444' }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1, 8]} />
        <meshStandardMaterial color="#cbd5e1" flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- Linked List Roller Coaster
const CAR_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#38bdf8', '#a78bfa', '#ec4899', '#14b8a6']

function CoasterWorld() {
  const names = ['A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20']
  return (
    <group>
      <GroundPlane color="#d9c9a0" />
      <Flat x={1} z={2} w={7} d={26} color="#c4b08a" y={0.02} />
      {/* the rail */}
      <Box position={[0, 1.7, -3.4]} size={[27, 0.18, 0.4]} color="#64748b" />
      {[-12, -6, 0, 6, 12].map((px) => (
        <Box key={px} position={[px, 0.85, -3.4]} size={[0.3, 1.7, 0.3]} color="#475569" />
      ))}
      {/* the chain of cars: one link (A17) is missing */}
      {names.map((n, i) => {
        const cx = -9.6 + i * 3.2
        const missing = n === 'A17'
        return (
          <group key={n}>
            {missing ? null : (
              <Box position={[cx, 2.35, -3.4]} size={[2.4, 0.8, 1.2]} color={CAR_COLORS[i]} />
            )}
            {i < names.length - 1 && !missing && names[i + 1] !== 'A17' ? (
              <Box position={[cx + 1.6, 2.35, -3.4]} size={[0.8, 0.12, 0.12]} color="#e2e8f0" />
            ) : null}
            <Label
              title={missing ? 'A17 ?' : n}
              position={[cx, 3.5, -3.4]}
              width={missing ? 1.1 : 0.9}
              accent={missing ? '#f87171' : '#fbbf24'}
            />
          </group>
        )
      })}
      {/* queue posts */}
      {[0, 2, 4, 6, 8].map((pz) => (
        <Post key={pz} x={-7.5} z={pz} color="#f59e0b" />
      ))}
      {/* lost & found */}
      <Box position={[3.5, 0.6, -0.4]} size={[2, 1.2, 1.2]} color="#f1f5f9" />
      <Box position={[3.5, 1.35, -0.4]} size={[2.4, 0.2, 1.6]} color="#38bdf8" />
      <Label title="LOST & FOUND" position={[3.5, 2.3, -0.4]} width={1.6} accent="#38bdf8" />
      {/* maintenance building */}
      <Box position={[11.3, 1.5, -1.5]} size={[3.4, 3, 3.4]} color="#94a3b8" />
      <Box position={[11.3, 3.2, -1.5]} size={[3.8, 0.3, 3.8]} color="#475569" />
      <Box position={[9.58, 1, -1.5]} size={[0.1, 2, 1.1]} color="#7c3f00" />
      <Label title="MAINTENANCE" position={[10.2, 4.2, -1.5]} width={1.7} accent="#f59e0b" />
      <Banner x={-10} z={6} color="#ef4444" />
      <Banner x={12} z={7} color="#3b82f6" />
      {TREES.map(([tx, tz, ts]) => (
        <Tree key={`${tx}:${tz}`} x={tx} z={tz} scale={ts} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- Stack & Queue Arcade
function ArcadeWorld() {
  const colors = ['#ec4899', '#22d3ee', '#a78bfa', '#facc15', '#34d399', '#fb7185']
  return (
    <group>
      <GroundPlane color="#352f6b" />
      <Flat x={1} z={2} w={8} d={26} color="#4338ca" y={0.02} />
      {/* cabinets */}
      {colors.map((c, i) => (
        <group key={c} position={[-10 + i * 4, 0, -3.8]}>
          <Box position={[0, 1.3, 0]} size={[1.9, 2.6, 1.3]} color="#1e1b4b" />
          <Box position={[0, 1.7, 0.68]} size={[1.4, 0.9, 0.06]} color={c} emissive={c} intensity={0.9} />
          <Box position={[0, 0.95, 0.5]} size={[1.5, 0.15, 0.6]} color="#0f172a" />
        </group>
      ))}
      <Label title="ARCADE" position={[0, 4.4, -3.8]} width={2.2} accent="#22d3ee" />
      {/* the ticket stack (last in, first out) */}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} position={[-9.5, 0.4 + i * 0.8, 0.5]} size={[1.6 - i * 0.1, 0.78, 1.6 - i * 0.1]} color={colors[i]} />
      ))}
      <Label title="TOP" position={[-9.5, 4.0, 0.5]} width={0.9} accent="#facc15" />
      {/* prize counter */}
      <Box position={[-4, 0.5, 1.2]} size={[3.2, 1, 1.2]} color="#f1f5f9" />
      <Box position={[-4, 1.1, 1.2]} size={[3.4, 0.2, 1.4]} color="#ec4899" emissive="#ec4899" intensity={0.5} />
      <Label title="PRIZES" position={[-4, 2.2, 1.2]} width={1.2} accent="#ec4899" />
      {/* queue screen on a pole */}
      <Box position={[9, 1.2, 0.5]} size={[0.2, 2.4, 0.2]} color="#94a3b8" />
      <Box position={[9, 2.9, 0.5]} size={[2.6, 1.4, 0.15]} color="#0f172a" emissive="#22d3ee" intensity={0.7} />
      <Label title="QUEUE 4 > 6" position={[9, 4.2, 0.5]} width={1.5} accent="#22d3ee" />
      {/* queue ropes */}
      {[5, 6.5, 8].map((px) => (
        <Post key={px} x={px} z={6} color="#22d3ee" />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- Tree Playground
function PlaygroundWorld() {
  const root = [0, 5.2]
  const l = [-4, 3.6]
  const r = [4, 3.6]
  const leaves = [
    [-6, 2],
    [-2, 2],
    [2, 2],
    [6, 2],
  ]
  const nodes = [
    { p: root, name: 'MR. RAO', c: '#f87171' },
    { p: l, name: 'OFFICE', c: '#38bdf8' },
    { p: r, name: 'PRINTING BOOTH', c: '#fbbf24' },
    { p: leaves[0], name: '', c: '#34d399' },
    { p: leaves[1], name: '', c: '#34d399' },
    { p: leaves[2], name: 'DEV', c: '#a78bfa' },
    { p: leaves[3], name: '', c: '#34d399' },
  ]
  return (
    <group>
      <GroundPlane color="#86c777" />
      <Flat x={1} z={2} w={7} d={26} color="#e9d9a8" y={0.02} />
      <Flat x={4.5} z={4} w={4} d={3} color="#f1dfae" y={0.03} />
      {/* the play frame: a binary tree */}
      <Rod a={root} b={l} z={-2.5} />
      <Rod a={root} b={r} z={-2.5} />
      <Rod a={l} b={leaves[0]} z={-2.5} />
      <Rod a={l} b={leaves[1]} z={-2.5} />
      <Rod a={r} b={leaves[2]} z={-2.5} />
      <Rod a={r} b={leaves[3]} z={-2.5} />
      {nodes.map((n) => (
        <mesh key={`${n.p[0]}:${n.p[1]}`} position={[n.p[0], n.p[1], -2.5]} castShadow>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial color={n.c} emissive={n.c} emissiveIntensity={0.25} flatShading />
        </mesh>
      ))}
      <Label title="MR. RAO" position={[0, 6.4, -2.5]} width={1.3} accent="#f87171" />
      <Label title="OFFICE" position={[-4, 4.8, -2.5]} width={1.1} accent="#38bdf8" />
      <Label title="PRINTING BOOTH" position={[4, 4.8, -2.5]} width={1.9} accent="#fbbf24" />
      <Label title="DEV" position={[2, 3.2, -2.5]} width={0.9} accent="#a78bfa" />
      {/* two legs holding the frame up */}
      <Box position={[-1.5, 1.2, -0.8]} size={[0.3, 2.4, 0.3]} color="#78350f" />
      <Box position={[5.5, 1.2, -0.8]} size={[0.3, 2.4, 0.3]} color="#78350f" />
      {/* key cabinet */}
      <Box position={[-8, 1, -1]} size={[1.6, 2, 1]} color="#a16207" />
      <Label title="KEYS" position={[-8, 2.9, -1]} width={0.9} accent="#fbbf24" />
      <Banner x={-11} z={5} color="#3b82f6" />
      <Banner x={11} z={6} color="#ef4444" />
      {TREES.map(([tx, tz, ts]) => (
        <Tree key={`${tx}:${tz}`} x={tx} z={tz} scale={ts} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- Graph Town
const GRAPH_NODES = {
  office: { p: [-10, -1.5], name: 'OFFICE', c: '#38bdf8' },
  gate: { p: [-4, -3.2], name: 'GATE', c: '#34d399' },
  booth: { p: [1.5, -1.5], name: 'BOOTH', c: '#fbbf24' },
  square: { p: [1.5, 5.5], name: 'SQUARE', c: '#f472b6' },
  stage: { p: [9, -1.5], name: 'STAGE', c: '#a78bfa' },
}
const GRAPH_EDGES = [
  ['office', 'gate'],
  ['office', 'booth'],
  ['gate', 'booth'],
  ['booth', 'stage'],
  ['booth', 'square'],
]

function GraphWorld() {
  return (
    <group>
      <GroundPlane color="#aab4bf" />
      {GRAPH_EDGES.map(([a, b]) => (
        <Road key={`${a}-${b}`} a={GRAPH_NODES[a].p} b={GRAPH_NODES[b].p} />
      ))}
      {Object.entries(GRAPH_NODES).map(([id, n]) => (
        <group key={id} position={[n.p[0], 0, n.p[1]]}>
          <mesh position={[0, 0.12, 0]} receiveShadow>
            <cylinderGeometry args={[1, 1, 0.16, 24]} />
            <meshStandardMaterial color={n.c} flatShading />
          </mesh>
          <Label title={n.name} position={[0, 2.2, 0]} width={1.2} accent={n.c} />
        </group>
      ))}
      <Box position={[10.8, 1.2, -1.5]} size={[3, 2.4, 2]} color="#cbd5e1" />
      <Box position={[10.8, 2.6, -1.5]} size={[3.4, 0.25, 2.4]} color="#7c3aed" />
      <Box position={[-10.5, 1.2, -3]} size={[2.4, 2.4, 1.6]} color="#dbe4ee" />
      <Box position={[-10.5, 2.55, -3]} size={[2.8, 0.25, 2]} color="#b45309" />
      {/* map board */}
      <Box position={[-5, 1.0, 2]} size={[2.2, 1.6, 0.15]} color="#f8fafc" />
      <Box position={[-5.9, 0.4, 2]} size={[0.12, 0.8, 0.12]} color="#64748b" />
      <Box position={[-4.1, 0.4, 2]} size={[0.12, 0.8, 0.12]} color="#64748b" />
      <Label title="TOWN MAP" position={[-5, 2.4, 2]} width={1.3} accent="#38bdf8" />
      {TREES.map(([tx, tz, ts]) => (
        <Tree key={`${tx}:${tz}`} x={tx} z={tz} scale={ts} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- DP Puzzle Park
function PuzzleWorld() {
  const times = ['8:05', '8:18', '8:26', '8:40']
  const tileColors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa']
  const grid = []
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      grid.push([-12 + c * 1.1, 6 + r * 1.1, (r + c) % 2])
    }
  }
  return (
    <group>
      <GroundPlane color="#8fd3c8" />
      <Flat x={1} z={2} w={7} d={26} color="#cdeee8" y={0.02} />
      {/* the timeline strip */}
      {times.map((t, i) => (
        <group key={t}>
          <Box position={[-6 + i * 4, 0.12, -3]} size={[2.6, 0.2, 1.8]} color={tileColors[i]} />
          <Label title={t} position={[-6 + i * 4, 1.3, -3]} width={0.9} accent={tileColors[i]} />
        </group>
      ))}
      {/* a dp table on the ground */}
      {grid.map(([gx, gz, alt]) => (
        <Flat key={`${gx}:${gz}`} x={gx} z={gz} w={1} d={1} color={alt ? '#5eead4' : '#99f6e4'} y={0.04} />
      ))}
      {/* puzzle board */}
      <Box position={[-4.5, 1.1, 1.5]} size={[4, 2.2, 0.2]} color="#f8fafc" />
      <Box position={[-6, 0.4, 1.5]} size={[0.15, 0.8, 0.15]} color="#64748b" />
      <Box position={[-3, 0.4, 1.5]} size={[0.15, 0.8, 0.15]} color="#64748b" />
      <Label title="TIMELINE" position={[-4.5, 2.9, 1.5]} width={1.5} accent="#14b8a6" />
      {/* judges' table */}
      <Table x={3} z={-0.3} w={2.4} d={1.1} label="JUDGES" paper />
      {/* report desk */}
      <Table x={8.5} z={1.5} w={2.4} d={1.1} label="REPORT" />
      {/* big puzzle blocks */}
      <Box position={[-10, 0.8, -1.5]} size={[1.6, 1.6, 1.6]} color="#f472b6" />
      <Box position={[-8.2, 0.5, -1.2]} size={[1, 1, 1]} color="#fbbf24" />
      <Box position={[11, 0.8, -3]} size={[1.6, 1.6, 1.6]} color="#a78bfa" />
      <Banner x={-11} z={3} color="#14b8a6" />
      <Banner x={11} z={6} color="#f59e0b" />
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
  if (kind === 'ring') {
    return (
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.09, 12, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} flatShading />
      </mesh>
    )
  }
  if (kind === 'cube') {
    return (
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#f1f5f9" emissive={color} emissiveIntensity={0.55} flatShading />
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
function PlayerRig({ interactive, paused, evidence, blockers, onNearby, onInspect }) {
  const group = useRef(null)
  const player = useRef({ x: SPAWN.x, z: SPAWN.z, heading: 0, leanX: 0, leanZ: 0, time: 0 })
  const held = useRef(new Set())
  const nearby = useRef(null)
  const walking = useRef(false)
  const live = useRef({ interactive, paused, evidence, blockers, onNearby, onInspect })

  useEffect(() => {
    live.current = { interactive, paused, evidence, blockers, onNearby, onInspect }
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
    window.__nexauraPlayer = { x: p.x, z: p.z }

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
      if (!isBlocked(s.blockers, nx, p.z)) p.x = nx
      const nz = p.z + dz * SPEED * dt
      if (!isBlocked(s.blockers, p.x, nz)) p.z = nz
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

// ---------------------------------------------------------------- cleanup
// Browsers only allow a handful of live WebGL contexts. Without this, leaving
// a realm keeps its context alive and after a few realms the next scene fails
// with "Error creating WebGL context". Runs when the Canvas goes away.
function ContextCleanup() {
  const gl = useThree((state) => state.gl)
  useEffect(
    () => () => {
      // Wait a tick: in dev, React may unmount and remount the same canvas.
      setTimeout(() => {
        if (gl.domElement && gl.domElement.isConnected) return
        try {
          gl.dispose()
          gl.forceContextLoss()
        } catch (_e) {
          /* already gone */
        }
      }, 0)
    },
    [gl],
  )
  return null
}

// ---------------------------------------------------------------- scene
const THEMES = {
  arrays: { sky: '#cfe8f7', fogNear: 38, ambient: 0.8, hemi: ['#dbeafe', '#6b8f5a', 0.9], sun: 2.2, World: FairWorld },
  linked: { sky: '#bfe3f5', fogNear: 38, ambient: 0.85, hemi: ['#dbeafe', '#a8946a', 0.9], sun: 2.2, World: CoasterWorld },
  stack: { sky: '#2b2660', fogNear: 30, ambient: 1.1, hemi: ['#c4b5fd', '#312e81', 1.2], sun: 1.6, World: ArcadeWorld },
  tree: { sky: '#c7ecff', fogNear: 38, ambient: 0.8, hemi: ['#dbeafe', '#6b8f5a', 0.9], sun: 2.2, World: PlaygroundWorld },
  graph: { sky: '#d7e3f4', fogNear: 38, ambient: 0.9, hemi: ['#e0f2fe', '#94a3b8', 0.9], sun: 2.0, World: GraphWorld },
  dp: { sky: '#d4f3f0', fogNear: 38, ambient: 0.9, hemi: ['#ecfeff', '#5eead4', 0.9], sun: 2.0, World: PuzzleWorld },
}

export default function Scene({
  worldId = 'arrays',
  interactive = true,
  evidence = NONE,
  nearbyId = null,
  onNearby,
  onInspect,
  paused = false,
}) {
  const found = useGame((s) => s.caseState?.evidence ?? NONE)
  const theme = THEMES[worldId] || THEMES.arrays
  const World = theme.World
  const blockers = BLOCKERS_BY_WORLD[worldId] || BLOCKERS_BY_WORLD.arrays

  return (
    <Canvas
      key={worldId}
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
      <ContextCleanup />
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, theme.fogNear, 85]} />

      <ambientLight intensity={theme.ambient} />
      <hemisphereLight args={theme.hemi} />
      <directionalLight
        position={[10, 18, 12]}
        intensity={theme.sun}
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

      <World />

      {evidence.map((entry) => (
        <Marker
          key={entry.id}
          entry={entry}
          isNearby={nearbyId === entry.id}
          isFound={found.some((item) => item && item.id === entry.id)}
        />
      ))}

      <PlayerRig
        interactive={interactive}
        paused={paused}
        evidence={evidence}
        blockers={blockers}
        onNearby={onNearby}
        onInspect={onInspect}
      />
    </Canvas>
  )
}
