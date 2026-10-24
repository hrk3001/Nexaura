import { useGame } from '../game/store.js'
import { CASE, getAllWorlds } from '../game/worlds.js'
import NexHeader from './NexHeader.jsx'

const PEOPLE = [
  { name: CASE.detective, role: 'Investigation assistant', initial: 'IRI' },
  { name: CASE.owner, role: 'Notebook owner', initial: 'M' },
  { name: CASE.organiser, role: 'Fair organiser', initial: 'R' },
  { name: CASE.partner, role: 'Lab partner', initial: 'D' },
]

export default function WorldMap() {
  const selectWorld = useGame((s) => s.selectWorld)
  const worlds = Object.values(getAllWorlds())
  const cleared = worlds.filter((world) => world._completed === true).length
  const open = worlds.filter((world) => world._unlocked && !world._completed).length

  return (
    <div className="nex-root nex-map-page" data-testid="map">
      <NexHeader
        right={(
          <>
            <span className="nex-case-tag">Case file 001</span>
            <span className="nex-status">
              <span className="nex-status-dot" aria-hidden="true" />
              Investigation active
            </span>
          </>
        )}
      />

      <main className="nex-map-shell">
        <header className="nex-map-head">
          <div>
            <p className="nx-kicker">Nexaura / Case file 001</p>
            <h1 className="nex-map-title">Case Map</h1>
            <p className="nex-map-subtitle">
              {CASE.location}
              <span>·</span>
              Judging at {CASE.deadline}
            </p>
            <p className="nex-map-brief">
              {CASE.owner}'s notebook vanished from the fair office. Six stops hold the
              records that will lead you to it — and to the person who took it.
            </p>
          </div>

          <aside className="nex-map-progress-card" aria-label="Case progress">
            <div className="nex-progress-head">
              <span>Case progress</span>
              <strong>{cleared} / {worlds.length}</strong>
            </div>
            <div className="nex-progress-track" aria-hidden="true">
              {worlds.map((world, i) => (
                <span
                  key={world.id}
                  className={`nex-progress-seg${i < cleared ? ' is-on' : ''}`}
                />
              ))}
            </div>
            <p className="nex-progress-note">
              {cleared === worlds.length
                ? 'All six fair stops cleared. The timeline is complete.'
                : open > 0
                  ? `${open} stop${open === 1 ? '' : 's'} open · ${worlds.length - cleared} record${worlds.length - cleared === 1 ? '' : 's'} remaining`
                  : 'Open the next fair stop to continue the investigation.'}
            </p>
          </aside>
        </header>

        <section className="nex-people" aria-label="People on the case">
          {PEOPLE.map((person) => (
            <article className="nex-person" key={person.name}>
              <span className="nex-person-avatar" aria-hidden="true">{person.initial}</span>
              <div>
                <div className="nex-person-name">{person.name}</div>
                <div className="nex-person-role">{person.role}</div>
              </div>
            </article>
          ))}
        </section>

        <section className="nex-map-grid" aria-label="Fair stops">
          {worlds.map((world, index) => {
            const locked = !world._unlocked
            const isCleared = world._completed === true

            return (
              <button
                key={world.id}
                type="button"
                disabled={locked}
                onClick={() => selectWorld(world.id)}
                className={`nex-map-card${locked ? ' is-locked' : ''}${isCleared ? ' is-cleared' : ''}`}
                style={{ '--card-index': index }}
              >
                <div className="nex-map-card-top">
                  <span className="nex-map-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="nex-map-icon" aria-hidden="true">{world.icon || '✦'}</span>
                  <span className={`nex-map-status${isCleared ? ' is-cleared' : locked ? ' is-locked' : ''}`}>
                    {locked ? 'SEALED' : isCleared ? 'CLEARED' : 'OPEN'}
                  </span>
                </div>

                <h2 className="nex-map-card-title">{world.name}</h2>
                <p className="nex-map-subject">{world.subject}</p>
                <p className="nex-map-description">{world.description}</p>

                <div className="nex-map-records">
                  <strong>Records</strong>
                  {world.introSpots.map(([label]) => label).join(' · ')}
                </div>

                <p className={`nex-map-note${locked ? ' is-locked' : isCleared ? ' is-lead' : ''}`}>
                  {locked
                    ? 'Clear the previous fair stop to unlock'
                    : isCleared
                      ? `LEAD LOGGED: ${world.clue}`
                      : `YOUR TASK: ${world.objective}`}
                </p>
              </button>
            )
          })}
        </section>

        <footer className="nex-map-footer">
          <span>Evidence board · six fair stops</span>
          <span>Case 001 · {CASE.location}</span>
          <span>{CASE.detective} · investigation assistant</span>
        </footer>
      </main>
    </div>
  )
}
