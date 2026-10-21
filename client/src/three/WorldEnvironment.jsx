import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'

function SafeEnv({ world }) {
  if (!world) return null
  const palette = world.gradient || ['#34d399', '#10b981']

  return (
    <group>
      <ambientLight intensity={0.32} />
      <hemisphereLight
        args={[palette[0], '#0a1226', 0.85]}
        intensity={0.7}
      />
      <directionalLight
        position={[11, 18, 9]}
        intensity={1.45}
        color="#f5c453"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
    </group>
  )
}

export default function WorldEnvironment({ world }) {
  // Use a proper hook at the top level; choose the palette via memo, never
  // inside a ternary that gatekeeps the hook call.
  useThree()
  useMemo(() => (world ? { sun: '#f5c453', hemi: world.gradient?.[0] || '#34d399' } : {}),
    [world])
  return <SafeEnv world={world} />
}
