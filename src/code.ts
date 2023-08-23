import { xCollection, xVariable, xValue } from './Collection'
import { createPatch } from 'symmetry'

// Constants and variables
const CONFIRM_MSGS = ["Done!", "You got it!", "Aye!", "Is that all?", "My job here is done.", "Gotcha!", "It wasn't hard.", "Got it! What's next?"]
const ACTION_MSGS = ["Updated", "Writed", "Made it with", "Got"]
const IDLE_MSGS = ["Did not found any variables", "Nothing to do, see no variables", "Any variables? Can't see it", "Can't update any variables. Did you set 'em up?"]
const DEFAULT_MODE_NAME = 'Mode 1'
const REWRITE_MSG = 'Rewrite this frame with new variables'

let notification: NotificationHandler
let selection: ReadonlyArray<SceneNode>
let working: boolean
let vCount: number = 0
let vlCount: number = 0
let oldCollectionData: Map<string, xCollection> = null

const FONT_REGULAR: FontName = { family: 'Inter', style: 'Regular' }
const FONT_SEMIBOLD: FontName = { family: 'Inter', style: 'Semi Bold' }
const FONT_ITALIC: FontName = { family: 'Inter', style: 'Italic' }
const FONT_MONO: FontName = { family: 'Space Mono', style: 'Regular' }
const LIGHT: Paint = { type: 'SOLID', color: { r: 0.988, g: 0.988, b: 0.988 } }
const DARK: Paint = { type: 'SOLID', color: { r: 0.192, g: 0.192, b: 0.192 } }
const DARK_20: Paint = { type: 'SOLID', color: { r: 0.192, g: 0.192, b: 0.192 }, opacity: 0.2 }

const MARGIN_X: number = 80
const MARGIN_Y: number = 40
const FONT_SIZE: number = 24
const L_FONT_SIZE: number = 40
const CORNER_RADIUS: number = 16
const MAX_COLUMN_WIDTH: number = 320

const NAME_WIDTH: number = 320
const VALUE_WIDTH: number = 80

let maxNameWidth = 0
let maxValueWidthes = []
let mainFrames: FrameNode[] = []

figma.on("currentpagechange", cancel)

// Prepare

working = true
selection = figma.currentPage.selection
const collections: VariableCollection[] = figma.variables.getLocalVariableCollections()
if (!collections)
  finish('You have no local variables in this project')

// Main
const start = Date.now()
setTimeout(finish.bind('Timeouted!'), 10000)

// Get variables
const collectionsData = writeVariables()
if (!collectionsData.size)
  finish('You have no variables here')

// If exposed variables exists in selection
mainFrames = selection.filter(x => x.type === 'FRAME' && x?.getRelaunchData().rewrite === REWRITE_MSG) as FrameNode[]
if (mainFrames.length) {
  // mainFrames.forEach(x => {
  //   console.log(`mainFrame[${mainFrames.indexOf(x)}]plugin data: `)
  //   console.log(JSON.parse(x.getPluginData('variables')))

  //   console.log(compare(JSON.parse(x.getPluginData('variables')), collectionsData))
  // })
}
else
  mainFrames = [createMainFrame()]

// exposeVariables().then(finish.bind(undefined))
mainFrames.forEach(x => exposeVariables(collectionsData, x))
console.log(`Execution time: ${Date.now() - start} ms`)
// finish(null)

// Creating frame with exposed variables
function createMainFrame() {
  const mainFrame = createAutolayout('Local Variables', 'HORIZONTAL', 2 * MARGIN_Y, 2 * MARGIN_Y, 2 * MARGIN_Y)
  mainFrame.locked = true
  mainFrame.fills = [LIGHT]
  mainFrame.x = Math.round(figma.viewport.center.x - mainFrame.width / 2)
  mainFrame.y = Math.round(figma.viewport.center.y - mainFrame.height / 2)
  mainFrame.cornerRadius = CORNER_RADIUS
  mainFrame.setRelaunchData({ rewrite: REWRITE_MSG })
  return mainFrame
}

// Getting all collections and writing to collesctions map
function writeVariables(): Map<string, xCollection> {

  const cs = new Map<string, xCollection>()
  const collections: VariableCollection[] = figma.variables.getLocalVariableCollections()

  console.log(`Found ${collections.length} collections`)
  for (const collection of collections) {
    let c: xCollection = {
      id: collection.id,
      name: collection.name,
      modes: new Map(collection.modes.map(x => [x.modeId, x])),
      variables: new Map()
    }
    const variables: Variable[] = collection.variableIds.map(id => figma.variables.getVariableById(id))
    console.log(`Found ${variables.length} variables in collection`)

    for (const variable of variables) {
      let v: xVariable = {
        id: variable.id,
        name: variable.name,
        description: variable.description,
        type: variable.resolvedType,
        values: new Map<string, xValue>()
      }

      const values = variable.valuesByMode                            // Values of variable
      console.log(`Found ${Object.entries(values).length} values in variable`)

      for (const [key, value] of Object.entries(values)) {            // Can't normally iterate 'cause it's object, not an array
        let vl: xValue = { modeId: key, alias: null, resolvedValue: null }
        if (value?.type === 'VARIABLE_ALIAS') {
          vl.alias = value.id
          vl.resolvedValue = getResolvedValue(variable.id, key)
        }
        else
          vl.resolvedValue = value

        v.values.set(vl.modeId, vl)
      }
      c.variables.set(v.id, v)
    }
    cs.set(c.id, c)
  }
  return cs
}

function exposeVariables(data: Map<string, xCollection>, mainFrame: FrameNode) {

  mainFrame.setPluginData('variables', JSON.stringify(data))


}


const oldData = new Map([
  ['collection_id1', {
    id: 'collection_id1',
    name: 'First Collection',
    variables: new Map([
      ['variable_id1', {
        id: 'variable_id1',
        name: 'First Variable',
        description: '',
        type: 'color',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: 'variable_id2', resolvedValue: '#000' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#111' }],
          ['mode_id3', { modeId: 'mode_id3', alias: null, resolvedValue: '#111111' }]
        ])]
      }
      ],
      ['variable_id2', {
        id: 'variable_id2',
        name: 'Second Variable',
        description: '',
        type: 'color',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: 'variable_id3', resolvedValue: '#000' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#222' }],
          ['mode_id3', { modeId: 'mode_id3', alias: null, resolvedValue: '#222222' }]
        ])]
      }
      ],
      ['variable_id3', {
        id: 'variable_id3',
        name: 'Third Variable',
        description: '',
        type: 'string',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: null, resolvedValue: '#000' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#333' }],
          ['mode_id3', { modeId: 'mode_id3', alias: null, resolvedValue: '#333333' }]
        ])]
      }
      ]
    ]),
    modes: new Map([
      ['mode_id1', { id: "mode_id1", name: "First mode" }],
      ['mode_id2', { id: "mode_id2", name: "Second mode" }],
      ['mode_id3', { id: "mode_id3", name: "Third mode" }]
    ])
  }]
])


const newData = new Map([
  ['collection_id1', {
    id: 'collection_id1',
    name: 'First Collection',
    variables: new Map([
      ['variable_id1', {
        id: 'variable_id1',
        name: 'First Variable',
        description: '',
        type: 'color',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: 'variable_id2', resolvedValue: '#000' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#111' }],
          ['mode_id3', { modeId: 'mode_id3', alias: null, resolvedValue: '#111111' }]
        ])]
      }
      ],
      ['variable_id2', {
        id: 'variable_id2',
        name: 'Second Variable New',
        description: '',
        type: 'color',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: null, resolvedValue: '#3F0' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#222' }],
          ['mode_id4', { modeId: 'mode_id4', alias: null, resolvedValue: '#222222' }]
        ])]
      }
      ],
      ['variable_id3', {
        id: 'variable_id3',
        name: 'Third Variable',
        description: '',
        type: 'string',
        values: [new Map([
          ['mode_id1', { modeId: 'mode_id1', alias: null, resolvedValue: '#000' }],
          ['mode_id2', { modeId: 'mode_id2', alias: null, resolvedValue: '#333' }],
          ['mode_id4', { modeId: 'mode_id4', alias: null, resolvedValue: '#333333' }]
        ])]
      }
      ]
    ]),
    modes: new Map([
      ['mode_id1', { id: "mode_id1", name: "First Mode" }],
      ['mode_id2', { id: "mode_id2", name: "Second Mode New" }],
      ['mode_id4', { id: "mode_id4", name: "Fourth Mode" }]
    ])
  }],
  ['collection_id2', {
    id: 'collection_id2',
    name: 'Second Collection'
  }]
])

console.log(`Is map instance: ${oldData.get('collection_id1').variables instanceof Map}`)
console.log(`Old variable 1:\n ${oldData.get('collection_id1').variables.get('variable_id1').name}`)


function serialize(map) {
  return JSON.stringify(map, (key, value) => (value instanceof Map ? [...value] : value), '\t')
}

console.log(`Old data:\n ${serialize(oldData)}`)
console.log(`New data: \n ${serialize(newData)} `)
console.log(`Diff: \n ${serialize(compare(oldData, newData))} `)



function compare(oldData: Map<string, any>, newData: Map<string, any>, writeUnchanged = false, deletedDetails = false) {
  const diff = new Map<string, Map<string, any>>([
    ['UNCHANGED', new Map()],
    ['UPDATED', new Map()],
    ['ADDED', new Map()],
    ['DELETED', new Map()]
  ])

  // const diff = {
  //   UNCHANGED: {},
  //   UPDATED: {},
  //   ADDED: {},
  //   DELETED: {}
  // }

  // Structure will look like:

  // JSON.stringify({
  //   "collection_id1": {
  //     // Unchanged properties
  //     UNCHANGED: {
  //       id: "collection_id1"
  //     },
  //     // Properties that changed or thier children changed somehow
  //     UPDATED: {
  //       name: "First Collection New Name",
  //       modes: {
  //         UNCHANGED: {
  //           "mode_id1": { id: "mode_id1", name: "First mode" }
  //         },
  //         // Changes are nested
  //         UPDATED: {
  //           // At any level
  //           "mode_id2": {
  //             // Maybe UNCHANGED is not that necessary
  //             UNCHANGED: {
  //               id: "mode_id2",
  //             },
  //             UPDATED: {
  //               name: "Second Mode New Name"
  //             }
  //           }
  //         },
  //         ADDED: {
  //           "mode_id3": { id: "mode_id3", name: "Third mode" }
  //         },
  //         DELETED: {
  //           // DELETED details is optional too
  //           "mode_id4": { id: "mode_id4", name: "Fourth Mode" }
  //         }
  //       },
  //       variables: {
  //         // Variables list diff
  //         UNCHANGED: {
  //           "variable_id1": {
  //             id: "variable_id1",
  //             name: "First Variable",
  //             description: "",
  //             type: "color",
  //             values: { ...},
  //           },
  //           UPDATED: {
  //             "variable_id2": {
  //               // Diff of the variable
  //               UNCHANGED: { id: "variable_id2", description: "", type: "string" },
  //               UPDATED: {
  //                 name: "Second Variable New",
  //                 values: {
  //                   UNCHANGED: {
  //                     "mode_id1": { modeId: "mode_id1", alias: null, resolvedValue: "i am one" }
  //                   },
  //                   UPDATED: {
  //                     "mode_id2": {
  //                       UNCHANGED: { modeId: "mode_id2", alias: "variable_idN" },
  //                       UPDATED: { resolvedValue: "i am two" }
  //                     }
  //                   },
  //                 }
  //               }
  //             }
  //           },
  //           ADDED: {
  //             "variable_id3": {
  //               id: "variable_id3",
  //               name: "Third Variable",
  //               description: "",
  //               type: "color",
  //               values: { ...},
  //             }
  //           },
  //           DELETED: {
  //             "variable_id4": {
  //               id: "variable_id4",
  //               name: "Fourth Variable",
  //               description: "",
  //               type: "color",
  //               values: { ...},
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // })

  for (const [k, v] of newData) {
    const vOld = oldData.get(k)
    if (v instanceof Object && vOld instanceof Object) {

      console.log('Comparing objects')
      function compareObjects(oldData, newData) {
        for (const [k, v] of Object.entries(newData)) {
          const vOld = oldData['k']
          // Need more logic
        }
      }
      if (v instanceof Map && vOld instanceof Map) {
        console.log('Comparing nested maps!')
        const nestedDiff = compare(v, vOld)
        if (
          nestedDiff.has('ADDED') ||
          nestedDiff.has('UPDATED') ||
          nestedDiff.has('DELETED')
        )
          diff.get('UPDATED').set(k, nestedDiff)
      } else {
        // We have primitive?
        if (vOld === undefined) {
          diff.get('ADDED').set(k, v)
        }
        else if (v === vOld) {
          diff.get('UNCHANGED').set(k, v)
        } else if (v !== vOld) {
          diff.get('UPDATED').set(k, v)
        }
      }
    }
    for (const [k, v] of oldData) {
      if (typeof v === 'object' && v !== null) {
        // TODO: compare any objects
      } else {
        if (!newData.has(k)) {
          diff.get('DELETED').set(k, v)
        }
      }
    }
    return diff
  }


  function getResolvedValue(variableId, modeId) {
    const variable = figma.variables.getVariableById(variableId)
    const value = variable.valuesByMode[modeId]
    if (value?.type === 'VARIABLE_ALIAS')
      getResolvedValue(value.id, modeId)
    else
      return value
  }
}

function calculateWidth(mainFrames: FrameNode[], nameWidth: number, valueWidthes: number[]) { }
function setWidth(mainFrames: FrameNode[], nameWidth: number, valueWidthes: number[]) { }

// async function exposeVariables(collectionsData: Map<string, xCollection>, mainFrames: FrameNode[]) {

//   await figma.loadFontAsync(FONT_REGULAR)
//   await figma.loadFontAsync(FONT_SEMIBOLD)
//   await figma.loadFontAsync(FONT_ITALIC)

//   for (const mainFrame of mainFrames) {
//     for (const c of collectionsData.values()) {

//       const collectionColumn = createAutolayout(c.name, 'HORIZONTAL', MARGIN_X)
//       mainFrame.appendChild(collectionColumn)

//       const collectionHeaderRow = createAutolayout(c.name, 'HORIZONTAL', MARGIN_X)
//       collectionColumn.appendChild(collectionHeaderRow)

//       const collectionNameCell = makeText(c.name, FONT_SEMIBOLD, L_FONT_SIZE)
//       collectionHeaderRow.appendChild(collectionNameCell)
//       maxNameWidth = c.renderWidth = collectionNameCell.width

//       for (const [i, m] of c.modes.entries()) {
//         const modeNameCell = makeText(c.name, FONT_SEMIBOLD, FONT_SIZE)
//         collectionHeaderRow.appendChild(collectionNameCell)
//         maxValueWidthes[i] = m.renderWidth = modeNameCell.width
//       }

//       const variables = c.variables
//       variables.sort((a, b) => a.name.localeCompare(b.name))

//       for (const v of variables) {
//         const variableRow = createAutolayout(v.name, 'HORIZONTAL', MARGIN_X)
//         collectionColumn.appendChild(variableRow)

//         const variableNameCell = makeText(v.name, FONT_SEMIBOLD, FONT_SIZE)
//         variableRow.appendChild(variableNameCell)
//         v.renderWidth = variableNameCell.width
//         maxNameWidth = Math.max(maxNameWidth, v.renderWidth)

//         for (const [j, vl] of v.values.entries()) {
//           const variableValueCell = makeText(vl.alias || vl.resolvedValue, FONT_REGULAR, FONT_SIZE)
//           variableRow.appendChild(variableValueCell)
//           vl.renderWidth = variableValueCell.width
//           maxNameWidth = Math.max(maxValueWidthes[j], vl.renderWidth)
//           vlCount++
//         }


//         vCount++
//       }

//       // Print Modes
//       for (const m of c.modes) {
//         const valueColumn: FrameNode = createAutolayout(m.name, 'VERTICAL', MARGIN_Y)
//         collectionColumn.appendChild(valueColumn)

//         const modeName = (c.modes.length === 1 && m.name === DEFAULT_MODE_NAME) ? 'Value' : m.name
//         const mName = makeText(modeName, FONT_SEMIBOLD, FONT_SIZE)
//         // offset(mName, MARGIN_X, 0)
//         addToColumn(valueColumn, mName)
//         valueColumn.setExplicitVariableModeForCollection(c.id, m.modeId)
//         mName.minHeight = collectionNameCell.height
//         mName.textAlignVertical = 'CENTER'

//         // Print Values
//         for (const v of variables) {
//           let vValue: SceneNode
//           const type = v.resolvedType
//           let value = v.valuesByMode[m.modeId]
//           let font = FONT_REGULAR
//           if (value?.type === 'VARIABLE_ALIAS') {
//             value = figma.variables.getVariableById(value.id).name.toString()
//             font = FONT_ITALIC
//           } else
//             value = (type === 'COLOR') ? figmaRGBToHex(v.valuesByMode[m.modeId]) : v.valuesByMode[m.modeId].toString()

//           if (type === 'BOOLEAN' || type === 'COLOR') {
//             const valueRow: FrameNode = createAutolayout(v.name, 'HORIZONTAL', 16)

//             vValue = makeText(value, font, FONT_SIZE)
//             const unit = vValue.height

//             // Representative ellipse
//             const indicator = figma.createEllipse()
//             indicator.resize(unit, unit)

//             if (type === 'COLOR') {
//               const newFills = JSON.parse(JSON.stringify(indicator.fills))
//               console.log(newFills)
//               newFills[0] = figma.variables.setBoundVariableForPaint(newFills[0], 'color', v)
//               indicator.fills = newFills
//               indicator.strokes = [DARK_20]
//               indicator.strokeWeight = 1

//               valueRow.appendChild(indicator)

//             }

//             if (type === 'BOOLEAN') {
//               const box = figma.createFrame()
//               const isTrue = value.toLowerCase() === 'true'
//               box.resizeWithoutConstraints(2 * unit, unit)
//               box.cornerRadius = unit / 2
//               box.fills = isTrue ? [DARK] : []
//               box.strokes = [DARK]
//               box.strokeWeight = 2
//               box.appendChild(indicator)
//               indicator.x = isTrue ? unit : 0
//               indicator.y = 0

//               indicator.fills = isTrue ? [LIGHT] : []
//               indicator.strokes = [DARK]
//               indicator.strokeWeight = 2

//               valueRow.appendChild(box)


//             }


//             valueRow.appendChild(vValue)
//             addToColumn(valueColumn, valueRow)
//           } else {
//             vValue = makeText(value, font, FONT_SIZE)
//             addToColumn(valueColumn, vValue)
//           }
//         }
//       }
//     }
//   }
// }

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

function createFrame(name: string): FrameNode {
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
  name: string = "Frame",
  direction: "HORIZONTAL" | "NONE" | "VERTICAL" = 'HORIZONTAL',
  gap = 0, paddingX = 0, paddingY = 0,
  sizingX: "HUG" | "FIXED" | "FILL" = 'HUG',
  sizingY: "HUG" | "FIXED" | "FILL" = 'HUG'
): FrameNode {
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
function finish(message: string = null) {
  console.log(`finishing with msg ${message} `)
  mainFrames.forEach(x => x.locked = false)
  working = false
  figma.root.setRelaunchData({ relaunch: '' })
  if (message) {
    notify(message)
  }
  else if (vCount > 0) {
    notify(CONFIRM_MSGS[Math.floor(Math.random() * CONFIRM_MSGS.length)] +
      " " + ACTION_MSGS[Math.floor(Math.random() * ACTION_MSGS.length)] +
      " " + ((vCount === 1) ? "only one variable" : (vCount + " variables")))

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
