
// Detective character node in the 3D scene.
// Kept deliberately low-poly so the investigation reads clearly from the
// camera orbit that OrbitControls adds in Scene.jsx below.
function Detective({ position = [0, 0, 0] }) {
  const group = (
    <group position={position}>
      {/* legs */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.34, 0.9, 0.24]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* torso / shirt */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.8, 1.15, 0.6]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      {/* coat */}
      <mesh position={[0, 1.5, 0.55]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.25, 0.95, 0.55]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* head */}
      <mesh castShadow position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.46, 22, 22]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* hat brim */}
      <mesh position={[0, 2.15, 0.08]} rotation={[-Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 24]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* hat crown */}
      <mesh position={[0, 2.28, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.55, 24, 1, true]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* badge */}
      <mesh position={[0.48, 1.25, 0.38]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.45} />
      </mesh>
    </group>
  )
  return group
}

export default Detective
