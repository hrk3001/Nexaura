import { useState } from 'react'

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
  },
]

export default function Intro() {
  const [_index, /* setIndex unused */] = useState(0)
  const slide = SLIDES[_index]

  return (
    <div className="nx-root nx-intro" data-testid="intro">
      <div className="nx-intro-vignette" aria-hidden="true" />

      <div className="nx-intro-panel" key={_index}>
        <p className="nx-kicker">{slide.kicker}</p>
        <h2 className="nx-intro-title">{slide.title}</h2>
        {slide.body.map((paragraph) => (
          <p key={paragraph} className="nx-intro-body">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}