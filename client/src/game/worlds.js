// Six connected realms of the Algorithm Kingdom.
// One DSA concept per world. The client drives unlocked/completed state
// from the game store, not from these static flags, so a fresh install
// starts with Array Forest being the only available realm and unlocks
// the rest as challenges are solved.

const MODULES = {
  arrays: {
    id: 'arrays',
    name: 'Array Forest',
    prompt: 'The Ordered Grove',
    description:
      'Restoring forgotten indices in a grove where every crystal remembers its place. Theory: ordered sequences, linear traversal, two-pointer reasoning.',
    gradient: ['#10b981', '#34d399'],
    icon: '🌲',
    boss: 'The Great Tree',
    topic: 'array',
    nextWorld: 'linked',
    introSpots: [
      ['Computer Terminal', 'Start here — the archivist keeps the manual at the terminal.'],
      ['Research Notes', 'Notes on the quality of lantern-sight under scrutiny.'],
      ['Evidence Bag', 'A sealed bag. It quavers oddly, as if something inside is trying to escape.'],
    ],
  },
  linked: {
    id: 'linked',
    name: 'Linked List Valley',
    prompt: 'The Wanderer\'s Trail',
    description:
      'Following chained breadcrumbs through a valley of one-way passages. Theory: singly/doubly linked nodes, traversal and reversal.',
    gradient: ['#f5c453', '#eab308'],
    icon: '🌿',
    boss: 'The Wanderer',
    topic: 'linked-list',
    nextWorld: 'stack',
    introSpots: [
      ['Trail Markers', 'Together they should spell a coherent path. They do not.'],
      ['Broken Chain', 'A single link breaks the chain — and remembers where it was last anchored.'],
    ],
  },
  stack: {
    id: 'stack',
    name: 'Stack & Queue Realm',
    prompt: 'The Overflow Bell Tower',
    description:
      'Order matters at the top and the bottom of every pile. Theory: LIFO/FIFO, brackets and circular buffers.',
    gradient: ['#a78bfa', '#8b5cf6'],
    icon: '⚡',
    boss: 'The Archivist',
    topic: 'stack-queue',
    nextWorld: 'tree',
    introSpots: [
      ['Bell Tower', 'Mingers swing past each other. Only one order survives the fall.'],
      ['Archive Chest', 'Tokens of power — brackets — sit waiting to be matched.'],
    ],
  },
  tree: {
    id: 'tree',
    name: 'Tree Kingdom',
    prompt: 'The Branching Court',
    description:
      'Lineage, hierarchy and the shape of a search. Theory: inorder/height, BST search and the lowest common ancestor.',
    gradient: ['#f87171', '#fca5a5'],
    icon: '👑',
    boss: 'The Crown',
    topic: 'tree',
    nextWorld: 'graph',
    introSpots: [
      ['Ancestor Hall', 'Two courtiers remember a shared ancestor. You need the lowest one.'],
      ['Throne Room', 'The key rests at the right depth of the court.'],
    ],
  },
  graph: {
    id: 'graph',
    name: 'Graph City',
    prompt: 'The Interlocked Mills',
    description:
      'A city of paths, neighbours and hidden circuits. Theory: BFS, connected components and cycle detection.',
    gradient: ['#ec4899', '#db2777'],
    icon: '🏙️',
    boss: 'The Connector',
    topic: 'graph',
    nextWorld: 'dp',
    introSpots: [
      ['North Mill', 'Water runs to every reachable mill. Witnesses disagree on which mills it reaches.'],
      ['Water Map', 'Pin the circuits that loop back on themselves.'],
    ],
  },
  dp: {
    id: 'dp',
    name: 'Dynamic Programming Citadel',
    prompt: 'The Memoisation Archive',
    description:
      'Saving the answers of small problems to solve the big ones. Theory: recursion with memoization, the coin change and longest increasing subsequence.',
    gradient: ['#14b8a6', '#06b6d4'],
    icon: '🗼',
    boss: 'The Oracle',
    topic: 'dynamic-programming',
    nextWorld: null,
    introSpots: [
      ['Coin Shelf', 'Every small sum is already recorded somewhere on the shelf.'],
      ['Sequence Scroll', 'The longest unbroken winter in the run of years.'],
    ],
  },
}

const worlds = {}
const order = []
for (const id of Object.keys(MODULES)) {
  const w = MODULES[id]
  worlds[id] = {
    id: w.id,
    name: w.name,
    prompt: w.prompt,
    description: w.description,
    gradient: w.gradient,
    icon: w.icon,
    boss: w.boss,
    topic: w.topic,
    nextWorld: w.nextWorld,
    introSpots: w.introSpots,
  }
  order.push(id)
}

export const WORLD_ORDER = order
export default worlds

export function getWorld(worldId) {
  return worlds[worldId] || null
}

export function getAllWorlds() {
  return worlds
}

export function isWorldUnlocked(worldId) {
  const w = worlds[worldId]
  return w ? w._unlocked === true : false
}

export function isWorldCompleted(worldId) {
  const w = worlds[worldId]
  return w ? w._completed === true : false
}

export function markWorldUnlocked(worldId, flag = true) {
  const w = worlds[worldId]
  if (w) w._unlocked = flag
}

export function markWorldCompleted(worldId, flag = true) {
  const w = worlds[worldId]
  if (w) w._completed = flag
}

export function unlockedWorldIds() {
  return order.filter((id) => worlds[id]._unlocked !== false)
}

export function getFirstUnlockedWorldId() {
  for (const id of order) {
    if (worlds[id]._unlocked !== false) return id
  }
  return null
}

// Seed the very first realm so a fresh install is playable.
markWorldUnlocked('arrays')
