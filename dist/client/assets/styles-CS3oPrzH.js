var e=`import { HAIR_STYLE_LOADERS, HAIR_STYLE_MODULES, PART_MANIFEST } from '#discover'

import type { Preset } from '../../part'
import type { HairDrawing } from '../drawing'
import * as defaultModule from './wavy'

/** The Figma reference hair: the spec default, listed first. Its module ships with the editor, so the default look never waits on art. */
export const DEFAULT_HAIR_STYLE = 'wavy'

/** The style a module in this directory exports, or null for a helper module that exports none, such as \`wavy-layers.ts\`. */
export function drawingOf(file: string, module: Readonly<Record<string, unknown>>): HairDrawing | null {
  const drawings = Object.values(module).filter((value): value is HairDrawing => typeof value === 'object' && value !== null && 'id' in value && 'front' in value)
  if (drawings.length === 0) return null
  if (drawings.length > 1 || drawings[0]!.id !== file) throw new Error(\`src/parts/hair/styles/\${file}.ts must export one HairDrawing with id '\${file}'\`)
  return drawings[0]!
}

const defaultFirst = (a: string, b: string) => Number(b === DEFAULT_HAIR_STYLE) - Number(a === DEFAULT_HAIR_STYLE) || (a < b ? -1 : 1)

/**
 * Hairstyles keyed by id: every \`<id>.ts\` in this directory that exports a
 * drawing, the default first and the rest by id. Add a style by adding its
 * module. Nothing lists the styles, so styles added in parallel never edit the
 * same file. In the browser only loaded styles are here: \`loadHairStyle\` adds
 * the rest. Everywhere else every style is.
 */
export const HAIR_STYLES: Record<string, HairDrawing> = Object.fromEntries(
  Object.entries({ ...HAIR_STYLE_MODULES, [DEFAULT_HAIR_STYLE]: defaultModule })
    .sort(([a], [b]) => defaultFirst(a, b))
    .flatMap(([file, module]) => {
      const drawing = drawingOf(file, module)
      return drawing ? [[file, drawing] as const] : []
    }),
)

/** Every style's id and label, loaded or not, in \`HAIR_STYLES\` order. \`parseSpec\` validates against these. */
export const HAIR_STYLE_PRESETS: Readonly<Record<string, Preset>> =
  PART_MANIFEST?.hair ?? Object.fromEntries(Object.values(HAIR_STYLES).map(({ id, label }) => [id, { id, label }]))

export function hairStyle(id: string): HairDrawing {
  const style = HAIR_STYLES[id]
  if (!style) throw new Error(\`no hair style \${id}\`)
  return style
}

export async function loadHairStyle(id: string): Promise<void> {
  if (id in HAIR_STYLES) return
  const load = HAIR_STYLE_LOADERS[id]
  const drawing = load && drawingOf(id, await load())
  if (!drawing) throw new Error(\`no hair style \${id}\`)
  HAIR_STYLES[id] = drawing
}

/** Loads every style, then keeps \`HAIR_STYLES\` in preset order for the studio pages that list them. */
export async function loadAllHairStyles(): Promise<void> {
  await Promise.all(Object.keys(HAIR_STYLE_PRESETS).map(loadHairStyle))
  const loaded = { ...HAIR_STYLES }
  for (const id of Object.keys(HAIR_STYLES)) delete HAIR_STYLES[id]
  for (const id of Object.keys(HAIR_STYLE_PRESETS)) HAIR_STYLES[id] = loaded[id]!
}
`;export{e as default};