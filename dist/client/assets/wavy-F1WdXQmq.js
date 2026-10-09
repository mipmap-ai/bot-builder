var e=`import { FRAME_PRESETS } from '../../frame/presets'
import type { DrawingFrame, HairDrawing, HairShape } from '../drawing'
import { WAVY_CAST, WAVY_LAYERS } from './wavy-layers'

/** The reference art's canvas in px. */
const FIGMA_CANVAS = 1200

/** Where the corner-peek frame puts the head on the reference canvas, read when the hair wraps so the art follows the frame. */
function figmaDrawingFrame(): DrawingFrame {
  const { view, pose } = FRAME_PRESETS['corner-peek']
  const scale = FIGMA_CANVAS / view.height
  return { center: [FIGMA_CANVAS / 2 - view.center[0] * scale, FIGMA_CANVAS / 2 + view.center[1] * scale], scale, pose }
}

const layer = (index: number): HairShape => WAVY_LAYERS[index]!

/** The Figma art stops at its left edge. These round the hair off past it, where only wider frames look. */
const PAST_EDGE: HairShape = { tone: 'base', d: 'M32 220L4 186C-70 205-135 285-150 390C-165 495-125 610-45 690L4 668Z' }
const PAST_EDGE_UNDER: HairShape = { tone: 'shade', d: 'M4 520L-128 540C-125 600-95 650-45 690L4 668Z' }

/** The Figma reference hair, drawn at the corner-peek frame. Its layers are the Figma paths with the edges where they meet polished by hand. */
export const wavy: HairDrawing = {
  id: 'wavy',
  label: 'Wavy',
  get frame() {
    return figmaDrawingFrame()
  },
  front: [layer(0), PAST_EDGE, layer(1), PAST_EDGE_UNDER, ...WAVY_LAYERS.slice(2)],
  back: [layer(0), PAST_EDGE, layer(8)],
  cast: { d: WAVY_CAST },
  fit: { crown: 1.2832083129882812, eyeLine: 0.16104460042396646, halfWidth: 1.2106246023496388 },
}
`;export{e as default};