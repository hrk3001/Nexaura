import { useGame } from '../game/store.js'

export default function Dialogue() {
  const dialogue = useGame((s) => s.dialogue)
  const advance = useGame((s) => s.advanceDialogue)

  if (!dialogue) return null

  const _line = dialogue.lines[dialogue.index]
  const total = dialogue.lines.length
  const last = dialogue.index >= total - 1

  return (
    <div className="nex-dialogue-layer">
      <div className="nex-dialogue" style={{ '--speaker': '0' }}>
        <div className="nex-dialogue-avatar">
          <span>??</span>
        </div>
        <div className="nex-dialogue-main">
          <div className="nex-dialogue-head">
            <span className="nex-dialogue-name">???</span>
            <span className="nex-dialogue-role">?</span>
            <span className="nex-dialogue-count">
              {dialogue.index + 1} / {total}
            </span>
          </div>
          <p className="nex-dialogue-text">Awaiting clues...</p>
          <div className="nex-dialogue-foot">
            <div className="nex-dialogue-dots">
              {dialogue.lines.map((_, i) => (
                <i key={i} className={i <= dialogue.index ? 'on' : ''} />
              ))}
            </div>
            <button className="nex-btn small primary" onClick={advance}>
              {last ? 'Close' : 'Continue'} <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}