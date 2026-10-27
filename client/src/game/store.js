import { create } from 'zustand'
import {
  getWorld,
  markWorldUnlocked,
  markWorldCompleted,
  isWorldUnlocked,
  isWorldCompleted,
  WORLD_ORDER,
} from './worlds.js'

// ---- accounts + saved progress (kept in this browser) ---------------------
const USERS_KEY = 'nexaura.users.v1'
const SESSION_KEY = 'nexaura.session.v1'
const saveKey = (userKey) => `nexaura.progress.v2.${userKey}`

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (_e) {
    return null
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (_e) {
    /* storage blocked: the game still works, it just will not be saved */
  }
}

function removeKey(key) {
  try {
    window.localStorage.removeItem(key)
  } catch (_e) {
    /* ignore */
  }
}

const readUsers = () => readJson(USERS_KEY) || {}

function snapshot(caseState) {
  return {
    xp: caseState.xp ?? 0,
    coins: caseState.coins ?? 0,
    closedRealms: caseState.closedRealms ?? 0,
    solved: caseState.solved ?? [],
    completed: WORLD_ORDER.filter((id) => isWorldCompleted(id)),
    unlocked: WORLD_ORDER.filter((id) => isWorldUnlocked(id)),
  }
}

// Worlds keep their locked / cleared flags in memory, so reset them first and
// then apply whatever this player has saved.
function applyWorldFlags(saved) {
  for (const id of WORLD_ORDER) {
    markWorldCompleted(id, false)
    markWorldUnlocked(id, false)
  }
  markWorldUnlocked('arrays', true)
  if (saved) {
    for (const id of saved.unlocked || []) markWorldUnlocked(id, true)
    for (const id of saved.completed || []) markWorldCompleted(id, true)
  }
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await window.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function newSalt() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function checkName(name) {
  const n = String(name || '').trim()
  if (n.length < 2 || n.length > 20) return 'Name must be 2 to 20 characters.'
  if (!/^[A-Za-z0-9 _-]+$/.test(n)) return 'Use letters, numbers, spaces, _ or - only.'
  return ''
}

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

  user: null,

  // Start a session for one player: new accounts get fresh progress, returning
  // accounts get their saved progress back.
  _startSession: (userKey, displayName) => {
    const saved = readJson(saveKey(userKey))
    applyWorldFlags(saved)
    writeJson(SESSION_KEY, userKey)
    set({
      view: 'landing',
      worldId: null,
      dialogue: null,
      user: { key: userKey, name: displayName },
      caseState: {
        ...INITIAL_CASE_STATE,
        currentWorld: 'arrays',
        currentChallenge: null,
        xp: saved?.xp ?? 0,
        coins: saved?.coins ?? 0,
        closedRealms: saved?.closedRealms ?? 0,
        solved: saved?.solved ?? [],
      },
    })
  },

  init: () => {
    const key = readJson(SESSION_KEY)
    const account = key ? readUsers()[key] : null
    if (account) {
      get()._startSession(key, account.name)
    } else {
      applyWorldFlags(null)
      set({ view: 'login', user: null, worldId: null, caseState: null })
    }
  },

  // Returns { ok: true } or { ok: false, error }.
  register: async (name, password) => {
    const problem = checkName(name)
    if (problem) return { ok: false, error: problem }
    if (String(password || '').length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' }
    }
    try {
      const key = String(name).trim().toLowerCase()
      const users = readUsers()
      if (users[key]) return { ok: false, error: 'That name is taken. Log in instead.' }
      const salt = newSalt()
      users[key] = {
        name: String(name).trim(),
        salt,
        hash: await hashPassword(password, salt),
        created: Date.now(),
      }
      writeJson(USERS_KEY, users)
      removeKey(saveKey(key)) // a new account always starts from the beginning
      get()._startSession(key, users[key].name)
      return { ok: true }
    } catch (_e) {
      return { ok: false, error: 'Could not create the account in this browser.' }
    }
  },

  login: async (name, password) => {
    try {
      const key = String(name || '').trim().toLowerCase()
      const account = readUsers()[key]
      if (!account) return { ok: false, error: 'No account with that name. Create one first.' }
      const hash = await hashPassword(String(password || ''), account.salt)
      if (hash !== account.hash) return { ok: false, error: 'Wrong password.' }
      get()._startSession(key, account.name)
      return { ok: true }
    } catch (_e) {
      return { ok: false, error: 'Could not log in on this browser.' }
    }
  },

  logout: () => {
    removeKey(SESSION_KEY)
    applyWorldFlags(null)
    set({ view: 'login', user: null, worldId: null, caseState: null, dialogue: null })
  },

  flush: () => {
    if (get().user) get().restart()
    else get().init()
  },

  // Wipe this player's progress and start over.
  restart: () => {
    const u = get().user
    if (!u) return
    removeKey(saveKey(u.key))
    get()._startSession(u.key, u.name)
  },

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
        savedChallenge: null,
        evidence: [],
        journal: [],
      },
    })
  },

  goMap: () => set({ view: 'map' }),

  goLanding: () => set({ view: 'landing' }),

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

  // Log a piece of evidence once; repeats are ignored.
  discoverEvidence: (entry) =>
    set((s) => {
      if (!entry) return s
      const cs = s.caseState ?? {}
      const found = cs.evidence ?? []
      if (found.some((e) => e.id === entry.id)) return s
      return {
        caseState: {
          ...cs,
          evidence: [...found, entry],
          journal: [
            ...(cs.journal ?? []),
            { id: entry.id, title: entry.title, clue: entry.clue },
          ],
        },
      }
    }),

  completeWorld: (worldId) => {
    const world = getWorld(worldId)
    if (!world || world._completed) return
    markWorldCompleted(worldId, true)
    if (world.nextWorld) {
      markWorldUnlocked(world.nextWorld, true)
    }
    set((s) => ({
      caseState: {
        ...s.caseState,
        closedRealms: (s.caseState?.closedRealms ?? 0) + 1,
        xp: (s.caseState?.xp ?? 0) + 150,
        coins: (s.caseState?.coins ?? 0) + 40,
      },
    }))
  },

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

// Save after every change to the case state, for the logged-in player only.
let lastSaved = null
useGame.subscribe((state) => {
  if (state.user && state.caseState && state.caseState !== lastSaved) {
    lastSaved = state.caseState
    writeJson(saveKey(state.user.key), snapshot(state.caseState))
  }
})
