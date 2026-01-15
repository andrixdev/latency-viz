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
  this.canPop = 14
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

  this.zoom = 8000
  this.xOffset = 0
  this.yOffset = 0

  this.step = 0

  // Bubble init
  this.bubble = []
  for (let i = 0; i < 10; i++) {
    this.bubble.push({ x: 0, y: 0, z: 0 })
  }

  // Barycenter
  this.bary = { x: 0, y: 0, z: 0 }

  // Bubble energy
  this.radii = 0
  this.lastRadii = 0
  this.historyLength = 6
  this.historyIndex = 0
  this.history = []
  this.energy = 0 // Average of history

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
  Bub.bubble = []
  for (let i = 1; i <= 25; i++) {
    let pt = bubbleFrame["point" + i]
    Bub.bubble.push({
      x: pt.x - 0.5,
      y: pt.y - 0.5,
      z: pt.z - 0.5
    })
  }
}
Bub.updateBarycenter = function () {
  // Compute barycenter
  let bary = {x: 0, y: 0, z: 0}

  this.bubble.forEach(pt => {
    bary.x += pt.x
    bary.y += pt.y
    bary.z += pt.z
  })

  bary.x /= this.bubble.length
  bary.y /= this.bubble.length
  bary.z /= this.bubble.length

  this.bary = bary
}
Bub.getBubbleRadii = function () {
  let rMin = 999999
  let rMax = 0
  let rAverage
  let rSum = 0

  let bary = this.bary
  this.bubble.forEach(pt => {
    let dx = bary.x - pt.x
    let dy = bary.y - pt.y
    let dz = bary.z - pt.z
    let dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
    rSum += dist

    if (dist > rMax) rMax = dist
    if (dist < rMin) rMin = dist
  })

  rAverage = rSum / this.bubble.length

  return { rAvg: rAverage, rMin: rMin, rMax: rMax }
}
Bub.getHistoryAverage = function () {
  if (!this.history.length) {
    console.log("Empty energy history, filling with zeros...")
    for (let i = 0; i < this.historyLength; i++) {
      this.history.push(0)
    }
  }

  let nrj = 0
  this.history.forEach(h => { nrj += h })
  nrj /= this.historyLength

  return nrj
}
Bub.updateBubbleEnergy = function () {
  let alpha = 25
  let beta = 1
  let gamma = 0

  this.lastRadii = this.radii
  this.radii = this.getBubbleRadii()

  // E = variation of weighted average of squares

  let getSquareSum = (rii) => {
    return 1 / (alpha + beta + gamma) * (alpha * Math.pow(rii.rMin, 2) + beta * Math.pow(rii.rAvg, 2) + gamma * Math.pow(rii.rMax, 2))
  }

  let newSquareSum = getSquareSum(this.radii)
  let lastSquareSum = getSquareSum(this.lastRadii)
  let E = Math.abs(newSquareSum - lastSquareSum)
  let sigma = 0.6
  let visualE = 3 * Math.pow(10000 * E, sigma)

  // If something changed (non-zero energy), push to one of the history values
  if (E > 0) {
    this.historyIndex = (this.historyIndex + 1) % this.historyLength
    this.history[this.historyIndex] = visualE

    // Assign average of history to energy value
    this.energy = this.getHistoryAverage()
  }
  
}
Bub.draw = function (id, ctx) {
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
  else console.warn("id of Bub.draw() method not recognized: " + id)
}
Bub.draw0 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"
  
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xStart = this.xC + bubStart.x * this.w
    let yStart = this.yC + bubStart.y * this.h
    let xEnd = this.xC + bubEnd.x * this.w
    let yEnd = this.yC + bubEnd.y * this.h
    ctx.moveTo(xStart, yStart)
    ctx.lineTo(xEnd, yEnd)
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.draw1 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"
  
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z)
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    //ctx.arc(pt.x, pt.y, 3 * xyr.r, 0, 2 * Math.PI, false)
    //ctx.fill()
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.draw2 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFD"

  let zRescale = 5000

  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)

    ctx.beginPath()
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.lineWidth = 0.15 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
    ctx.stroke()
  }
  
  ctx.closePath()

  this.drawBarycenter(ctx)
}
Bub.draw3 = function (ctx) {
  this.drawAura(ctx, "iso")
}
Bub.draw4 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  let zRescale = 2000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)

  ctx.beginPath()
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.fillStyle = "white"
    ctx.fill()
  }
  
  ctx.closePath()
}
Bub.draw5 = function (ctx) {
  let zRescale = 3000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)

  ctx.beginPath()
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    let bubEnd = this.bubble[b]
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.fillStyle = "white"
    ctx.fill()
  }
  
  ctx.closePath()
}
Bub.draw6 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii()
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
Bub.draw7 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii()
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
Bub.draw9 = function (ctx) {
  this.drawAura(ctx, "energy")
}
Bub.draw10 = function (ctx) {
  this.drawDotField(ctx, "iso")
}
Bub.draw11 = function (ctx) {
  this.drawDotField(ctx, "energy")
}
Bub.draw12 = function (ctx) {
  
}
Bub.draw13 = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
}
Bub.drawAura = function (ctx, mode) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  
  let bary = this.bary

  let zRescale = 5000
  ctx.strokeStyle = mode == "iso" ? "#FFFA" : "hsl(210, 80%, 50%)"
  let auraScale = mode == "iso" ? 1 : (0.08 + this.energy * 0.08)

  for (let aura = 2; aura <= 12; aura++) {
    let auraStep = aura / 12 * auraScale
    for (let b = 0; b < this.bubble.length; b++) {
      let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
      let bubStart = this.bubble[startIndex]
      let bubEnd = this.bubble[b]
      
      let x1 = bary.x + (bubStart.x - bary.x) * auraStep
      let y1 = bary.y + (bubStart.y - bary.y) * auraStep
      let z1 = bary.z + ((bubStart.z - bary.z) * auraStep) * zRescale
      
      let x2 = bary.x + (bubEnd.x - bary.x) * auraStep
      let y2 = bary.y + (bubEnd.y - bary.y) * auraStep
      let z2 = bary.z + ((bubEnd.z - bary.z) * auraStep) * zRescale

      let xyrStart = Bub.dataXYZtoCanvasXYR(x1, y1, z1)
      let xyrEnd = Bub.dataXYZtoCanvasXYR(x2, y2, z2)

      ctx.beginPath()
      ctx.moveTo(xyrStart.x, xyrStart.y)
      ctx.lineTo(xyrEnd.x, xyrEnd.y)
      ctx.lineWidth = .15 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
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

  let bary = Bub.bary
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
  Bub.ctxs[5].clearRect(0, 0, Bub.fullWidth, Bub.fullHeight)
}
Bub.drawBarycenter = function (ctx) {
  let bary = this.bary

  let xyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)
  ctx.beginPath()
  ctx.arc(xyr.x, xyr.y, .05 * xyr.r, 0, 2 * Math.PI, false)
  ctx.fillStyle = "red"
  ctx.fill()
  ctx.closePath()
}
Bub.dataXYZtoCanvasXYR = function (x, y, z) {
	// inputted xyz is in particles motion space
	// Outputted XYR is the XY position on the 2D canvas
	// Plus the size at which the dot/line should be drawn
	
  let depthEffect = 16

	const zCbaseRad = 1.0// A particle positioned at (0, 0, 0) will have radius zCbaseRad
	// Size difference law between frontmost and backmost particles
	let dE = 2 * Math.floor(depthEffect / 2)
	
	// From base [-500, 500] to [min(w,h), min(w,h)], here min = w for portrait
	let xx = this.xC + this.xOffset + this.zoom * this.dataToImageRatio3D * (x) / (this.cameraZ - z)
	let yy = this.yC + this.yOffset + this.zoom * this.dataToImageRatio3D * (y) / (this.cameraZ - z)
	let rr = zCbaseRad * Math.pow((0 - this.cameraZ) / (this.cameraZ - z), dE) * this.dataToImageRatio3D

	rr = Math.min(rr, 100 * this.dataToImageRatio3D)

	return { x: xx, y: yy, r: rr }
}

// Particle system
Dust.setup = function () {
  this.dustPop = 200
  this.particles = []

  for (let i = 0; i < this.dustPop; i++) {
    this.particles.push({
      age: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    })
  }
}
Dust.move = function () {
  let dt = 0.1
  this.particles.forEach(p => {
    let xAcc = 0
    let yAcc = 0
    p.vx += xAcc * dt
    p.vy += yAcc * dt
    p.x += p.vx * dt
    p.y += p.vy * dt

    this.particles.age++
  })
}
Dust.draw = function (ctx) {
  ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
  ctx.strokeStyle = "#FFFA"
  this.particles.forEach(p => {
    ctx.beginPath()
    let x = 0
    let y = 0
    ctx.arc(x, y, 2, 0, 2 * Math.PI, false)
    ctx.stroke()
    ctx.closePath()
  })
}

// Bub UI
UI.setup = function () {
  // Misc
  this.fpsNode = document.getElementById("fps")
  this.canvasesNodes = document.getElementsByTagName("canvas")

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

  // Pointer down
  Array.from(this.canvasesNodes).forEach(el => {
    el.addEventListener("pointerdown", ev => {
      UI.dragging = true
      //console.log("Dragging")
      UI.dragX = ev.clientX
      UI.dragY = ev.clientY
    })
  })
  // Pointer move
  window.addEventListener("pointermove", ev => {
    if (UI.dragging) {
      let dx = ev.clientX - UI.dragX
      let dy = ev.clientY - UI.dragY
      Bub.xOffset = UI.lastXoffset + dx
      Bub.yOffset = UI.lastYoffset + dy
    }
  })
  // Pointer up
  window.addEventListener("pointerup", ev => {
    UI.dragging = false
    UI.dragX = null
    UI.dragY = null
    UI.lastXoffset = Bub.xOffset
    UI.lastYoffset = Bub.yOffset
    Bub.clearCanvases()
    //console.log("Dragging off")
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
    }
    else if (ev.code == "ArrowLeft" && Bub.isFullscreen) {
      ev.preventDefault()
      Bub.activeCanvasID = (Bub.activeCanvasID + 2 * Bub.canPop - 1) % Bub.canPop
      UI.updateFrontCaption()
      Bub.frontCtx.clearRect(0, 0, this.fullWidth, this.fullHeight)
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
    "Nada",
    "Nada"
  ]
  for (let id = 0; id < Bub.canPop; id++) {
    let caption = ""
    if (id < this.captions.length) {
      caption = this.captions[id]
    }
    document.getElementById("can-" + id + "-caption").innerHTML = caption
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

// Main 
let stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom )


let frame = () => {
  //let startTime = performance.now()
  stats.begin()

  Bub.update()

  // Compute for all
  if (Bub.step % 1 == 0) {
    Bub.updateBubbleEnergy()
    Bub.updateBarycenter()
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

  //let endTime = performance.now()
  stats.end()

  //Bub.updateFPS(endTime - startTime)

  if (Bub.step % 5 == 0) UI.updateFPS()

  window.requestAnimationFrame(frame)
}

Bub.setup()
Dust.setup()
UI.setup()
frame()
