
// Detective character node in the 3D scene.
// Kept deliberately low-poly so the investigation reads clearly from the
// camera orbit that OrbitControls adds in Scene.jsx below.
function Detective({}) {
  return (
    <group position={[0, 0.1, -3]}>
      {/* torso */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.85, 1.5, 0.55]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* shoulder cape */}
      <mesh position={[0, 1.05, 0.28]} rotation={[-0.18, 0, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 1.7, 24, 1, true]} />
        <meshStandardMaterial color="#3b82f6" side={2} />
      </mesh>
      {/* head */}
      <mesh castShadow position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* hat brim */}
      <mesh position={[0, 2.12, 0.06]} rotation={[-Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.06, 24]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* hat crown */}
      <mesh position={[0, 2.22, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.5, 24, 1, true]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* badge */}
      <mesh position={[0.42, 1.18, 0.32]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

export default Detective
  export function DetectiveProp({}) {
  return <Detective />
}
