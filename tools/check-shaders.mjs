// A backtick inside a GLSL comment closes the template literal the shader lives
// in, and the parse error lands wherever the file happens to stop making sense —
// which is usually somewhere else entirely. It has cost two debugging rounds, so
// it is a check now rather than a thing to remember.
//
//   npm run check:shaders
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const SRC = 'src'
let bad = 0
for (const name of await readdir(SRC)) {
  if (!/\.(js|jsx)$/.test(name)) continue
  const text = await readFile(join(SRC, name), 'utf8')
  const lines = text.split('\n')
  let inShader = false
  lines.forEach((line, i) => {
    const opens = /\/\* glsl \*\/\s*`/.test(line)
    if (opens) inShader = true
    else if (inShader && /^\s*`/.test(line)) inShader = false
    else if (inShader && line.includes('`')) {
      console.error(`${name}:${i + 1}  backtick inside a GLSL block:\n    ${line.trim()}`)
      bad++
    }
  })
}
console.log(bad ? `${bad} stray backtick(s)` : 'no stray backticks in any GLSL block')
process.exit(bad ? 1 : 0)
