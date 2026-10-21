import { useState } from 'react'
import { useGame } from '../game/store.js'

const SLIDES = [
  {
    kicker: 'Dispatch · Ninth Ward',
    title: 'The kingdom of computable truth',
    body: [
      'In Nexaura, memory is stored in order — a sequence of fragments, each one holding a single night.',
      'The Algorithm Heart reads those sequences and keeps the world consistent.',
      'Lately, the Heart has been fed a false order, and reality has started to agree with the lie.',
    ],
  },
  {
    kicker: 'The report',
    title: 'Memories have been altered',
    body: [
      'The Royal Archive reports that sealed records no longer match the index plate on the wall.',
      'Nox from the Lower Post was seen entering the Array Forest and never reached the far road.',
      'His last transmission repeats a sequence of fragment numbers over and over, until the crystal cracked.',
      'You are Rin the Detective. You are the only one the Heart still trusts with a true order.',
    ],
  },
  {
    kicker: 'The scene',
    title: 'The Forest of False Memories',
    body: [
      'An abandoned archive at the heart of the forest.',
      'Seven fragments burning in the dark.',
      'A cabinet with its seal broken from the inside.',
      'Two trails in the mud — and one set of prints that is missing entirely.',
      'The people standing around the scene have already decided what they saw. None of them agree.',
    ],
  },
  {
    kicker: 'The assignment',
    title: 'Rebuild the order. Then name the hand.',
    body: [
      'Collect every lead the scene will give you.',
      'Put the suspects\' accounts against the evidence until they break.',
      'Reconstruct the sealed order with a procedure that searches arrays properly.',
      'Then make the accusation — and defend it with the proof you gathered.',
    ],
    quick: 'open the case map',
  },
]

export default function Intro() {
  const setView = useGame((s) => s.setView)
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1
  const total = SLIDES.length

  return (
    <div className="nex-root nex-intro" data-testid="intro">
      <div className="nex-intro-canvas" aria-hidden="true" />

      <main className="nex-intro-main" style={{ '--accent': '#8b5cf6' }}>
        <div className="nex-intro-panel" key={index}>
          <p className="nx-kicker">{slide.kicker}</p>
          <h2 className="nx-intro-title">{slide.title}</h2>
          {slide.body.map((paragraph) => (
            <p key={paragraph} className="nx-intro-body">
              {paragraph}
            </p>
          ))}
        </div>

        <nav className="nx-intro-nav" aria-label="Story step">
          <button
            className="nex-btn nex-ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            ← Back
          </button>
          <span className="nx-intro-counter" aria-live="polite">
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
        </nav>
      </main>

      <style>{`
        .nex-intro .nx-kicker {
          color: var(--accent, #8b5cf6);
          letter-spacing: 3px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .nex-intro .nx-intro-title {
          font-family: 'MedievalSharp', cursive;
          font-size: clamp(26px, 5vw, 40px);
          margin: 0 0 22px;
          line-height: 1.2;
          color: #f4efff;
        }
        .nex-intro .nx-intro-body {
          color: #c4b5fd;
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }
        .nex-intro .nex-intro-nav {
          position: absolute;
          bottom: 28px;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .nex-intro .nx-intro-counter {
          font-size: 12px;
          letter-spacing: 1px;
          color: #6d6f9a;
          font-weight: 600;
        }
        .nex-intro .nex-btn.nex-ghost {
          background: transparent;
          border: 1px solid rgba(139, 92, 246, 0.5);
        }
        .nex-intro .nex-btn.nex-ghost:hover {
          background: rgba(139, 92, 246, 0.1);
        }
        @media (max-width: 600px) {
          .nex-intro .nx-intro-body { font-size: 13.5px; }
        }
      `}</style>
    </div>
  )
}
