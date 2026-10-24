import { useState } from 'react'
import { useGame } from '../game/store.js'
import NexHeader from './NexHeader.jsx'

const SLIDES = [
  {
    kicker: 'Maple Park · 8:05 AM',
    title: 'The notebook is gone',
    body: [
      'Maya\'s research notebook disappeared from the fair office between 8:05 and 8:30.',
      'Judging begins at 9:00 AM. Without her notes, her project cannot be scored.',
      'Mr. Rao has sealed the fair. IRI is waiting for you at the case map.',
    ],
  },
  {
    kicker: 'The people',
    title: 'Four accounts, one timeline',
    body: [
      'Maya — the notebook was on the office desk when she signed in at 8:05.',
      'Mr. Rao — he opened the office at 8:18 and locked it again at 8:30.',
      'Dev — Maya\'s lab partner, last seen near the printing booth.',
      'IRI — your investigation assistant. Every clue you recover goes into the case file.',
    ],
  },
  {
    kicker: 'The fair',
    title: 'Six stops. Six records.',
    body: [
      'Array Fair — Arrays. Linked List Roller Coaster — Singly, Doubly and Circular Linked Lists.',
      'Stack & Queue Arcade — Stacks and Queues. Tree Playground — Binary Trees.',
      'Graph Town — Graph Representations. DP Puzzle Park — Recursion and Dynamic Programming.',
    ],
  },
  {
    kicker: 'The assignment',
    title: 'Follow the records. Name the hand.',
    body: [
      'Start at Array Fair. Recover the first record.',
      'Each solved record unlocks the next fair stop.',
      'At DP Puzzle Park, rebuild the final timeline.',
      'Find Maya\'s notebook before 9:00 AM — and name who took it.',
    ],
    quick: 'Open the case map',
  },
]

export default function Intro() {
  const setView = useGame((s) => s.setView)
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1
  const total = SLIDES.length

  return (
    <div className="nex-root nex-intro-page" data-testid="intro">
      <NexHeader
        right={(
          <>
            <span className="nex-case-tag">Case file 001</span>
            <span className="nex-status">Maple Park · 08:05</span>
          </>
        )}
      />

      <main className="nex-intro-shell">
        <aside className="nex-intro-rail" aria-label="Investigation briefing">
          <p className="nx-kicker">Case file 001</p>
          <h2 className="nex-rail-title">Maple Park <span>Science Fair</span></h2>
          <p className="nex-rail-note">
            The notebook is missing. Six fair stops hold the records that will
            lead you to it before judging begins.
          </p>

          <ol className="nex-intro-steps">
            {SLIDES.map((step, i) => (
              <li
                key={step.title}
                className={`nex-intro-step${i === index ? ' is-active' : ''}${i < index ? ' is-done' : ''}`}
                aria-current={i === index ? 'step' : undefined}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>{step.kicker}</span>
              </li>
            ))}
          </ol>

          <div className="nex-rail-clock">
            Judging
            <strong>09:00</strong>
            <em>AM</em>
          </div>
        </aside>

        <section className="nex-intro-panel" key={index}>
          <div className="nex-intro-panel-top">
            <span className="nex-slide-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="nex-slide-total">/ {String(total).padStart(2, '0')}</span>
            <p className="nx-kicker">{slide.kicker}</p>
          </div>

          <h2 className="nex-intro-title">{slide.title}</h2>

          <div className="nex-intro-copy">
            {slide.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <nav className="nex-intro-nav" aria-label="Story step">
            <button
              className="nex-btn nex-ghost"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              ← Back
            </button>
            <span className="nex-intro-counter" aria-live="polite">
              {index + 1} / {total}
            </span>
            {last ? (
              <button
                className="nex-btn nex-primary lg"
                onClick={() => setView('map')}
              >
                {slide.quick || 'Open the case map'} →
              </button>
            ) : (
              <button
                className="nex-btn nex-primary lg"
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              >
                Next →
              </button>
            )}
            <div className="nex-intro-dots" aria-hidden="true">
              {SLIDES.map((step, i) => (
                <span
                  key={step.title}
                  className={`nex-intro-dot${i === index ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </nav>
        </section>
      </main>
    </div>
  )
}
