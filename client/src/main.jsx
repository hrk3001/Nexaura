import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Error Boundary to catch rendering crashes and show a visible message
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, componentStack: null }
    this.error = null
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log the error with component stack to console
    console.error('React Error Boundary caught:', error, info.componentStack)
    this.setState({
      hasError: true,
      componentStack: info.componentStack
    })
    this.error = error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 24, textAlign: 'center', color: 'var(--tx)'}}>
          <h3>An error occurred.</h3>
          <p>{this.error.message || 'Unknown error'}</p>
          {this.state.componentStack && <pre style={{color: '#wee', background: '#000', padding: 16, marginTop: 16}}>{this.state.componentStack}</pre>}
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{marginTop: 16, padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 4}}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)