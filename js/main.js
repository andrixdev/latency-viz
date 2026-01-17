/**
 * ANDRIX ® 2026
 */

let Bub = {}
let Dust = {}
let UI = {}

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
  this.canPop = 19
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
Bub.draw = function (id, ctx) {
  // Some costly viz are only rendered 1 in 10 frames in mosaic view
  if (!Bub.isFullscreen && Bub.step % 100 != 0 && id >= 11) return false

  if (id == 0) Bub.draw0(ctx, this.bubble)
  else if (id == 1) Bub.draw1(ctx, this.bubble)
  else if (id == 2) Bub.draw2(ctx, this.bubble)
  else if (id == 3) Bub.draw3(ctx, this.bubble)
  else if (id == 4) Bub.draw4(ctx, this.bubble)
  else if (id == 5) Bub.draw5(ctx, this.bubble)
  else if (id == 6) Bub.draw6(ctx, this.bubble)
  else if (id == 7) Bub.draw7(ctx, this.bubble)
  else if (id == 8) Bub.draw8(ctx)
  else if (id == 9) Bub.draw9(ctx, this.bubble)
  else if (id == 10) Bub.draw10(ctx)
  else if (id == 11) Bub.draw11(ctx)
  else if (id == 12) Bub.draw12(ctx)
  else if (id == 13) Bub.draw13(ctx)
  else if (id == 14) Bub.draw14(ctx)
  else if (id == 15) Bub.draw15(ctx)
  else if (id == 16) Bub.draw16(ctx)
  else if (id == 17) Bub.draw17(ctx)
  else if (id == 18) Bub.draw18(ctx)
  else console.warn("id of Bub.draw() method not recognized: " + id)
}
Bub.draw0 = function (ctx, bubble) {
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
Bub.draw1 = function (ctx, bubble) {
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
Bub.draw2 = function (ctx, bubble) {
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
Bub.draw3 = function (ctx, bubble) {
  this.drawAura(ctx, "iso", bubble)
}
Bub.draw4 = function (ctx, bubble) {
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
Bub.draw5 = function (ctx, bubble) {
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
Bub.draw6 = function (ctx, bubble) {
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
Bub.draw7 = function (ctx, bubble) {
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
Bub.draw8 = function (ctx) {
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
Bub.draw9 = function (ctx, bubble) {
  this.drawAura(ctx, "energy", bubble)
}
Bub.draw10 = function (ctx) {
  this.drawDotField(ctx, "iso")
}
Bub.draw11 = function (ctx) {
  this.drawDotField(ctx, "energy")
}
Bub.draw12 = function (ctx) {
  Dust.evolve("rain")
  Dust.draw(ctx, "rain")
}
Bub.draw13 = function (ctx) {
    Dust.evolve("attraction")
    Dust.draw(ctx, "attraction")
}
Bub.draw14 = function (ctx) {
  Dust.evolve("vortex")
  Dust.draw(ctx, "vortex")
}
Bub.draw15 = function (ctx) {
  Dust.evolve("tempest")
  Dust.draw(ctx, "tempest")
}
Bub.draw16 = function (ctx) {
  Dust.evolve("trails")
  Dust.draw(ctx, "trails")
}
Bub.draw17 = function (ctx) {
  Dust.evolve("trails-gravity")
  Dust.draw(ctx, "trails-gravity")
}
Bub.draw18 = function (ctx) {
  Dust.evolve("magnetic")
  Dust.draw(ctx, "magnetic")
}
Bub.drawAura = function (ctx, mode, bubble) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  
  let bary = this.bary

  ctx.strokeStyle = mode == "iso" ? "#FFFA" : "hsl(210, 80%, 50%)"
  let auraScale = mode == "iso" ? 1 : (0.08 + this.energy * 0.08)

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

  ctx.lineWidth = this.w / 300

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
      let deformationRadius = amplitude * this.w * radii.rAvg * (mode == "iso" ? 1 : this.energy / 10)
      let scale = Math.exp(-Math.pow(distToBary / deformationRadius, 2))
      let xx = x + (x - baryXY.x) * scale
      let yy = y + (y - baryXY.y) * scale
      ctx.arc(xx, yy, 1, 0, 2 * Math.PI, false)
      let a = Math.min(1, 0.6 + 1.5 * scale / 2) 
      ctx.strokeStyle = "rgba(255, 255, 255, " + a + ")"
      ctx.stroke()
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

// Particle system
Dust.setup = function () {
  this.dustPop = 4000
  this.particles = []
  this.spawnRate = 15
  let v = 15
  this.eddies = [{ // First eddy is for barycenter
    x: Bub.xC,
    y: Bub.yC,
    vx: 0,
    vy: 0,
    r0: 0.025 * Bub.w
  }, {
    x: Bub.w * (-0.5 + 2 * Math.random()),
    y: Bub.h * (-0.5 + 2 * Math.random()),
    vx: v * Math.random() * 2,
    vy: v * Math.random() * 2,
    r0: 0.3 * Bub.w * Math.random()
  }, {
    x: Bub.w * (-0.5 + 2 * Math.random()),
    y: Bub.h * (-0.5 + 2 * Math.random()),
    vx: v * Math.random(),
    vy: v * Math.random(),
    r0: 0.1 * Bub.w * Math.random()
  }, {
    x: Bub.w * (-0.5 + 2 * Math.random()),
    y: Bub.h * (-0.5 + 2 * Math.random()),
    vx: v * Math.random(),
    vy: v * Math.random(),
    r0: 0.5 * Bub.w * Math.random()
  }]
}
Dust.evolve = function (style) {
  for (let i = 0; i < this.spawnRate; i++) {
    if (this.particles.length < this.dustPop) this.spawn(style)
  }
  this.move(style)
}
Dust.spawn = function (style) {
  let id = Math.floor(1000000 * Math.random())
  let x = -Bub.w / 2 + 2 * Bub.w * Math.random()
  let y = -Bub.h / 2 + 2 * Bub.h * Math.random()
  let lifetime = 400 + 400 * Math.random()
  if (style == "trails" || style == "trails-gravity") {
    // Choose 2 random subsequent bubble points and spawn on the corresponding segment
    let randIndex = Math.floor(Bub.bubble.length * Math.random())
    let nextIndex = (randIndex + 1) % Bub.bubble.length
    let p1 = Bub.bubble[randIndex]
    let p2 = Bub.bubble[nextIndex]
    let p1x = p1.x
    let p1y = p1.y
    let p2x = p2.x
    let p2y = p2.y
    let lerp = Math.random()
    let spawnX = p1x + lerp * (p2x - p1x)
    let spawnY = p1y + lerp * (p2y - p1y)
    x = Bub.xC + Bub.w * spawnX
    y = Bub.yC + Bub.h * spawnY
    this.spawnRate = 500
    lifetime = 120
  }
  this.particles.push({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    hue: 15 + 50 * Math.random(),
    lum: 20 + 60 * Math.pow(Math.random(), 3),
    size: Math.random() < 0.925 ? 1 : 3.5,
    lifetime: lifetime,
    name: 'seed-' + Bub.step + '-' + id,
    age: 0
  })
}
Dust.kill = function (deadParticleName) {
	this.particles = this.particles.filter(p => p.name !== deadParticleName)
}
Dust.killAll = function () {
  this.particles = []
}
Dust.move = function (style) {
  let dt = 0.1
  let w = Bub.w
  let h = Bub.h

  // Force parameters
  let vorticity = (style == "vortex" || style == "tempest") ? 10 : (style == "attraction" ? 0.5 : 0)
  let mag = style == "magnetic" ? 20 : 0
  let g = (style == "rain") ? 1 : (style == "trails-gravity" ? 2.5 : 0)
  let mu = style == "attraction" ? 30 : 0
  let rainRepulse = style == "rain" ? 2 : 0
  let attractionR0 = 0.01 * w
  let rainR0 = 0.015 * w
  let visc = (style == "vortex" || style == "tempest") ? .1 : ((style == "magnetic" || style =="attraction") ? .05 : 0)

  let baryXY = {
    x: Bub.xC + Bub.bary.x * w,
    y: Bub.yC + Bub.bary.y * h
  }

  // Update first eddy (barycenter)
  this.eddies[0].x = baryXY.x
  this.eddies[0].y = baryXY.y

  if (style == "tempest") this.moveEddies()

  this.particles.forEach(p => {
    let dist = Math.sqrt(Math.pow(baryXY.x - p.x, 2) + Math.pow(baryXY.y - p.y, 2))
    let dx = baryXY.x - p.x
    let dy = baryXY.y - p.y
    let xAcc = 0
    let yAcc = g

    // Attraction
    xAcc += mu * dx / Math.pow(dist / attractionR0, 2.0)
    yAcc += mu * dy / Math.pow(dist / attractionR0, 2.0)

    // Magnetic dipole
    let multi = Math.pow(dist, -5);
    let xAccMag = 3 * dx * dy * multi
    let yAccMag = (3 * dy * dy - dist * dist) * multi
    var accNorm = Math.sqrt(xAccMag * xAccMag + yAccMag * yAccMag)
    xAcc += mag * xAccMag / accNorm
    yAcc += mag * yAccMag / accNorm

    // Update velocities
    p.vx += xAcc * dt
    p.vy += yAcc * dt

    // Rain
    p.vx += -rainRepulse * Math.sign(dx) * Math.exp(-Math.pow(dist/rainR0, 0.5))

    // Vortices
    let nbOfEddies = style == "tempest" ? this.eddies.length : 1
		for (let e = 0; e < nbOfEddies; e++) {
			let eddy = this.eddies[e]
			let dx = p.x - eddy.x,
			dy = p.y - eddy.y,
			r = Math.sqrt(dx*dx + dy*dy),
			theta = Utils.segmentAngleRad(0, 0, dx, dy, true),
			cos = Math.cos(theta), sin = Math.sin(theta),
			r0 = eddy.r0
			
			let er = { x: cos, y: sin },
				eO = { x: -sin, y: cos }
				
			let radialVelocity = -0.003 * Math.abs(dx*dy)/3000,
				sigma = 100,
				azimutalVelocity = Math.exp(-Math.pow((r - r0) / sigma, 2))
			
      let K = style == "tempest" ? (e == 0 ? 2 : 0.5) : 5
			p.vx += vorticity * K * (radialVelocity * er.x + azimutalVelocity * eO.x)
			p.vy += vorticity * K * (radialVelocity * er.y + azimutalVelocity * eO.y)
		}
		
		// Viscosity
		p.vx *= (1 - visc)
    p.vy *= (1 - visc)

    p.x += p.vx * dt
    p.y += p.vy * dt

    p.age++

    // Kill if too old
    if (p.age > p.lifetime) {
      this.kill(p.name)
    }
    // Kill if out of sight (with extra space outside canvas)
    if (p.x < -1*w || p.x > 2*w || p.y < -1*h || p.y > 2*h) {
      this.kill(p.name)
    }
    // Kill if too close to barycenter on attraction style
    if (style == "attraction" && dist < w * 0.03) {
      this.kill(p.name)
    }
    // Kill if close to barycenter on rain style
    if (style == "rain" && dist < w * 0.05) {
      this.kill(p.name)
    }

  })
}
Dust.moveEddies = function () {
  let dt = 0.1
  this.eddies.forEach(eddy => {
    eddy.x = eddy.x + eddy.vx * dt
    eddy.y = eddy.y + eddy.vy * dt

    // Revert velocity in case of border hit
    if (eddy.x < -0.1 * Bub.w) eddy.vx *= -1
    if (eddy.x > 1.1 * Bub.w) eddy.vx *= -1
    if (eddy.y < -0.1 * Bub.h) eddy.vy *= -1
    if (eddy.y > 1.1 * Bub.h) eddy.vy *= -1
  })
}
Dust.draw = function (ctx, style) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
  ctx.fillRect(0, 0, Bub.fullWidth, Bub.fullHeight)

  ctx.strokeStyle = "#FFFA"
  let hue = 0
  let sat = 100
  if (style == "magnetic") {
    hue = 20
  } else if (style == "attraction") {
    hue = 0
  } else if (style == "vortex") {
    hue = 220
  } else if (style == "tempest") {
    hue = 195
  } else if (style == "trails") {
    hue = 0
  } else if (style == "rain") {
    sat = 0
  } else if (style == "trails-gravity") {
    hue = 180
    sat = 50
  }

  this.particles.forEach(p => {
    ctx.beginPath()
    let x = p.x
    let y = p.y
    ctx.arc(x, y, p.size / 1.5 * Bub.w / 1000, 0, 2 * Math.PI, false)
    lum = p.lum
    if (style == "trails") { 
      hue = p.hue
      lum = 20 + 0.75 * p.hue
    }
    else if (style == "trails-gravity") {
      hue = 160 + p.hue
      lum += 10
    }
    ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, " + lum + "%)"
    ctx.fill()
    ctx.closePath()
  })
}

// Bub UI
UI.setup = function () {
  // Misc
  this.fpsNode = document.getElementById("fps")
  this.canvasesNodes = document.getElementsByTagName("canvas")
  this.frontCaptionNode = document.querySelector("#front-layer .caption")

  // Zoom
  this.zoomValueNode = document.getElementById("zoom")
  this.zoomMinusMinusNode = document.getElementById("zoom-minusminus")
  this.zoomMinusNode = document.getElementById("zoom-minus")
  this.zoomPlusNode = document.getElementById("zoom-plus")
  this.zoomPlusPlusNode = document.getElementById("zoom-plusplus")

  this.updateZoom()

  this.fps = 0

  this.initControlsListeners()
  this.initCaptions()


  // Fullscreen
  UI.updateFullscreen()

  // Stats (external add-on)
  this.stats = new Stats()
  if (this.stats) {
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.dom.id = "stats"
    document.body.appendChild(this.stats.dom)
  }
  this.statsNode = document.getElementById("stats")
  UI.updateStats()
}
UI.initControlsListeners = function () {

  this.zoomMinusMinusNode.addEventListener("click", () => {
    Bub.updateZoomClick("minusminus")
    UI.updateZoom()
  })
  this.zoomMinusNode.addEventListener("click", () => {
    Bub.updateZoomClick("minus")
    UI.updateZoom()
  })
  this.zoomPlusNode.addEventListener("click", () => {
    Bub.updateZoomClick("plus")
    UI.updateZoom()
  })
  this.zoomPlusPlusNode.addEventListener("click", () => {
    Bub.updateZoomClick("plusplus")
    UI.updateZoom()
  })

  // Wheel zoom
  Array.from(this.canvasesNodes).forEach(el => {
    el.addEventListener("wheel", ev => {
      ev.preventDefault()
      Bub.updateZoomWheel(ev.deltaY)
      UI.updateZoom()
      Bub.clearCanvases()
    })
  })

  // Offset
  UI.dragging = false
  UI.dragX = null
  UI.dragY = null
  UI.lastXoffset = Bub.xOffset
  UI.lastYoffset = Bub.yOffset

  // 3D drag pointer down
  Array.from(this.canvasesNodes).forEach(el => {
    el.addEventListener("pointerdown", ev => {
      UI.dragging = true
      UI.dragX = ev.clientX
      UI.dragY = ev.clientY
    })
  })
  // 3D drag pointer move
  window.addEventListener("pointermove", ev => {
    if (UI.dragging) {
      let dx = ev.clientX - UI.dragX
      let dy = ev.clientY - UI.dragY
      Bub.xOffset = UI.lastXoffset + 0.01 * dx
      Bub.yOffset = UI.lastYoffset + 0.01 * dy
    }
  })
  // 3D drag pointer up
  window.addEventListener("pointerup", ev => {
    UI.dragging = false
    UI.dragX = null
    UI.dragY = null
    UI.lastXoffset = Bub.xOffset
    UI.lastYoffset = Bub.yOffset
    Bub.clearCanvases()
  })

  // Fullscreen toggle (space bar)
  window.addEventListener("keydown", ev => {
    if (ev.code == "Space") {
      ev.preventDefault()
    }
  })
  window.addEventListener("keyup", ev => {
    if (ev.code == "Space") {
      ev.preventDefault()
      Bub.toggleFullscreen()
      Bub.updateFullscreen()
      UI.updateFullscreen()
      Dust.killAll()
    }
    else if (ev.code == "ArrowLeft" && Bub.isFullscreen) {
      ev.preventDefault()
      Bub.activeCanvasID = (Bub.activeCanvasID + 2 * Bub.canPop - 1) % Bub.canPop
      UI.updateFrontCaption()
      Bub.frontCtx.clearRect(0, 0, Bub.fullWidth, Bub.fullHeight)
    }
    else if (ev.code == "ArrowRight" && Bub.isFullscreen) {
      ev.preventDefault()
      Bub.activeCanvasID = (Bub.activeCanvasID + 2 * Bub.canPop + 1) % Bub.canPop
      UI.updateFrontCaption()
      Bub.frontCtx.clearRect(0, 0, Bub.fullWidth, Bub.fullHeight)
    }
  })
}
UI.initCaptions = function () {
  this.captions = [
    "2D",
    "3D",
    "3D depth",
    "3D aura",
    "Silhouette",
    "Painting",
    "Circles",
    "Vitruvian",
    "Energy",
    "Aura Energy",
    "Grid",
    "Grid Energy",
    "Rain",
    "Attraction",
    "Vortex",
    "Tempest",
    "Trails",
    "Trails Gravity",
    "Magnetic"
  ]
  for (let id = 0; id < Bub.canPop; id++) {
    let caption = ""
    if (id < this.captions.length) {
      caption = this.captions[id]
    }
    document.getElementById("can-" + id + "-caption").innerHTML = caption
  }

  // Toggle visibility depending on url param
  if (Init.captions != undefined) {
    this.frontCaptionNode.classList.toggle("hidden", Init.captions == 0)
  }
}
UI.updateFullscreen = function () {
  Bub.htmlNode.classList.toggle("fullscreen", Bub.isFullscreen)
  this.updateFrontCaption()
}
UI.updateFrontCaption = function () {
  document.querySelector("#front-layer .caption").innerHTML = UI.captions[Bub.activeCanvasID]
}
UI.updateZoom = function () {
  this.zoomValueNode.innerHTML = Bub.zoom
}
UI.updateFPS = function () {
  this.fpsNode.innerHTML = Bub.fps
}
UI.updateStats = function () {
  if (Init.stats) {
    this.statsNode.classList.toggle("visible", Init.stats == 1)
  }
}

// Utils
let Utils = {}
Utils.segmentAngleRad = (Xstart, Ystart, Xtarget, Ytarget, realOrWeb) => {
	/**
	 * @param {Number} Xstart X value of the segment starting point
	 * @param {Number} Ystart Y value of the segment starting point
	 * @param {Number} Xtarget X value of the segment target point
	 * @param {Number} Ytarget Y value of the segment target point
	 * @param {Boolean} realOrWeb true if Real (Y towards top), false if Web (Y towards bottom)
	 * @returns {Number} Angle between 0 and 2PI
	 */
	let result// Will range between 0 and 2PI
	if (Xstart == Xtarget) {
		if (Ystart == Ytarget) {
			result = 0 
		} else if (Ystart < Ytarget) {
			result = Math.PI/2
		} else if (Ystart > Ytarget) {
			result = 3*Math.PI/2
		} else {}
	} else if (Xstart < Xtarget) {
		result = Math.atan((Ytarget - Ystart)/(Xtarget - Xstart))
	} else if (Xstart > Xtarget) {
		result = Math.PI + Math.atan((Ytarget - Ystart)/(Xtarget - Xstart))
	}
	
	result = (result + 2*Math.PI)%(2*Math.PI)
	
	if (!realOrWeb) {
		result = 2*Math.PI - result
	}
	
	return result
}

// Main
let frame = () => {
  UI.stats.begin()

  // Compute bubble data
  if (Bub.step % 1 == 0) {
    Bub.update()
  }
  
  // Draw
  if (Bub.step % 1 == 0) {
    if (Bub.isFullscreen) {
      // Draw only active canvas in fullscreen
      Bub.draw(Bub.activeCanvasID, Bub.frontCtx)
    } else {
      // Draw all canvases in mosaic view
      for (let id = 0; id < Bub.canPop; id++) {
        let ctx = Bub.isFullscreen ? Bub.frontCtx : Bub.ctxs[id]
        Bub.draw(id, ctx)
      }
    }
    
  }

  UI.stats.end()

  //if (Bub.step % 5 == 0) UI.updateFPS()

  window.requestAnimationFrame(frame)
}
Bub.setup()
Dust.setup()
UI.setup()
frame()
