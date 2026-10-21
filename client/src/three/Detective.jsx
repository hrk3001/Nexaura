import { useThree } from '@react-three/fiber'

// Detective character node in the 3D scene
function Detective({}) {
  const { _gl } = useThree()

  return (
    <group>
      {/* Placeholder for detective model - will be replaced with actual glTF */}
      <box
        position={[0, 1, -3]}
        rotation={[0, 0, 0]}
        args={[1, 2, 1]}
        color={ '#34d399' }
        transparent
        opacity={0.8}
      >
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#34d399" />
      </box>
    </group>
  )
}

export default Detective
  export function DetectiveProp({}) {
  return <Detective />
}