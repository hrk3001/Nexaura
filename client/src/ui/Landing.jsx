import { useGame } from '../game/store.js'
import { CASE } from '../game/worlds.js'
import NexHeader from './NexHeader.jsx'

export default function Landing() {
  const setView = useGame((s) => s.setView)

  return (
    <div className="nex-root nex-landing" data-testid="landing">
      <NexHeader
        right={(
          <>
            <span className="nex-case-tag">Case file 001</span>
            <span className="nex-status">
              <span className="nex-status-dot" aria-hidden="true" />
              Active
            </span>
          </>
        )}
      />

      <div className="nex-landing-shell">
        <div className="nex-landing-grid">
          <section className="nex-landing-copy">
            <p className="nx-kicker">Nexaura / Case file 001</p>

            <h1 className="nex-landing-title">
              The Missing <span>Notebook</span>
            </h1>

            <p className="nex-landing-tagline">
              Maple Park Science Fair. Maya's notebook has vanished from the fair
              office, and judging begins at 9:00 AM. IRI is waiting at the case map.
              Six fair stops hold the records that will lead you to the notebook —
              and to the person who took it.
            </p>

            <div className="nex-landing-cta">
              <button
                className="nex-btn nex-primary lg"
                onClick={() => setView('intro')}
              >
                ENTER THE INVESTIGATION <span className="nex-btn-arrow" aria-hidden="true">→</span>
              </button>
            </div>

            <div className="nex-landing-meta" aria-label="Case facts">
              <span><i aria-hidden="true" />Maple Park</span>
              <span>08:05 — 09:00</span>
              <span>6 fair stops</span>
              <span>1 missing notebook</span>
            </div>
          </section>

          <aside className="nex-case-card" aria-label="Case brief">
            <div className="nex-case-card-head">
              <div>
                <p className="nx-kicker">Case brief</p>
                <h2 className="nex-case-card-title">{CASE.title}</h2>
              </div>
              <span className="nex-classified">Classified</span>
            </div>

            <dl className="nex-case-rows">
              <div className="nex-case-row">
                <dt>Location</dt>
                <dd>{CASE.location}</dd>
              </div>
              <div className="nex-case-row">
                <dt>Deadline</dt>
                <dd><em>{CASE.deadline}</em> — judging begins</dd>
              </div>
              <div className="nex-case-row">
                <dt>Lead</dt>
                <dd>{CASE.detective} — investigation assistant</dd>
              </div>
              <div className="nex-case-row">
                <dt>Owner</dt>
                <dd>{CASE.owner} — notebook owner</dd>
              </div>
              <div className="nex-case-row">
                <dt>Fair organiser</dt>
                <dd>{CASE.organiser}</dd>
              </div>
              <div className="nex-case-row">
                <dt>Lab partner</dt>
                <dd>{CASE.partner}</dd>
              </div>
            </dl>

            <div className="nex-case-card-foot">
              <span>Last seen</span>
              <strong>08:05 · Fair office</strong>
            </div>
          </aside>
        </div>

        <footer className="nex-landing-footer">
          <span><i aria-hidden="true" />IRI · investigation assistant online</span>
          <span>Maple Park Science Fair · Case 001</span>
          <span>Six records. One timeline.</span>
        </footer>
      </div>
    </div>
  )
}
