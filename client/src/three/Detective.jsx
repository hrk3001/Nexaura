// The detective: a stylised 3D man built from smooth shapes.
// Front of the character is +z. He has a fedora, trench coat, tie and a
// magnifying glass. Arms and legs swing while he walks.
//
// `movingRef` (optional) is a React ref whose .current is true while the
// player is walking. This component uses useFrame, so it must be rendered
// inside <Canvas> (Scene.jsx does that).
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide } from 'three'

const SKIN = '#f0c7a0'
const COAT = '#a67c52'
const COAT_DARK = '#7c5a3a'
const PANTS = '#1f2937'
const SHOES = '#111827'
const HAT = '#44403c'

function Limb({ side, color, pivotRef, length = 0.45, children }) {
  // The group is positioned AT the shoulder, so rotating it swings the arm.
  return (
    <group ref={pivotRef} position={[side * 0.42, 1.58, 0]}>
      <mesh position={[0, -0.32, 0]} castShadow>
        <capsuleGeometry args={[0.09, length, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.66, 0]} castShadow>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {children}
    </group>
  )
}

export default function Detective({ movingRef }) {
  const legL = useRef(null)
  const legR = useRef(null)
  const armL = useRef(null)
  const armR = useRef(null)
  const phase = useRef(0)
  const amount = useRef(0)

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05)
    const moving = movingRef ? movingRef.current === true : false
    amount.current += ((moving ? 1 : 0) - amount.current) * Math.min(1, dt * 10)
    if (moving) phase.current += dt * 10
    const swing = Math.sin(phase.current) * 0.8 * amount.current
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (armL.current) armL.current.rotation.x = -swing * 0.8
    if (armR.current) armR.current.rotation.x = swing * 0.5
  })

  return (
    <group>
      {/* legs (pivot at the hip) */}
      {[-1, 1].map((side) => (
        <group key={side} ref={side < 0 ? legL : legR} position={[side * 0.16, 0.92, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.5, 6, 12]} />
            <meshStandardMaterial color={PANTS} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.84, 0.07]} scale={[1, 0.6, 1.6]} castShadow>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color={SHOES} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* trench coat: skirt + torso + belt + collar */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.5, 0.62, 20]} />
        <meshStandardMaterial color={COAT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.3, 0]} scale={[1, 1, 0.78]} castShadow>
        <capsuleGeometry args={[0.31, 0.38, 8, 16]} />
        <meshStandardMaterial color={COAT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]}>
        <torusGeometry args={[0.35, 0.035, 8, 24]} />
        <meshStandardMaterial color="#3f2d1c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.66, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.07, 8, 20]} />
        <meshStandardMaterial color={COAT_DARK} roughness={0.85} />
      </mesh>

      {/* shirt front + tie */}
      <mesh position={[0, 1.42, 0.24]} scale={[1, 1, 0.5]}>
        <boxGeometry args={[0.22, 0.46, 0.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 0.275]}>
        <boxGeometry args={[0.07, 0.34, 0.03]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>

      {/* arms (pivot at the shoulder) */}
      <Limb side={-1} color={COAT} pivotRef={armL} />
      <Limb side={1} color={COAT} pivotRef={armR}>
          {/* magnifying glass */}
          <group position={[0, -0.66, 0.08]} rotation={[1.1, 0, 0]}>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color="#5b3a1e" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.44, 0]}>
              <torusGeometry args={[0.14, 0.025, 10, 24]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.44, 0]}>
              <circleGeometry args={[0.13, 24]} />
              <meshStandardMaterial
                color="#bae6fd"
                transparent
                opacity={0.45}
                side={DoubleSide}
                roughness={0.1}
              />
            </mesh>
          </group>
      </Limb>

      {/* neck + head */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.14, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2, 0]} scale={[1, 1.1, 1]} castShadow>
        <sphereGeometry args={[0.27, 24, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      <mesh position={[-0.275, 2, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      <mesh position={[0.275, 2, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* face */}
      <mesh position={[-0.09, 2.04, 0.245]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>
      <mesh position={[0.09, 2.04, 0.245]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.98, 0.27]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#e2a982" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.89, 0.258]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.6} />
      </mesh>

      {/* fedora */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.47, 0.47, 0.04, 28]} />
        <meshStandardMaterial color={HAT} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.37, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.31, 0.33, 24]} />
        <meshStandardMaterial color={HAT} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.26, 0]}>
        <cylinderGeometry args={[0.315, 0.315, 0.07, 24]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
    </group>
  )
}
