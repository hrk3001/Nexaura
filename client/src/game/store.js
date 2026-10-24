import { create } from 'zustand'
import {
  getWorld,
  markWorldUnlocked,
  markWorldCompleted,
} from './worlds.js'

const INITIAL_CASE_STATE = {
  currentWorld: null,
  currentChallenge: null,
  leads: {},
  leadsFound: 0,
  leadsTotal: 0,
  xp: 0,
  coins: 0,
  closedRealms: 0,
  closedRealmsTotal: 6,
  solved: [],
  evidence: [],
  journal: [],
}

const useGame = create((set, get) => ({
  view: 'loading',
  worldId: null,
  caseState: null,
  dialogue: null,

  init: () => {
    set({
      view: 'landing',
      worldId: null,
      caseState: {
        ...INITIAL_CASE_STATE,
        currentWorld: 'arrays',
        currentChallenge: null,
      },
    })
  },

  flush: () =>
    set({
      view: 'landing',
      worldId: null,
      caseState: {
        ...INITIAL_CASE_STATE,
        currentWorld: 'arrays',
        currentChallenge: null,
      },
      dialogue: null,
    }),

  setView: (view) => set({ view }),

  setCaseState: (next) =>
    set((s) => ({
      caseState: typeof next === 'function'
        ? next(s.caseState)
        : next,
    })),

  selectWorld: (worldId) => {
    const world = getWorld(worldId)
    if (!world) return
    if (!world._unlocked) return
    set({
      view: 'game',
      worldId,
      caseState: {
        currentWorld: worldId,
        currentChallenge: null,
        leads: {},
        leadsFound: 0,
        leadsTotal: world.introSpots.length,
        xp: get().caseState?.xp ?? 0,
        coins: get().caseState?.coins ?? 0,
        closedRealms: get().caseState?.closedRealms ?? 0,
        closedRealmsTotal: 6,
        solved: get().caseState?.solved ?? [],
        evidence: get().caseState?.evidence ?? [],
        journal: get().caseState?.journal ?? [],
        savedChallenge: null,
      },
    })
  },

  goMap: () => set({ view: 'map' }),

  openDialogue: (lines) =>
    set({
      dialogue: { lines: Array.isArray(lines) ? lines : [lines], index: 0 },
    }),

  closeDialogue: () => set({ dialogue: null }),

  advanceDialogue: () => {
    const d = get().dialogue
    if (!d) return true
    const next = d.index + 1
    if (next >= d.lines.length) {
      set({ dialogue: null })
      return true
    }
    set({ dialogue: { ...d, index: next } })
    return false
  },

  completeWorld: (worldId) => {
    const world = getWorld(worldId)
    if (!world || world._completed) return
    markWorldCompleted(worldId, true)
    set((s) => ({
      caseState: {
        ...s.caseState,
        closedRealms: (s.caseState?.closedRealms ?? 0) + 1,
        xp: (s.caseState?.xp ?? 0) + 150,
        coins: (s.caseState?.coins ?? 0) + 40,
      },
    }))
    if (world.nextWorld) {
      markWorldUnlocked(world.nextWorld, true)
    }
  },

  discoverEvidence: (entry) =>
    set((s) => {
      if (!entry?.id) return s
      const found = s.caseState?.evidence ?? []
      if (found.includes(entry.id)) return s
      return {
        caseState: {
          ...s.caseState,
          evidence: [...found, entry.id],
          journal: [
            ...(s.caseState?.journal ?? []),
            { id: entry.id, title: entry.title, clue: entry.clue, worldId: s.worldId },
          ],
        },
      }
    }),

  recordChallenge: (challengeId) =>
    set((s) => {
      const seen = s.caseState?.solved ?? []
      if (seen.includes(challengeId)) return s
      return {
        caseState: {
          ...s.caseState,
          solved: [...seen, challengeId],
        },
      }
    }),

  progress: () => {
    const cs = get().caseState ?? INITIAL_CASE_STATE
    const closed = cs.closedRealms ?? 0
    const total = cs.closedRealmsTotal ?? 6
    return { closed, total }
  },
}))

export { useGame }
export const playerRef = null
