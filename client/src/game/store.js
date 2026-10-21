
import { create } from 'zustand'
import { getWorld, isWorldUnlocked } from './worlds.js'

const useGame = create((set, get) => ({
  view: 'loading',
  worldId: null,
  caseState: null,
  dialogue: null,
  advanceDialogue: () => {},
  playerRef: null,
  unlockedWorlds: [],

  init: () => {
    set({ view: 'landing' })
  },

  flush: () => {
    set({
      view: 'loading',
      worldId: null,
      caseState: null,
      dialogue: null,
      unlockedWorlds: [],
    })
  },

  setView: (view) => set({ view }),

  setCaseState: (caseState) => set({ caseState }),

  selectWorld: (worldId) => {
    const world = getWorld(worldId)

    if (!world || !isWorldUnlocked(worldId)) return

    set({
      view: 'game',
      worldId,
      caseState: {
        currentChallenge: null,
        cluesFound: 0,
        currentWorld: worldId,
      },
    })
  },

  goMap: () => set({ view: 'map' }),

  goLanding: () => set({ view: 'landing' }),

  __debug: {
    setView: (view) => set({ view }),
    getState: () => get(),
  },
}))

export { useGame }
export const playerRef = null
