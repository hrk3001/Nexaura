import { Suspense, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import WorldEnvironment from './WorldEnvironment.jsx'
import Detective from './Detective.jsx'

// Tree component for the forest
function Tree({ position = [0, 0, 0], height = 10 }) {
  return (
    <group position={position} rotation={[0, Math.random() * Math.PI * 2, 0]}>
      <group position={[0, height / 2, 0]} rotation={[ -Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          radiusTop={0}
          radiusBottom={1}
          height={height}
          radialSegments={12}
          openEnded
        />
        <meshStandardMaterial
          color={ '#22c55e' }
          flatShading
        />
      </group>
      <group position={[0, height * 0.3, 0]}>
        <sphereGeometry args={[2, 12, 12]} />
        <meshStandardMaterial color={ '#16a34a' } />
      </group>
    </group>
  )
}

// Evidence object
function Evidence({ position, type = 'record' }) {
  const shapes = {
    record: { geometry: 'boxGeometry', args: [1, 2, 1], color: '#3b82f6' },
    laptop: { geometry: 'boxGeometry', args: [3, 0.5, 2], color: '#f59e0b' },
    badge: { geometry: 'icosahedronGeometry', args: [1, 1, 1], color: '#ec4899' }
  }

  const _shape = shapes[type]
  return (
    <group position={position}>
      <mesh
        geometry={type === 'record' ? <boxGeometry args={[1, 2, 1]} /> : shapes[type].geometry}
        material={new MeshStandardMaterial({ color: shapes[type].color })}
      />
    </group>
  )
}

// Investigation spot
function InvestigationSpot({ position, _label, enabled = true }) {
  return (
    <group position={position}>
      <boxGeometry args={[2, 0.1, 2]} />
      <meshStandardMaterial
        color={enabled ? '#3b82f6' : '#6b7280'}
        opacity={0.4}
        transparent
      />
      <ambientLight intensity={0.5} />
    </group>
  )
}function PlayerRigProps({ world }) {
  const _env = useThree()
  const ref = useRef(null)

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001
    }
  })

  const _defaultEnv = {
    background: '#05070f',
    fog: '#0a1122',
    ground: '#0a1122',
    sun: '#f5c453',
    hemi: '#34d399',
  }

  return (
    <group ref={ref}>
      <Detective world={world} />
    </group>
  )
}

export default function Scene({ world, _caseState }) {
  const _defaultEnv = {
    background: '#05070f',
    fog: '#0a1122',
    ground: '#0a1122',
    sun: '#f5c453',
    hemi: '#34d399',
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.2, 23], fov: 55, near: 0.1, far: 140 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerDown={orbitCamera}
      onWheel={zoomCamera}
    >
      <ambientLight intensity={0.34} />
      <hemisphereLight args={[_defaultEnv.hemi, _defaultEnv.ground, 0.85]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.5}
        color={_defaultEnv.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />

      <Suspense fallback={null}>
        <WorldEnvironment world={world} />
        <Detective world={world} />
</Suspense>

      {/* Forest trees in a grid */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Tree
          key={i}
          position={[ (i % 5) * 4 - 12, 0, Math.floor(i / 5) * 4 - 12 ]}
          height={8 + Math.random() * 4}
        />
      ))}

      {/* Investigation spots */}
      <InvestigationSpot position={[-8, 0, 0]} label="Computer Terminal" enabled={true} />
      <InvestigationSpot position={[8, 0, 0]} label="Research Notes" enabled={true} />
      <InvestigationSpot position={[0, 0, -8]} label="Evidence Bag" enabled={true} />

      {/* Evidence objects */}
      <Evidence position={[-8, 1, 0]} type="laptop" />
      <Evidence position={[8, 1, 0]} type="record" />
      <Evidence position={[0, 1, -8]} type="badge" />

      <PlayerRigProps world={world} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        rotateSpeed={0.5}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI - 0.5}
        damping={0.1}
      />

    </Canvas>
  )
}