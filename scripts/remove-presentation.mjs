// Deletes src/presentations/<name>/ and everything in it.
// Usage: npm run remove -- <name>
import { existsSync, rmSync } from 'node:fs'
import { presentationFolder, readName } from './presentation-folder.mjs'

const name = readName('npm run remove -- my-talk')
const folder = presentationFolder(name)
if (!existsSync(folder)) {
  console.error(`There is no presentation called "${name}".`)
  process.exit(1)
}

rmSync(folder, { recursive: true })
console.log(`Removed ${folder}`)
