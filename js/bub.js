/**
 * ANDRIX ® 2026
 */

let Bub = {}

// Bub logic
Bub.setup = function () {
  this.htmlNode = document.getElementsByTagName("html")[0]
  const mainNode = document.getElementsByTagName("main")[0]
  const frontLayerNode = document.getElementById("front-layer")
  this.mosaicWidth = 540
  this.mosaicHeight = this.mosaicWidth * 9 / 16
  this.fullWidth = window.innerWidth
  this.fullHeight = window.innerHeight
  this.xCm = this.mosaicWidth / 2
  this.yCm = this.mosaicHeight / 2
  this.xCf = this.fullWidth / 2
  this.yCf = this.fullHeight / 2
  this.xC = this.xCm
  this.yC = this.yCm
  this.w = this.mosaicWidth
  this.h = this.mosaicHeight

  // Livermaker control parameters: zoom, position offsets (xyz), zScale
  this.zoom = 8000
  this.xOffset = 0
  this.yOffset = 0
  this.zOffset = 0
  this.zScale = 4000
  this.a = undefined
  this.b = undefined
  this.c = undefined

  // Create all mosaic canvases
  let createCanvas = (id, type) => {
    
    let dpr = window.devicePixelRatio
    let width = type == "mosaic" ? this.mosaicWidth : this.fullWidth
    let height = type == "mosaic" ? this.mosaicHeight : this.fullHeight

    let can = document.createElement("canvas")
    can.id = "can-" + id
    let ctx = can.getContext("2d")
    
    can.width = width * dpr
    can.height = height * dpr
    can.style.width = width + "px"
    can.style.height = height + "px"

    ctx.scale(dpr, dpr)

    // Retains pixel sharpness on scaled image
    ctx.imageSmoothingEnabled = false

    // Line properties
    ctx.lineCap = "round"
    ctx.fillStyle = "#FFFD"
    ctx.strokeStyle = "#FFF"
    ctx.lineWidth = 1

    // Caption
    let caption = document.createElement("p")
    caption.id = can.id + "-caption"
    caption.classList = "caption"

    if (type == "mosaic") {
      this.ctxs.push(ctx)
      this.cans.push(can)
      let container = document.createElement("div")
      container.appendChild(can)
      container.appendChild(caption)
      mainNode.appendChild(container)
    } else if (type == "fullscreen") {
      this.frontCtx = ctx
      frontLayerNode.appendChild(can)
      frontLayerNode.appendChild(caption)
    }
    
  }
  this.cans = []
  this.ctxs = []
  this.canPop = 27
  this.frontCtx = undefined
  for (let c = 0; c < this.canPop; c++) {
    createCanvas(c, "mosaic")
  }

  // Create fullscreen canvas
  createCanvas(999, "fullscreen")

	this.dataToImageRatio3Df = this.fullWidth / 5
	this.dataToImageRatio3Dm = this.mosaicWidth / 5
  this.dataToImageRatio3D = this.dataToImageRatio3Df
	
	// Depth properties in 3D world
	this.cameraZ = 3000
	this.zNearPlan = 1500
	this.zFarPlan = -10000

  this.step = 0

  // Bubble init
  this.bubble = []
  for (let i = 0; i < 25; i++) {
    this.bubble.push({ x: 0, y: 0, z: 0 })
  }
  this.bubbleHistoryLength = 10
  this.bubbleHistoryIndex = 0
  this.bubbleHistory = []
  this.bubbleHistory.push(this.bubble)
  this.averageBubble = []

  // Barycenter
  this.bary = { x: 0, y: 0, z: 0 }
  this.averageBary = { x: 0, y: 0, z: 0 }

  // Main direction
  this.direction = { x: 0, y: 0, z: 0}

  // Bubble energy
  this.radii = 0
  this.lastRadii = 0
  this.energyHistoryLength = 20
  this.energyHistoryIndex = 0
  this.energyHistory = []
  this.energy = 0 // Average of energyHistory
  this.energyScale = 6000

  // Fullscreen mode
  this.isFullscreen = false
  this.activeCanvasID = 0
  if (Init.fullscreen == "1") {
    this.isFullscreen = true
    if (Init.viz && Init.vizMapping[Init.viz]) {
      this.activeCanvasID = Init.vizMapping[Init.viz]
    }
  }

  // Update fullscreen
  Bub.updateFullscreen()
}
Bub.update = function () {
  this.step++
}
Bub.toggleFullscreen = function () {
  this.isFullscreen = !this.isFullscreen
}
Bub.updateFullscreen = function () {
  if (this.isFullscreen) {
    this.xC = this.xCf
    this.yC = this.yCf
    this.w = this.fullWidth
    this.h = this.fullHeight
    this.dataToImageRatio3D = this.dataToImageRatio3Df
  } else {
    this.xC = this.xCm
    this.yC = this.yCm
    this.w = this.mosaicWidth
    this.h = this.mosaicHeight
    this.dataToImageRatio3D = this.dataToImageRatio3Dm
  }
}
Bub.updateLivermakerControls = function (lmState) {
  console.log("Bub log of liveMakerState", lmState)
  if (lmState["uiPage.latency.alex.zoom"]) {
    Bub.zoom = lmState["uiPage.latency.alex.zoom"]
    Bub.xOffset = lmState["uiPage.latency.alex.xOffset"]
    Bub.yOffset = lmState["uiPage.latency.alex.yOffset"]
    Bub.zOffset = lmState["uiPage.latency.alex.zOffset"]
    Bub.zScale = lmState["uiPage.latency.alex.zScale"]
    Bub.a = lmState["uiPage.latency.alex.a"]
    Bub.b = lmState["uiPage.latency.alex.b"]
    Bub.c = lmState["uiPage.latency.alex.c"]
  }
}
Bub.updateFPS = function (deltaTime) {
  this.fps = Math.round(1000 / deltaTime)
}
Bub.updateZoomClick = (type) => {
  if (type == "minusminus") Bub.zoom = Math.round(Bub.zoom * 0.5)
  if (type == "minus") Bub.zoom = Math.round(Bub.zoom * 0.85)
  if (type == "plus") Bub.zoom = Math.round(Bub.zoom * 20/17)
  if (type == "plusplus") Bub.zoom = Math.round(Bub.zoom * 2)
}
Bub.updateZoomWheel = function (deltaY) {
  let newZoom = Math.max(2, Bub.zoom - 0.0015 * deltaY * Bub.zoom)
  Bub.zoom = Math.round(newZoom)
}
Bub.updatePoint = function (url, param) {
    // Detect point number
    let splat = url.split("/")
    let token1 = splat[2]
    let nb = token1.split("t")[1]
    let isPoint = token1.split(nb)[0] == "point"

    let token2 = splat.length >= 3 ? splat[3] : null
    let coord = token2

    if (isPoint) {
      Bub.bubble[nb - 1][coord] = param - 0.5
    }
}
Bub.updateFrame = function (bubbleFrame) {
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
Bub.updateBarycenter = function () {
}
Bub.getBarycenter = function (bubble) {
  let bary = {x: 0, y: 0, z: 0}

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
Bub.getBubbleRadii = function (bubble) {
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

  return { rAvg: rAverage, rMin: rMin, rMax: rMax }
}
Bub.getAverageBubble = function () {
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
Bub.getEnergyHistoryAverage = function () {
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
Bub.updateBubbleEnergy = function (bubble) {
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
Bub.updateDirection = function () {
  if (this.bubbleHistory.length == this.bubbleHistoryLength && this.bubbleHistoryLength >= 2) {
    let newDirection = { x: 0, y: 0, z: 0 }

    // Get last and before last bubble
    let lastIndex = this.bubbleHistoryIndex
    let beforeLastIndex = (lastIndex + 2 * this.bubbleHistoryLength - 1) % this.bubbleHistoryLength 

    let lastBub = this.bubbleHistory[lastIndex]
    let beforeLastBub = this.bubbleHistory[beforeLastIndex]

    let lastBary = this.getBarycenter(lastBub)
    let beforeLastBary = this.getBarycenter(beforeLastBub)

    if (!beforeLastBary) console.log("step", Bub.step)

    newDirection.x = lastBary.x - beforeLastBary.x
    newDirection.y = lastBary.y - beforeLastBary.y
    newDirection.z = lastBary.z - beforeLastBary.z

    this.direction = newDirection
  }
}

// Draw router
Bub.draw = function (id, ctx) {
  // Some costly viz are only rendered 1 in 10 frames in mosaic view
  if (!Bub.isFullscreen && Bub.step % 100 != 0 && id >= 9) return false

  if (id == 0) Bub.draw0(ctx)
  else if (id == 1) Bub.draw1(ctx)
  else if (id == 2) Bub.draw2(ctx)
  else if (id == 3) Bub.draw3(ctx)
  else if (id == 4) Bub.draw4(ctx)
  else if (id == 5) Bub.draw5(ctx)
  else if (id == 6) Bub.draw6(ctx)
  else if (id == 7) Bub.draw7(ctx)
  else if (id == 8) Bub.draw8(ctx)
  else if (id == 9) Bub.draw9(ctx)
  else if (id == 10) Bub.draw10(ctx)
  else if (id == 11) Bub.draw11(ctx)
  else if (id == 12) Bub.draw12(ctx)
  else if (id == 13) Bub.draw13(ctx)
  else if (id == 14) Bub.draw14(ctx)
  else if (id == 15) Bub.draw15(ctx)
  else if (id == 16) Bub.draw16(ctx)
  else if (id == 17) Bub.draw17(ctx)
  else if (id == 18) Bub.draw18(ctx)
  else if (id == 19) Bub.draw19(ctx)
  else if (id == 20) Bub.draw20(ctx)
  else if (id == 21) Bub.draw21(ctx)
  else if (id == 22) Bub.draw22(ctx)
  else if (id == 23) Bub.draw23(ctx)
  else if (id == 24) Bub.draw24(ctx)
  else if (id == 25) Bub.draw25(ctx)
  else if (id == 26) Bub.draw26(ctx)
  else if (id == 27) Bub.draw27(ctx)
  else console.warn("id of Bub.draw() method not recognized: " + id)
}
// 2D
Bub.draw0 = function (ctx) {
  this.draw2Dbubble(ctx, this.bubble)
}
// 2D average
Bub.draw1 = function (ctx) {
  this.draw2Dbubble(ctx, this.averageBubble)
}
// 3D
Bub.draw2 = function (ctx) {
  this.draw3Dbubble(ctx, this.bubble)
}
// 3D average
Bub.draw3 = function (ctx) {
  this.draw3Dbubble(ctx, this.averageBubble)
}
// 3D depth
Bub.draw4 = function (ctx) {
  let bubble = this.bubble
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"

  for (let b = 0; b < bubble.length; b++) {
    let startIndex = b == 0 ? bubble.length - 1 : (b - 1)
    let bubStart = bubble[startIndex]
    let bubEnd = bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z)

    ctx.beginPath()
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.lineWidth = 10 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
    ctx.stroke()
  }
  
  ctx.closePath()

  this.drawBarycenter(ctx)
  
}
// Silhouette
Bub.draw5 = function (ctx) {
  let bubble = this.bubble
  
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  ctx.moveTo(bubble[0].x, bubble[0].y)

  ctx.beginPath()
  
  for (let b = 0; b < bubble.length; b++) {
    let bubEnd = bubble[b]
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.fillStyle = "white"
    ctx.fill()
  }
  
  ctx.closePath()
}
// Painting
Bub.draw6 = function (ctx) {
  let bubble = this.bubble
  ctx.moveTo(bubble[0].x, bubble[0].y)

  ctx.beginPath()
  
  for (let b = 0; b < bubble.length; b++) {
    let bubEnd = bubble[b]
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    let t = Bub.step / 200
    let sin = Math.sin(t)
    let h = 230 + 50 * Math.sign(sin) * Math.pow(Math.abs(sin), 2)
    ctx.fillStyle = "hsl(" + h + ", 85%, 50%)"
    ctx.fill()
  }
  
  ctx.closePath()
}
// 3D aura
Bub.draw7 = function (ctx) {
  let bubble = this.averageBubble
  this.drawAura(ctx, "iso", bubble)
}
// 3D aura energy
Bub.draw8 = function (ctx) {
  let bubble = this.averageBubble
  this.drawAura(ctx, "energy", bubble)
}
// Energy
Bub.draw9 = function (ctx) {
  ctx.fillStyle = "#FFFD"
  if (this.energy > 0) {
    ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
    ctx.beginPath()
    let rad = this.energy * this.w / 150
    ctx.arc(this.xC, this.yC, rad, 0, 2 * Math.PI, false)
    ctx.fill()
    ctx.closePath()
  }
}
// Direction
Bub.draw10 = function (ctx) {
  this.drawDotField(ctx, "direction")
}
// Circles
Bub.draw11 = function (ctx) {
  let bubble = this.bubble
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii(bubble)
  let bary = this.bary
  let baryXyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)

  ctx.strokeStyle = "#FFFA"

  let rScale = 0.75 * Bub.w
  ctx.lineWidth = 2

  // Draw inscribed circle
  ctx.beginPath()
  ctx.arc(baryXyr.x, baryXyr.y, rScale * rii.rMin, 0, 2 * Math.PI, false)
  ctx.stroke()
  ctx.closePath()

  // Draw average circle
  ctx.beginPath()
  ctx.arc(baryXyr.x, baryXyr.y, rScale * rii.rAvg, 0, 2 * Math.PI, false)
  ctx.stroke()
  ctx.closePath()

  // Draw circumscribed circle
  ctx.beginPath()
  ctx.arc(baryXyr.x, baryXyr.y, rScale * rii.rMax, 0, 2 * Math.PI, false)
  ctx.stroke()
  ctx.closePath()
  
}
// Vitruvian
Bub.draw12 = function (ctx) {
  let bubble = this.bubble
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii(bubble)
  let bary = this.bary
  let baryXyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)

  ctx.strokeStyle = "#FFFA"
  let rScale = 0.75 * Bub.w
  ctx.lineWidth = 2

  let drawPentagon = (ctx, rad) => {
    let x, y
    let angle = -Math.PI / 2

    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      x = baryXyr.x + rad * Math.cos(angle)
      y = baryXyr.y + rad * Math.sin(angle)
      ctx.moveTo(x, y)
      angle += Math.PI * 2/5
      x = baryXyr.x + rad * Math.cos(angle)
      y = baryXyr.y + rad * Math.sin(angle)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  // Draw inscribed, average and circumscribed pentagons
  drawPentagon(ctx, rScale * rii.rMin)
  drawPentagon(ctx, rScale * rii.rAvg)
  drawPentagon(ctx, rScale * rii.rMax)
}
// Grid
Bub.draw13 = function (ctx) {
  this.drawDotField(ctx, "iso")
}
// Grid energy
Bub.draw14 = function (ctx) {
  this.drawDotField(ctx, "energy")
}
// Sphere
Bub.draw15 = function (ctx) {
  // Sphere
  Bub.drawSphere(ctx, "iso")
}
// Sphere energy
Bub.draw16 = function (ctx) {
  // Sphere Energy
  Bub.drawSphere(ctx, "energy")
}
// Rain
Bub.draw17 = function (ctx) {
  Dust.evolve("rain")
  Dust.draw(ctx, "rain")
}
// Attraction
Bub.draw18 = function (ctx) {
    Dust.evolve("attraction")
    Dust.draw(ctx, "attraction")
}
// Vortex
Bub.draw19 = function (ctx) {
  Dust.evolve("vortex")
  Dust.draw(ctx, "vortex")
}
// Vortex energy
Bub.draw20 = function (ctx) {
  Dust.evolve("vortex-energy")
  Dust.draw(ctx, "vortex-energy")
}
// Tempest
Bub.draw21 = function (ctx) {
  Dust.evolve("tempest")
  Dust.draw(ctx, "tempest")
}
// Hybrid
Bub.draw22 = function (ctx) {
  Dust.evolve("hybrid")
  Dust.draw(ctx, "hybrid")
}
// Trails
Bub.draw23 = function (ctx) {
  Dust.evolve("trails")
  Dust.draw(ctx, "trails")
}
// Trails gravity
Bub.draw24 = function (ctx) {
  Dust.evolve("trails-gravity")
  Dust.draw(ctx, "trails-gravity")
}
// Magnetic
Bub.draw25 = function (ctx) {
  Dust.evolve("magnetic")
  Dust.draw(ctx, "magnetic")
}
// Multipole
Bub.draw26 = function (ctx) {
  Dust.evolve("multipole")
  Dust.draw(ctx, "multipole")
}
Bub.draw2Dbubble = function (ctx, bubble) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"
  
  for (let b = 0; b < bubble.length; b++) {
    let startIndex = b == 0 ? bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = bubble[startIndex]
    let bubEnd = bubble[b]
    let xStart = this.xC + bubStart.x * this.w
    let yStart = this.yC + bubStart.y * this.h
    let xEnd = this.xC + bubEnd.x * this.w
    let yEnd = this.yC + bubEnd.y * this.h
    ctx.moveTo(xStart, yStart)
    ctx.lineTo(xEnd, yEnd)
    ctx.lineWidth = 2.5
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.draw3Dbubble = function (ctx, bubble) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"
  
  for (let b = 0; b < bubble.length; b++) {
    let startIndex = b == 0 ? bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = bubble[startIndex]
    let bubEnd = bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z)
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.lineWidth = 2
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.drawAura = function (ctx, mode, bubble) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  
  let bary = this.bary

  ctx.strokeStyle = mode == "iso" ? "#FFFA" : "hsl(210, 80%, 50%)"
  let auraScale = mode == "iso" ? 1 : (0.12 + this.energy * 0.13)

  for (let aura = 2; aura <= 12; aura++) {
    let auraStep = aura / 12 * auraScale
    for (let b = 0; b < bubble.length; b++) {
      let startIndex = b == 0 ? bubble.length - 1 : (b - 1)
      let bubStart = bubble[startIndex]
      let bubEnd = bubble[b]
      
      let x1 = bary.x + (bubStart.x - bary.x) * auraStep
      let y1 = bary.y + (bubStart.y - bary.y) * auraStep
      let z1 = bary.z + (bubStart.z - bary.z) * auraStep
      
      let x2 = bary.x + (bubEnd.x - bary.x) * auraStep
      let y2 = bary.y + (bubEnd.y - bary.y) * auraStep
      let z2 = bary.z + (bubEnd.z - bary.z) * auraStep

      let xyrStart = Bub.dataXYZtoCanvasXYR(x1, y1, z1)
      let xyrEnd = Bub.dataXYZtoCanvasXYR(x2, y2, z2)

      ctx.beginPath()
      ctx.moveTo(xyrStart.x, xyrStart.y)
      ctx.lineTo(xyrEnd.x, xyrEnd.y)
      ctx.lineWidth = 5 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
      ctx.stroke()
    }
  
    ctx.closePath()
  }

  this.drawBarycenter(ctx)
}
Bub.drawDotField = function (ctx, mode) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  let xPop = 64//16
  let yPop = ctx.canvas.height / ctx.canvas.width * xPop//18//9

  ctx.lineWidth = mode != "direction" ? this.w / 300 : this.w / 600

  let sensitivity = 1.5
  let amplitude = 0.4

  let bary = Bub.averageBary
  let baryXY = {
    x: this.xC + this.w * bary.x * sensitivity,
    y: this.yC + this.h * bary.y * sensitivity
  }
  let radii = Bub.radii

  // Plot grid & repulsed grid
  for (let j = 0; j < yPop; j++) {
    for (let i = 0; i < xPop; i++) {
      let x = this.w * (i + 0.5) / xPop
      let y = this.h * (j + 0.5) / yPop

      // Translated dot
      ctx.beginPath()
      let distToBary = Math.sqrt(Math.pow(x - baryXY.x, 2) + Math.pow(y - baryXY.y, 2))
      let deformationRadius = amplitude * this.w * radii.rAvg * (mode != "energy" ? 1 : .2 + this.energy / 15)
      let scale = Math.exp(-Math.pow(distToBary / deformationRadius, 2))
      let xx = x + (x - baryXY.x) * scale
      let yy = y + (y - baryXY.y) * scale
      if (mode != "direction") {
        // Draw dot
        ctx.arc(xx, yy, 1, 0, 2 * Math.PI, false)
      } else {
        let stickScale = 1000
        let maxLength = .02
        let smoothDirection = { // Prevents glitches to freeze UI due to too long strokes
          x: Math.max(-maxLength, Math.min(maxLength, this.direction.x)),
          y: Math.max(-maxLength, Math.min(maxLength, this.direction.y))
        }
        ctx.moveTo(xx, yy)
        ctx.lineTo(xx + stickScale * smoothDirection.x, yy + stickScale * smoothDirection.y)
      }
    
      let a = Math.min(1, 0.3 + 2.5 * scale / 2) 
      ctx.strokeStyle = "rgba(255, 255, 255, " + a + ")"
      ctx.stroke()
      ctx.closePath()
    }
  }
}
Bub.drawSphere = function (ctx, mode) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.fillStyle = "#FFFA"

  let bary = this.averageBary

  // /!\ SPECIAL Z RESCALE
  let zRescale = 1/2
  let r = .35
  let thetaStep = Math.PI / 9
  let phiStep = Math.PI / 8
  let thetaOffset = Bub.step / 500
  let phiOffset = 0// + Bub.step / 200

  if (mode == "energy") {
    r = .05 + this.energy / 60
  }
  for (let theta = 0; theta < 2 * Math.PI; theta += thetaStep) {
    for (let phi = -Math.PI; phi < Math.PI; phi += phiStep) {
      
      let x = bary.x + r * Math.cos(theta + thetaOffset) * Math.sin(phi + phiOffset)
      let y = bary.y + r * Math.cos(phi + phiOffset)
      let z = bary.z + r * Math.sin(theta + thetaOffset) * Math.sin(phi + phiOffset) * zRescale

      let xyr = Bub.dataXYZtoCanvasXYR(x, y, z)
      let rr = xyr.r * 10
      ctx.beginPath()
      ctx.arc(xyr.x, xyr.y, rr, 0, 2 * Math.PI, false)
      ctx.fill()
      ctx.closePath()
    }
  }
}
Bub.clearCanvases = function () {
  // Clearing for PAINTING view, on both mosaic and fullscreen views
  Bub.ctxs[5].clearRect(0, 0, Bub.fullWidth, Bub.fullHeight)
  Bub.frontCtx.clearRect(0, 0, Bub.fullWidth, Bub.fullHeight)
}
Bub.drawBarycenter = function (ctx) {
  let bary = this.bary

  let xyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)
  ctx.beginPath()
  let rad = Bub.w * 0.01
  ctx.arc(xyr.x, xyr.y, rad, 0, 2 * Math.PI, false)
  ctx.fillStyle = "red"
  ctx.fill()
  ctx.closePath()
}
Bub.dataXYZtoCanvasXYR = function (x, y, z) {
	// inputted xyz is in particles motion space
	// Outputted XYR is the XY position on the 2D canvas
	// Plus the size at which the dot/line should be drawn
  let depthEffect = 14

	const zCbaseRad = 1.0// A particle positioned at (0, 0, 0) will have radius zCbaseRad
	// Size difference law between frontmost and backmost particles
	let dE = 2 * Math.floor(depthEffect / 2)

  // Rescale z
  z *= this.zScale

  // Apply current offsets
  x += this.xOffset
  y += this.yOffset
  z += this.zOffset
	
	// From base [-500, 500] to [min(w,h), min(w,h)], here min = w for portrait
	let xx = this.xC + this.zoom * this.dataToImageRatio3D * (x) / (this.cameraZ - z)
	let yy = this.yC + this.zoom * this.dataToImageRatio3D * (y) / (this.cameraZ - z)
	let rr = zCbaseRad * Math.pow((0 - this.cameraZ) / (this.cameraZ - z), dE) * this.dataToImageRatio3D

	rr = Math.min(rr, 100 * this.dataToImageRatio3D)

	return { x: xx, y: yy, r: rr }
}
