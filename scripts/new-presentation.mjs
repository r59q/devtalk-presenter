// Creates src/presentations/<name>/index.ts from a starter script.
// Usage: npm run new -- <name>
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { presentationFolder, readName } from './presentation-folder.mjs'

const name = readName('npm run new -- my-talk')
const folder = presentationFolder(name)
if (existsSync(folder)) {
  console.error(`The presentation "${name}" already exists.`)
  process.exit(1)
}

const title = name
  .split('-')
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join(' ')

const script = `import { fadeIn, morph, palette, popIn, presentation, slide, text } from '../../authoring.ts'

export default presentation('${title}', [
  slide('Title', ({ add, enter, notes }) => {
    const heading = add(text('${title}', { size: 120, weight: 800 }))
    enter(popIn(heading))
    notes('Press S to open the speaker view, which shows these notes.')
  }),

  slide('Next', ({ add, enter, step }) => {
    const idea = add(text('An idea', { size: 96, weight: 700, color: palette.blue }))
    enter(fadeIn(idea))
    step(morph(idea, text('A talk', { size: 96, weight: 700, color: palette.green })))
  }),
])
`

mkdirSync(folder, { recursive: true })
writeFileSync(`${folder}/index.ts`, script)
console.log(`Created ${folder}/index.ts. Run npm run dev and open #/${name}`)
