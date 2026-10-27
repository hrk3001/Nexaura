// Six fair stops of the Maple Park Science Fair.
// Case: The Missing Notebook. Maya's notebook vanished from the fair office
// before judging at 9:00 AM. Each stop holds one record that moves the
// investigation forward. IDs and topics stay stable so the existing Java
// challenge decks keep working.

export const CASE = {
  id: 'missing-notebook',
  title: 'The Missing Notebook',
  location: 'Maple Park Science Fair',
  deadline: '9:00 AM',
  detective: 'IRI',
  owner: 'Maya',
  organiser: 'Mr. Rao',
  partner: 'Dev',
}

const MODULES = {
  arrays: {
    id: 'arrays',
    name: 'Array Fair',
    subject: 'Arrays',
    prompt: 'The sign-in sheet',
    description:
      'Maya signed in at 8:05. The fair\'s entry sheet is an ordered list — but one row repeats, and one timestamp does not belong.',
    objective: 'Recover the duplicate entry from the sign-in sheet.',
    clue: 'A second 8:20 sign-in under Maya\'s name was written by a different hand.',
    gradient: ['#10b981', '#34d399'],
    icon: '🎪',
    topic: 'array',
    nextWorld: 'linked',
    introSpots: [
      ['Sign-in Sheet', 'Maya signed in at 8:05. A second entry at 8:20 repeats her badge number.'],
      ['Project Table 7', 'Maya\'s display board is intact. The notebook that should sit beside it is gone.'],
      ['Torn Page', 'A page of sample readings caught under the table. The corner matches Maya\'s notebook.'],
    ],
    evidence: [
      {
        id: 'array-signin',
        title: 'Sign-in sheet',
        object: 'record',
        position: [0.2, 0.12, 4],
        location: 'Array Fair · front table',
        detail:
          "Maya's 8:05 row is intact. A second row at 8:20 repeats badge 017, but the loops in the name are drawn in a different hand.",
        clue:
          'The 8:20 sign-in was forged — someone used Maya\'s badge after she had already entered the fair.',
      },
      {
        id: 'array-terminal',
        title: 'Fair office terminal',
        object: 'laptop',
        position: [3.2, 0.3, 1],
        location: 'Array Fair · door-log link',
        detail:
          "The office door log shows Mr. Rao's master card at 8:18 and no exit event. The arcade override ticket was never cashed out.",
        clue:
          'Mr. Rao opened the office at 8:18 — and the door never logged an exit.',
      },
      {
        id: 'array-page',
        title: 'Torn page',
        object: 'crystal',
        position: [1, 0.6, 2],
        location: 'Array Fair · under Project Table 7',
        detail:
          "A sample-readings page caught under the table. The torn corner matches the binding of Maya's notebook, and the ink carries printing-booth toner.",
        clue:
          'A page of Maya\'s notebook was under Table 7 — the notebook left the office before 8:30.',
      },
    ],
  },
  linked: {
    id: 'linked',
    name: 'Linked List Roller Coaster',
    subject: 'Singly, Doubly and Circular Linked Lists',
    prompt: 'The ride queue',
    description:
      'The coaster\'s queue is a chain of wristbands. One link is missing, and the ride log points toward the maintenance corridor.',
    objective: 'Trace the missing wristband through the ride queue.',
    clue: 'Wristband A17 disappears between 8:12 and 8:24 — the same window as the office door.',
    gradient: ['#f5c453', '#eab308'],
    icon: '🎢',
    topic: 'linked-list',
    nextWorld: 'stack',
    introSpots: [
      ['Ride Queue Log', 'Wristband A17 is missing from the chain between 8:12 and 8:24.'],
      ['Lost & Found', 'A volunteer lanyard with a broken clip. The chain pattern matches the office key ring.'],
      ['Maintenance Door', 'The corridor behind the coaster leads to the printing booth.'],
    ],
  },
  stack: {
    id: 'stack',
    name: 'Stack & Queue Arcade',
    subject: 'Stacks and Queues',
    prompt: 'The prize counter',
    description:
      'The arcade runs on strict order: tickets are stacked, prizes are queued. At 8:18, a staff override jumped both lines.',
    objective: 'Find the staff override ticket that opened the fair office.',
    clue: 'Mr. Rao\'s master card opened the office at 8:18 — but the override ticket was never cashed out.',
    gradient: ['#a78bfa', '#8b5cf6'],
    icon: '🕹️',
    topic: 'stack-queue',
    nextWorld: 'tree',
    introSpots: [
      ['Prize Counter', 'The ticket stack is out of order: a staff override sits on top, timestamped 8:18.'],
      ['Office Door Log', 'One entry at 8:18, keyed by Mr. Rao\'s master card. No exit was logged.'],
      ['Queue Screen', 'The arcade queue skipped from position 4 to 6 while the office door was open.'],
    ],
  },
  tree: {
    id: 'tree',
    name: 'Tree Playground',
    subject: 'Binary Trees',
    prompt: 'The staff tree',
    description:
      'The fair staff is a tree: Mr. Rao at the root, volunteers on the branches. Dev\'s badge hangs from the printing booth — not the office.',
    objective: 'Map the staff tree and find who could reach the office key.',
    clue: 'Dev\'s volunteer badge is assigned to the printing booth branch, directly below Mr. Rao.',
    gradient: ['#f87171', '#fca5a5'],
    icon: '🌳',
    topic: 'tree',
    nextWorld: 'graph',
    introSpots: [
      ['Staff Tree', 'Mr. Rao is root. Dev\'s badge hangs from the printing booth branch, not the office.'],
      ['Clue Board', 'A child\'s drawing of the playground tree has an X under the printing booth.'],
      ['Key Cabinet', 'Only Mr. Rao\'s branch holds a master key. One key is missing from the hook.'],
    ],
  },
  graph: {
    id: 'graph',
    name: 'Graph Town',
    subject: 'Graph Representations',
    prompt: 'The fair map',
    description:
      'The fair is a graph of paths between stops. The shortest route from the office to the judging stage runs through the printing booth.',
    objective: 'Follow the route the notebook took through the fair.',
    clue: 'A handcart carrying a box marked "MAYA — DO NOT MOVE" used the printing-booth route at 8:26.',
    gradient: ['#ec4899', '#db2777'],
    icon: '🏙️',
    topic: 'graph',
    nextWorld: 'dp',
    introSpots: [
      ['Path Map', 'The shortest office-to-stage route passes the printing booth, not the main gate.'],
      ['Cart Route', 'A handcart was logged on that route at 8:26 with a box labelled for Maya.'],
      ['Stage Door', 'The judges\' table was set up at 8:40. A notebook-sized parcel was placed there.'],
    ],
  },
  dp: {
    id: 'dp',
    name: 'DP Puzzle Park',
    subject: 'Recursion and Dynamic Programming',
    prompt: 'The final timeline',
    description:
      'Every record is a smaller piece of the same timeline. Reconstruct the sequence from 8:05 to 9:00 and the case closes itself.',
    objective: 'Rebuild the timeline and name who took the notebook.',
    clue: 'The notebook left the office at 8:18, waited at the printing booth, and reached the judges\' table at 8:40. Dev\'s handwriting is on the last page.',
    gradient: ['#14b8a6', '#06b6d4'],
    icon: '🧩',
    topic: 'dynamic-programming',
    nextWorld: null,
    introSpots: [
      ['Timeline Puzzle', 'The sequence fits: office 8:18, printing booth 8:26, judges\' table 8:40.'],
      ['Judges\' Table', 'Maya\'s notebook is safe here. The last page carries Dev\'s handwriting: "I only needed the formula."'],
      ['Final Report', 'Dev took the notebook to copy Maya\'s formula. Mr. Rao moved it to the judges\' table. Case closed at 8:55.'],
    ],
  },
}

// Walkable clues and the story beat shown after a stop is cleared.
// Positions are [x, y, z] in the 3D scene (spawn is near x -2, z 8).
// objects: record | laptop | crystal | ring | cube
const EXTRA = {
  arrays: {
    successLine:
      'The duplicate 8:20 entry is exposed. Someone forged Maya\'s badge, and the trail now leads to the ride queue.',
  },
  linked: {
    successLine:
      'Wristband A17 is found at the broken link. The chain leads from the coaster to the maintenance corridor behind it.',
    evidence: [
      {
        id: 'linked-queue',
        title: 'Ride queue log',
        object: 'record',
        position: [-4, 0.12, 3.2],
        location: 'Linked List Roller Coaster · queue gate',
        detail: 'Every wristband points to the next one. Wristband A17 is missing from the chain between 8:12 and 8:24.',
        clue: 'The chain breaks at A17 — the same window the office door stood open.',
      },
      {
        id: 'linked-lanyard',
        title: 'Lost & found',
        object: 'ring',
        position: [3.5, 0.5, 1.2],
        location: 'Linked List Roller Coaster · lost & found',
        detail: 'A volunteer lanyard with a broken clip. The chain pattern matches the office key ring.',
        clue: 'A clip from the office key ring was dropped beside the coaster.',
      },
      {
        id: 'linked-door',
        title: 'Maintenance door',
        object: 'cube',
        position: [9, 0.5, 3],
        location: 'Linked List Roller Coaster · behind the ride',
        detail: 'The corridor behind the coaster leads straight to the printing booth.',
        clue: 'Whoever took the wristband used the corridor to reach the printing booth.',
      },
    ],
  },
  stack: {
    successLine:
      'The override ticket is on top of the stack, stamped 8:18. Mr. Rao\'s card opened the office, and nothing was ever cashed out.',
    evidence: [
      {
        id: 'stack-prizes',
        title: 'Prize counter',
        object: 'record',
        position: [-4, 0.12, 3],
        location: 'Stack & Queue Arcade · prize counter',
        detail: 'The ticket stack is out of order: a staff override sits on top, timestamped 8:18.',
        clue: 'The last ticket pushed was a staff override — it is the first one out.',
      },
      {
        id: 'stack-doorlog',
        title: 'Office door log',
        object: 'laptop',
        position: [3.5, 0.3, 1.5],
        location: 'Stack & Queue Arcade · door-log terminal',
        detail: "One entry at 8:18, keyed by Mr. Rao's master card. No exit was logged.",
        clue: 'The office was opened at 8:18 and nobody was recorded leaving.',
      },
      {
        id: 'stack-queue',
        title: 'Queue screen',
        object: 'crystal',
        position: [9, 0.6, 3.5],
        location: 'Stack & Queue Arcade · queue screen',
        detail: 'The arcade queue skipped from position 4 to 6 while the office door was open.',
        clue: 'Someone jumped the queue at the exact moment the office was open.',
      },
    ],
  },
  tree: {
    successLine:
      "The staff tree is mapped. Dev's badge hangs under the printing booth, one branch below Mr. Rao, so only those two could reach the key.",
    evidence: [
      {
        id: 'tree-staff',
        title: 'Staff tree',
        object: 'crystal',
        position: [-1.5, 0.6, 2.5],
        location: 'Tree Playground · play frame',
        detail: "Mr. Rao is the root. Dev's badge hangs from the printing booth branch, not the office.",
        clue: "Dev works under the printing booth, directly below Mr. Rao.",
      },
      {
        id: 'tree-board',
        title: 'Clue board',
        object: 'record',
        position: [4.5, 0.12, 4],
        location: 'Tree Playground · sandpit',
        detail: "A child's drawing of the playground tree has an X under the printing booth.",
        clue: 'A drawing marks the printing booth as the place to look.',
      },
      {
        id: 'tree-keys',
        title: 'Key cabinet',
        object: 'ring',
        position: [-8, 0.5, 0.5],
        location: 'Tree Playground · key cabinet',
        detail: "Only Mr. Rao's branch holds a master key. One key is missing from the hook.",
        clue: 'One master key is missing from the only branch that holds them.',
      },
    ],
  },
  graph: {
    successLine:
      'The fair map gives the shortest route: office, printing booth, judges\' stage. A handcart took the notebook that way at 8:26.',
    evidence: [
      {
        id: 'graph-map',
        title: 'Path map',
        object: 'record',
        position: [-5, 0.12, 3.5],
        location: 'Graph Town · town map',
        detail: 'The shortest office-to-stage route passes the printing booth, not the main gate.',
        clue: 'The quickest way from the office to the stage runs through the printing booth.',
      },
      {
        id: 'graph-cart',
        title: 'Cart route',
        object: 'cube',
        position: [1.5, 0.5, 1],
        location: 'Graph Town · booth road',
        detail: 'A handcart was logged on that route at 8:26 with a box labelled for Maya.',
        clue: 'A box marked "MAYA — DO NOT MOVE" went down that road at 8:26.',
      },
      {
        id: 'graph-stage',
        title: 'Stage door',
        object: 'crystal',
        position: [8.5, 0.6, 3],
        location: 'Graph Town · stage door',
        detail: "The judges' table was set up at 8:40. A notebook-sized parcel was placed there.",
        clue: "A notebook-sized parcel reached the judges' table at 8:40.",
      },
    ],
  },
  dp: {
    successLine:
      "The timeline fits together piece by piece: office 8:18, printing booth 8:26, judges' table 8:40. Case closed at 8:55.",
    evidence: [
      {
        id: 'dp-timeline',
        title: 'Timeline puzzle',
        object: 'record',
        position: [-4.5, 0.12, 3.5],
        location: 'DP Puzzle Park · puzzle board',
        detail: "The sequence fits: office 8:18, printing booth 8:26, judges' table 8:40.",
        clue: 'Every earlier clue is one step of the same timeline.',
      },
      {
        id: 'dp-table',
        title: "Judges' table",
        object: 'crystal',
        position: [3, 0.6, 1.5],
        location: "DP Puzzle Park · judges' table",
        detail: "Maya's notebook is safe here. The last page carries Dev's handwriting: \"I only needed the formula.\"",
        clue: 'The notebook is safe, and the last page is in Dev\'s handwriting.',
      },
      {
        id: 'dp-report',
        title: 'Final report',
        object: 'laptop',
        position: [8.5, 0.3, 3.5],
        location: 'DP Puzzle Park · report desk',
        detail: "Dev took the notebook to copy Maya's formula. Mr. Rao moved it to the judges' table. Case closed at 8:55.",
        clue: "Dev borrowed it to copy the formula; Mr. Rao moved it. Nobody meant to steal it.",
      },
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
    subject: w.subject,
    prompt: w.prompt,
    description: w.description,
    objective: w.objective,
    clue: w.clue,
    gradient: w.gradient,
    icon: w.icon,
    topic: w.topic,
    nextWorld: w.nextWorld,
    introSpots: w.introSpots,
    evidence: w.evidence || (EXTRA[id] && EXTRA[id].evidence) || [],
    successLine: (EXTRA[id] && EXTRA[id].successLine) || '',
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

// Seed the very first fair stop so a fresh install is playable.
markWorldUnlocked('arrays')
