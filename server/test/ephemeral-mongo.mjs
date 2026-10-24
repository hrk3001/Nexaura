// Dev helper: keeps an in-memory MongoDB alive and writes its URI to /tmp/mongouri.txt
// Usage: node test/ephemeral-mongo.mjs   (kill the process when done)
import { MongoMemoryServer } from 'mongodb-memory-server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const mongod = await MongoMemoryServer.create()
const uri = mongod.getUri('nexaura')
const uriFile = path.join(os.tmpdir(), 'mongouri.txt')
fs.writeFileSync(uriFile, uri)
console.log('ephemeral MongoDB at', uri)
console.log('URI file:', uriFile)
setInterval(() => {}, 1 << 30) // stay alive
