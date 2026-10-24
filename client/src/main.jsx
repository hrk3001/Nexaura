import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './nexaura.css'
import { useGame } from './game/store.js'
import App from './App.jsx'

// The thrown value may be anything — an Error, a string, or even null/undefined
// (JSX allows `throw null`). Never assume `.message` exists.
function describeThrown(value) {
  if (value === null) return 'null was thrown'
  if (value === undefined) return 'undefined was thrown'
  if (typeof value === 'string') return value || 'Empty error'
  if (value instanceof Error) return `${value.name}: ${value.message}`
  try {
    return String(value)
  } catch {
    return 'Unreadable error value'
  }
}

// Error Boundary to catch rendering crashes and show a visible message.
// The thrown value is stored in state (not on the instance) because React
// renders the fallback before componentDidCatch runs, so an instance field
// would still be null on the first fallback frame — that is what used to
// crash the boundary itself and leave a blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log the original thrown value even when it is null/undefined or a string.
    const componentStack = info?.componentStack ?? null
    console.error('React Error Boundary caught:', error, componentStack)
    if (this.state.componentStack !== componentStack) {
      this.setState({ componentStack })
    }
  }

  backToCaseMap = () => {
    this.setState({ hasError: false, error: null, componentStack: null })
    useGame.getState().goMap()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = describeThrown(this.state.error)
    const { componentStack } = this.state

    return (
      <main className="nex-root nex-boundary" role="alert" data-testid="error-boundary">
        <p className="nx-kicker">Nexaura · Case file 001</p>
        <h3>Something went wrong loading this scene</h3>
        <p className="nex-boundary-detail">{message}</p>
        {componentStack ? (
          <pre className="nex-boundary-stack">{componentStack}</pre>
        ) : null}
        <div className="nex-boundary-actions">
          <button className="nex-btn nex-primary" onClick={this.backToCaseMap}>
            Back to case map
          </button>
        </div>
      </main>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
