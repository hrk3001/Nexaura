import { useGame } from '../game/store.js'

export default function Dialogue() {
  const dialogue = useGame((s) => s.dialogue)
  const advance = useGame((s) => s.advanceDialogue)

  if (!dialogue || !dialogue.lines.length) return null

  const idx = dialogue.index
  const total = dialogue.lines.length
  const last = idx >= total - 1

  const raw = dialogue.lines[idx] || {}
  const text = raw.text ?? raw.body ?? ''
  const speaker = raw.speaker ?? raw.who ?? raw.name ?? '???'
  const role = raw.role ?? raw.title ?? raw.tag ?? ''

  return (
    <div
      className="nex-dialogue-layer"
      data-testid="dialogue"
      onClick={(e) => e.target === e.currentTarget && advance()}
    >
      <div className="nex-dialogue">
        <div className="nex-dialogue-avatar" aria-hidden="true">
          <span>{speaker.charAt(0) || '?'}</span>
        </div>
        <div className="nex-dialogue-main">
          <div className="nex-dialogue-head">
            <span className="nex-dialogue-name">{speaker}</span>
            {role ? <span className="nex-dialogue-role">{role}</span> : null}
            <span className="nex-dialogue-count">{idx + 1} / {total}</span>
          </div>
          <p className="nex-dialogue-text">{text || (idx === 0 ? 'IRI is waiting for your next lead…' : '')}</p>
          <div className="nex-dialogue-foot">
            <div className="nex-dialogue-dots">
              {dialogue.lines.map((_, i) => (
                <i key={i} className={i <= idx ? 'on' : ''} />
              ))}
            </div>
            <button className="nex-btn small nex-primary" onClick={advance}>
              {last ? 'Close' : 'Continue'} <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
