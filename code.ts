// Constants and variables
const CONFIRM_MSGS = ["Done!", "You got it!", "Aye!", "Is that all?", "My job here is done.", "Gotcha!", "It wasn't hard.", "Got it! What's next?"]
const ACTION_MSGS = ["Updated", "Writed", "Made it with", "Got"]
const IDLE_MSGS = ["All great, already", "Nothing to do, everything's good", "Any layers to affect? Can't see it", "Nothing to do, your layers are great"]
const DEFAULT_MODE_NAME = 'Mode 1'
const REWRITE_MSG = 'Rewrite this frame with new variables'

let notification: NotificationHandler
let selection: ReadonlyArray<SceneNode>
let working: boolean
let count: number = 0

const FONT_REGULAR: FontName = { family: 'Inter', style: 'Regular' }
const FONT_SEMIBOLD: FontName = { family: 'Inter', style: 'Semi Bold' }
const FONT_ITALIC: FontName = { family: 'Inter', style: 'Italic' }
const FONT_MONO: FontName = { family: 'Space Mono', style: 'Regular' }
const LIGHT: Paint = { type: 'SOLID', color: { r: 0.988, g: 0.988, b: 0.988 } }
const DARK: Paint = { type: 'SOLID', color: { r: 0.192, g: 0.192, b: 0.192 } }
const DARK_20: Paint = { type: 'SOLID', color: { r: 0.192, g: 0.192, b: 0.192 }, opacity: 0.2 }

let lastX: number = 0
let lastY: number = 0

const MARGIN_X: number = 80
const MARGIN_Y: number = 40
const FONT_SIZE: number = 24
const L_FONT_SIZE: number = 40
const CORNER_RADIUS: number = 16
const MAX_COLUMN_WIDTH: number = 320

figma.on("currentpagechange", cancel)

// Prepare
working = true
selection = figma.currentPage.selection
const collections: VariableCollection[] = figma.variables.getLocalVariableCollections()
if (!collections)
  finish('You have no local variables in this project')

let mainFrame: FrameNode

function createMainFrame() {
  mainFrame = createAutolayout('Local Variables', 'VERTICAL', 2 * MARGIN_Y, 2 * MARGIN_Y, 2 * MARGIN_Y)
  mainFrame.locked = true
  mainFrame.fills = [LIGHT]
  mainFrame.x = Math.round(figma.viewport.center.x - mainFrame.width / 2)
  mainFrame.y = Math.round(figma.viewport.center.y - mainFrame.height / 2)
  mainFrame.cornerRadius = CORNER_RADIUS
  mainFrame.setRelaunchData({ rewrite: REWRITE_MSG })
}

setTimeout(finish.bind('Timeouted!'), 10000)

// Main
if (selection[0]?.type === 'FRAME' && selection[0]?.getRelaunchData().rewrite === REWRITE_MSG) {
  mainFrame = selection[0]
  mainFrame.children.forEach(child => child.remove())
}
else {
  createMainFrame()
}
writeVariables().then(finish.bind(undefined))

// Action for selected nodes
async function writeVariables() {

  await figma.loadFontAsync(FONT_REGULAR)
  await figma.loadFontAsync(FONT_SEMIBOLD)
  await figma.loadFontAsync(FONT_ITALIC)
  for (const c of collections) {

    const collectionRow: FrameNode = createAutolayout(c.name, 'HORIZONTAL', MARGIN_X)
    mainFrame.appendChild(collectionRow)

    const nameColumn: FrameNode = createAutolayout('Names', 'VERTICAL', MARGIN_Y)
    collectionRow.appendChild(nameColumn)

    // Name of collection
    const cName = makeText(c.name, FONT_SEMIBOLD, L_FONT_SIZE)
    offset(cName, 0, MARGIN_Y, false)
    addToColumn(nameColumn, cName)


    const variables = c.variableIds.map(id => figma.variables.getVariableById(id))
    variables.sort((a, b) => a.name.localeCompare(b.name))

    for (const v of variables) {
      const vName = makeText(v.name, FONT_SEMIBOLD, FONT_SIZE)
      offset(vName, 0, MARGIN_Y)
      addToColumn(nameColumn, vName)
      count++
    }

    lastY = 0

    // Print Modes
    for (const m of c.modes) {
      lastY = 0
      const valueColumn: FrameNode = createAutolayout(m.name, 'VERTICAL', MARGIN_Y)
      collectionRow.appendChild(valueColumn)

      const modeName = (c.modes.length === 1 && m.name === DEFAULT_MODE_NAME) ? 'Value' : m.name
      const mName = makeText(modeName, FONT_SEMIBOLD, FONT_SIZE)
      offset(mName, MARGIN_X, 0)
      addToColumn(valueColumn, mName)
      valueColumn.setExplicitVariableModeForCollection(c.id, m.modeId)
      mName.minHeight = cName.height
      mName.textAlignVertical = 'CENTER'

      // Print Values
      for (const v of variables) {
        let vValue: SceneNode
        const type = v.resolvedType
        let value = v.valuesByMode[m.modeId]
        let font = FONT_REGULAR
        if (value?.type === 'VARIABLE_ALIAS') {
          value = figma.variables.getVariableById(value.id).name.toString()
          font = FONT_ITALIC
        } else
          value = (type === 'COLOR') ? figmaRGBToHex(v.valuesByMode[m.modeId]) : v.valuesByMode[m.modeId].toString()

        if (type === 'BOOLEAN' || type === 'COLOR') {
          const valueRow: FrameNode = createAutolayout(v.name, 'HORIZONTAL', 16)

          vValue = makeText(value, font, FONT_SIZE)
          const unit = vValue.height

          // Representative ellipse
          const indicator = figma.createEllipse()
          indicator.resize(unit, unit)

          if (type === 'COLOR') {
            const newFills = JSON.parse(JSON.stringify(indicator.fills))
            console.log(newFills)
            newFills[0] = figma.variables.setBoundVariableForPaint(newFills[0], 'color', v)
            indicator.fills = newFills
            indicator.strokes = [DARK_20]
            indicator.strokeWeight = 1

            valueRow.appendChild(indicator)

          }

          if (type === 'BOOLEAN') {
            const box = figma.createFrame()
            const isTrue = value.toLowerCase() === 'true'
            box.resizeWithoutConstraints(2 * unit, unit)
            box.cornerRadius = unit / 2
            box.fills = isTrue ? [DARK] : []
            box.strokes = [DARK]
            box.strokeWeight = 2
            box.appendChild(indicator)
            indicator.x = isTrue ? unit : 0
            indicator.y = 0

            indicator.fills = isTrue ? [LIGHT] : []
            indicator.strokes = [DARK]
            indicator.strokeWeight = 2

            valueRow.appendChild(box)


          }


          valueRow.appendChild(vValue)
          addToColumn(valueColumn, valueRow)
        } else {
          vValue = makeText(value, font, FONT_SIZE)
          offset(vValue, 0, MARGIN_Y)
          addToColumn(valueColumn, vValue)
        }
      }
    }
  }
}

function offset(node: SceneNode, x: number, y: number, absolute: boolean = false) {
  if (absolute) {
    node.x = x
    node.y = y
  }
  else {
    node.x = (x === 0) ? lastX - node.width : lastX + x
    node.y = (y === 0) ? lastY - node.height : lastY + y
  }
  lastX = node.x + node.width
  lastY = node.y + node.height
}

function makeText(text: string, font: FontName, size: number, truncate: boolean = true) {
  const node = figma.createText()
  node.fontName = font
  node.fontSize = size
  node.fills = [DARK]
  node.characters = text
  node.textTruncation = truncate ? 'ENDING' : 'DISABLED'
  return node
}

function addToColumn(autolayout: FrameNode, child) {
  autolayout.appendChild(child)
  child.layoutAlign = 'STRETCH'
  child.maxWidth = MAX_COLUMN_WIDTH
}

function createFrame(name: string) {
  const frame: FrameNode = figma.createFrame()
  frame.locked = true
  frame.fills = [LIGHT]
  frame.resizeWithoutConstraints(1000, 500)
  frame.name = name
  frame.x = Math.round(figma.viewport.center.x - frame.width / 2)
  frame.y = Math.round(figma.viewport.center.y - frame.height / 2)
  frame.cornerRadius = CORNER_RADIUS
  return frame
}

function createAutolayout(
  name: string,
  direction: "HORIZONTAL" | "NONE" | "VERTICAL" = 'HORIZONTAL',
  gap = 0, paddingX = 0, paddingY = 0,
  sizingX: "HUG" | "FIXED" | "FILL" = 'HUG',
  sizingY: "HUG" | "FIXED" | "FILL" = 'HUG'
) {
  const autolayout: FrameNode = figma.createFrame()
  autolayout.name = name
  autolayout.fills = []
  autolayout.layoutMode = direction
  autolayout.itemSpacing = gap
  autolayout.paddingLeft = paddingX
  autolayout.paddingRight = paddingX
  autolayout.paddingTop = paddingY
  autolayout.paddingBottom = paddingY
  autolayout.layoutSizingHorizontal = sizingX
  autolayout.layoutSizingVertical = sizingY
  return autolayout

}

async function refreshVariablesSection(node) { }

// Ending the work
function finish(message: string = undefined) {
  mainFrame.locked = false
  working = false
  figma.root.setRelaunchData({ relaunch: '' })
  if (message) {
    notify(message)
  }
  else if (count > 0) {
    notify(CONFIRM_MSGS[Math.floor(Math.random() * CONFIRM_MSGS.length)] +
      " " + ACTION_MSGS[Math.floor(Math.random() * ACTION_MSGS.length)] +
      " " + ((count === 1) ? "only one variable" : (count + " variables")))

  }
  else notify(IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)])
  figma.closePlugin()
}

// Show new notification
function notify(text: string) {
  if (notification != null)
    notification.cancel()
  notification = figma.notify(text)
}

// Showing interruption notification
function cancel() {
  if (notification != null)
    notification.cancel()
  if (working) {
    notify("Plugin work have been interrupted")
    figma.closePlugin()
  }
}


// From https://github.com/figma-plugin-helper-functions/figma-plugin-helpers/blob/master/src/helpers/convertColor.ts

const namesRGB = ['r', 'g', 'b']
function figmaRGBToWebRGB(color: RGBA): webRGBA
function figmaRGBToWebRGB(color: RGB): webRGB
function figmaRGBToWebRGB(color): any {
  const rgb = []

  namesRGB.forEach((e, i) => {
    rgb[i] = Math.round(color[e] * 255)
  })

  if (color['a'] !== undefined) rgb[3] = Math.round(color['a'] * 100) / 100
  return rgb
}

function figmaRGBToHex(color: RGB | RGBA): string {
  let hex = '#'

  const rgb = figmaRGBToWebRGB(color) as webRGB | webRGBA
  hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)

  if (rgb[3] !== undefined) {
    const a = Math.round(rgb[3] * 255).toString(16)
    if (a.length == 1) {
      hex += '0' + a
    } else {
      if (a !== 'ff') hex += a
    }
  }
  return hex
}

type webRGB = [number, number, number]
type webRGBA = [number, number, number, number]
