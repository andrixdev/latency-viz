/**
 * Extracted from bubbles:
 * - Energy
 * - Direction
 * - Barycenter
 * - Average bubble
 * - History of bubble (array of bubbles)
 */

let Human = {}

class Radii {
  constructor (rMin, rAvg, rMax) {
    this.rMin = rMin
    this.rAvg = rAvg
    this.rMax = rMax
  }
}

/**
 * Init function, prepares variables stored in Human object
 */
Human.setup = function () {
  // Constants
  this.energyHistoryLength = 20
  this.bubbleHistoryLength = 10

  // Bubble init
  this.bubble = []
  for (let i = 0; i < 25; i++) {
    this.bubble.push({ x: 0, y: 0, z: 0 })
  }
  this.bubbleHistoryIndex = 0
  this.bubbleHistory = []
  this.bubbleHistory.push(this.bubble)

  // Average bubble
  this.averageBubble = []

  // Barycenter
  this.bary = { x: 0, y: 0, z: 0 }
  this.averageBary = { x: 0, y: 0, z: 0 }

  // Main direction
  this.direction = { x: 0, y: 0, z: 0 }

  // Bubble radii (base for energy)
  this.radii = new Radii(0, 0, 0)
  this.lastRadii = this.radii

  // Bubble energy
  this.energyHistoryIndex = 0
  this.energyHistory = []
  this.energy = 0 // Average of energyHistory
  this.energyScale = 6000
}

/**
 * Retrieve bubble frame and compute physics
 * 
 * @param {*} bubbleFrame Bubble Frame
 */
Human.updateFrame = function (bubbleFrame) {
  // Build new bubble with data offset (centering on 0 from [0, 1])
  let newBubble = []
  for (let i = 1; i <= 25; i++) {
    let pt = bubbleFrame["point" + i]
    newBubble.push({
      x: pt.x - 0.5,
      y: pt.y - 0.5,
      z: pt.z - 0.5
    })
  }

  // Overwrite bubble
  this.bubble = newBubble

  // Add to history
  this.bubbleHistoryIndex = (this.bubbleHistoryIndex + 1) % this.bubbleHistoryLength
  this.bubbleHistory[this.bubbleHistoryIndex] = newBubble

  // Compute and save average bubble
  this.averageBubble = this.getAverageBubble()

  // Compute barycenters
  this.bary = this.getBarycenter(this.bubble)
  this.averageBary = this.getBarycenter(this.averageBubble)

  // Compute main direction (from bubble history)
  this.updateDirection()
  
  // Compute energy
  this.updateBubbleEnergy(this.averageBubble)
}

/**
 * Return barycenter
 * 
 * @param {[xyz]} bubble 
 * @returns {xyz} barycenter
 */
Human.getBarycenter = function (bubble) {
  let bary = { x: 0, y: 0, z: 0 }

  bubble.forEach(pt => {
    bary.x += pt.x
    bary.y += pt.y
    bary.z += pt.z
  })

  bary.x /= bubble.length
  bary.y /= bubble.length
  bary.z /= bubble.length

  return bary
}

/**
 * Get all 3 circles radii
 * 
 * @param {[xyz]} bubble 
 * @returns {radii} radii object storing rMin, rAvg and rMax
 */
Human.getBubbleRadii = function (bubble) {
  let rMin = 999999
  let rMax = 0
  let rAverage
  let rSum = 0

  let bary = this.bary
  bubble.forEach(pt => {
    let dx = bary.x - pt.x
    let dy = bary.y - pt.y
    let dz = bary.z - pt.z
    let dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
    rSum += dist

    if (dist > rMax) rMax = dist
    if (dist < rMin) rMin = dist
  })

  rAverage = rSum / bubble.length

  let radii = new Radii(rMin, rAverage, rMax)

  return radii
}

/**
 * Compute average bubble
 * 
 * @returns {[xyz]} average bubble
 */
Human.getAverageBubble = function () {
  // Compute average bubble out of bubble history
  let avBubble = []

  for (let i = 0; i < 25; i++) {
    let x = 0
    let y = 0
    let z = 0

    this.bubbleHistory.forEach(bub => {
      x += bub[i].x
      y += bub[i].y
      z += bub[i].z
    })

    x /= Math.max(1, this.bubbleHistory.length)
    y /= Math.max(1, this.bubbleHistory.length)
    z /= Math.max(1, this.bubbleHistory.length)

    avBubble.push({ x: x, y: y, z: z })
  }
  
  return avBubble
}

/**
 * Scans energy history array and returns average energy
 * 
 * @returns {float} average energy
 */
Human.getEnergyHistoryAverage = function () {
  if (!this.energyHistory.length) {
    console.log("Empty energyHistory, filling with zeros...")
    for (let i = 0; i < this.energyHistoryLength; i++) {
      this.energyHistory.push(0)
    }
  }

  let nrj = 0
  this.energyHistory.forEach(h => { nrj += h })
  nrj /= this.energyHistoryLength

  return nrj
}

/**
 * Core energy calculator
 * 
 * @param {[xyz]} bubble 
 */
Human.updateBubbleEnergy = function (bubble) {
  let alpha = 25
  let beta = 1
  let gamma = 0

  this.lastRadii = this.radii
  this.radii = this.getBubbleRadii(bubble)

  // E = variation of weighted average of squares

  let getSquareSum = (rii) => {
    return 1 / (alpha + beta + gamma) * (alpha * Math.pow(rii.rMin, 2) + beta * Math.pow(rii.rAvg, 2) + gamma * Math.pow(rii.rMax, 2))
  }

  let newSquareSum = getSquareSum(this.radii)
  let lastSquareSum = getSquareSum(this.lastRadii)
  let E = Math.abs(newSquareSum - lastSquareSum)
  //let sigma = 1
  //let visualE = .5 * Math.pow(10000 * E, sigma)
  let visualE = E * this.energyScale

  // If something changed (non-zero energy), push to one of the energyHistory values
  if (E > 0) {
    this.energyHistoryIndex = (this.energyHistoryIndex + 1) % this.energyHistoryLength
    this.energyHistory[this.energyHistoryIndex] = visualE

    // Assign average of energyHistory to energy value
    this.energy = this.getEnergyHistoryAverage()
  }
  
}

/**
 * Scans bubble history to compute main direction
 */
Human.updateDirection = function () {
  if (this.bubbleHistory.length == this.bubbleHistoryLength && this.bubbleHistoryLength >= 2) {
    let newDirection = { x: 0, y: 0, z: 0 }

    // Get last and before last bubble
    let lastIndex = this.bubbleHistoryIndex
    let beforeLastIndex = (lastIndex + 2 * this.bubbleHistoryLength - 1) % this.bubbleHistoryLength 

    let lastBub = this.bubbleHistory[lastIndex]
    let beforeLastBub = this.bubbleHistory[beforeLastIndex]

    let lastBary = this.getBarycenter(lastBub)
    let beforeLastBary = this.getBarycenter(beforeLastBub)

    newDirection.x = lastBary.x - beforeLastBary.x
    newDirection.y = lastBary.y - beforeLastBary.y
    newDirection.z = lastBary.z - beforeLastBary.z

    this.direction = newDirection
  }
}
