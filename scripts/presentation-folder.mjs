import { fileURLToPath } from 'node:url'

const presentations = fileURLToPath(new URL('../src/presentations/', import.meta.url))

/** Reads the presentation name from the command line, which must be kebab-case. */
export function readName(usage) {
  const name = process.argv[2]
  if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.error(`Give the presentation a kebab-case name: ${usage}`)
    process.exit(1)
  }
  return name
}

export function presentationFolder(name) {
  return `${presentations}${name}`
}
