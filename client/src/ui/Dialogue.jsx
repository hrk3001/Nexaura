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
      <div className="nex-dialogue" style={{ '--speaker': 0 }}>
        <div className="nex-dialogue-avatar">
          <span>{speaker.charAt(0) || '?'}</span>
        </div>
        <div className="nex-dialogue-main">
          <div className="nex-dialogue-head">
            <span className="nex-dialogue-name">{speaker}</span>
            {role ? <span className="nex-dialogue-role">{role}</span> : null}
            <span className="nex-dialogue-count">{idx + 1} / {total}</span>
          </div>
          <p className="nex-dialogue-text">{text || (idx === 0 ? 'Awaiting clues…' : '')}</p>
          <div className="nex-dialogue-foot">
            <div className="nex-dialogue-dots">
              {dialogue.lines.map((_, i) => (
                <i key={i} className={i <= idx ? 'on' : ''} />
              ))}
            </div>
            <button className="nex-btn small primary" onClick={advance}>
              {last ? 'Close' : 'Continue'} <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .nex-dialogue-layer {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(3,5,12,.62);
          backdrop-filter: blur(6px);
          animation: fin .2s ease;
        }
        .nex-dialogue {
          display: flex;
          gap: 14px;
          max-width: 720px;
          width: 100%;
          background: linear-gradient(160deg, rgba(20,28,56,.97), rgba(9,13,28,.98));
          border: 1px solid rgba(167,139,250,.4);
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: 0 24px 70px rgba(0,0,0,.65);
        }
        .nex-dialogue-avatar {
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 30%, rgba(255,255,255,.25), rgba(52,211,153,.2)),
            rgba(139,92,246,.35);
          border: 2px solid #f5c453;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 0 8px rgba(139,92,246,.6);
        }
        .nex-dialogue-main {
          flex: 1;
          min-width: 0;
        }
        .nex-dialogue-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .nex-dialogue-name {
          font-family: 'MedievalSharp', cursive;
          font-size: 16px;
          font-weight: 700;
          color: #f4efff;
        }
        .nex-dialogue-role {
          font-size: 11px;
          letter-spacing: 1.5px;
          color: #a78bfa;
          text-transform: uppercase;
          font-weight: 700;
        }
        .nex-dialogue-count {
          margin-left: auto;
          font-size: 11.5px;
          letter-spacing: 1px;
          color: #6d6f9a;
          font-weight: 700;
        }
        .nex-dialogue-text {
          margin: 4px 0 12px;
          color: #d7e2ff;
          font-size: 14.5px;
          line-height: 1.6;
          padding-right: 12px;
          white-space: pre-wrap;
        }
        .nex-dialogue-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .nex-dialogue-dots {
          display: flex;
          gap: 5px;
        }
        .nex-dialogue-dots i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(148,170,255,.2);
          transition: background .15s;
        }
        .nex-dialogue-dots i.on {
          background: #a78bfa;
          box-shadow: 0 0 8px rgba(167,139,250,.6);
        }
        .nex-dialogue .nex-btn.small {
          padding: 9px 14px;
          font-size: 13px;
        }
        .nex-dialogue kbd {
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(148,170,255,.35);
          background: rgba(255,255,255,.06);
          color: #c4b5fd;
        }
        @media (max-width: 600px) {
          .nex-dialogue {
            flex-direction: column;
            align-items: flex-start;
          }
          .nex-dialogue-avatar { align-self: flex-start; }
          .nex-dialogue-foot { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  )
}
