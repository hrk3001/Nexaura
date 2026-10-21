import { useThree } from '@react-three/fiber'

function WorldEnvironment({ world }) {
  const { _env } = useThree()

  // Default detective noir environment
  const defaultEnv = {
    background: '#05070f',
    fog: '#0a1122',
    ground: '#0a1122',
    sun: '#f5c453',
    hemi: '#34d399',
  }

  return world ? defaultEnv : useThree((s) => s.env)
}

export default WorldEnvironment