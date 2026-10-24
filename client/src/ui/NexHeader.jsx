export default function NexHeader({ right = null }) {
  return (
    <header className="nex-topbar">
      <div className="nex-brand">
        <span className="nex-brand-mark" aria-hidden="true" />
        <span className="nex-brand-text">
          NEXAURA
          <em>Investigation unit</em>
        </span>
      </div>
      {right ? <div className="nex-topbar-right">{right}</div> : null}
    </header>
  )
}
