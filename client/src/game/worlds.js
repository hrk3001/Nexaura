// World definitions for the six connected realms
// Each world represents a DSA data structure concept

const worlds = {
  arrays: {
    id: 'arrays',
    name: 'Array Forest',
    description: 'The realm of ordered sequences and indexed access',
    gradient: ['#10b981', '#34d399'],
    icon: '🌲',
    boss: 'The Great Tree',
    unlocked: true,    // Unlocked after completing the investigation
    completed: true,   // Mark as completed for progression
  },
  linked: {
    id: 'linked',
    name: 'Linked List Valley',
    description: 'The realm of chained connections and dynamic traversal',
    gradient: ['#f5c453', '#eab308'],
    icon: '🌿',
    boss: 'The Wanderer',
    unlocked: true,    // Unlocked after Array Forest completion
    completed: false,  // Not yet completed
  },
  stack: {
    id: 'stack',
    name: 'Stack & Queue Realm',
    description: 'The realm of LIFO/FIFO operations and overflow',
    gradient: ['#a78bfa', '#8b5cf6'],
    icon: '⚡',
    boss: 'The Archivist',
    unlocked: false,
    completed: false,
  },
  tree: {
    id: 'tree',
    name: 'Tree Kingdom',
    description: 'The realm of hierarchical structures and branching',
    gradient: ['#f87171', '#fca5a5'],
    icon: '👑',
    boss: 'The Crown',
    unlocked: false,
    completed: false,
  },
  graph: {
    id: 'graph',
    name: 'Graph City',
    description: 'The realm of nodes, edges, and interconnected paths',
    gradient: ['#ec4899', '#db2777'],
    icon: '🏙️',
    boss: 'The Connector',
    unlocked: false,
    completed: false,
  },
  dp: {
    id: 'dp',
    name: 'Dynamic Programming Citadel',
    description: 'The realm of optimization and memoized solutions',
    gradient: ['#14b8a6', '#06b6d4'],
    icon: '🗼',
    boss: 'The Oracle',
    unlocked: false,
    completed: false,
  },
}

// Get a world by ID
export function getWorld(worldId) {
  return worlds[worldId] || null
}

// Get all worlds
export function getAllWorlds() {
  return worlds
}

// Check if a world is unlocked
export function isWorldUnlocked(worldId) {
  const w = worlds[worldId]
  return w ? w.unlocked : false
}

// Check if a world is completed
export function isWorldCompleted(worldId) {
  const w = worlds[worldId]
  return w ? w.completed : false
}

// Get unlocked worlds in order
export function getUnlockedWorlds() {
  return Object.values(worlds).filter(w => w.unlocked)
}

// Get completed worlds in order
export function getCompletedWorlds() {
  return Object.values(worlds).filter(w => w.completed)
}

export default worlds