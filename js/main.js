/**
 * ANDRIX ® 2026
 */

let Bub = {}
let UI = {}

// Bub logic
Bub.setup = function () {
  const inner = window.innerWidth
  let size = 540//inner * (inner > 600 ? 0.42 : 0.97)
  let dpr = window.devicePixelRatio
  this.width = size
	this.height = size * 9 / 16
  
  let body = document.getElementsByTagName("body")[0]

  this.cans = []
  this.ctxs = []
  this.canPop = 10
  for (let c = 0; c < this.canPop; c++) {
    let can = document.createElement("canvas")
    can.id = "can-" + c
    let ctx = can.getContext("2d")
    
    can.width = this.width * dpr
    can.height = this.height * dpr
    can.style.width = this.width + "px"
    can.style.height = this.height + "px"

    ctx.scale(dpr, dpr)

    // Retains pixel sharpness on scaled image
    ctx.imageSmoothingEnabled = false

    // Line properties
    ctx.lineCap = "round"
    ctx.fillStyle = "#FFFD"
    ctx.strokeStyle = "#FFF"
    ctx.lineWidth = 1

    this.ctxs.push(ctx)
    this.cans.push(can)
    let container = document.createElement("div")
    let caption = document.createElement("p")
    caption.id = can.id + "-caption"
    caption.classList = "caption"
    container.appendChild(can)
    container.appendChild(caption)
    body.appendChild(container)
  }

	this.dataToImageRatio3D = this.width / 5
  this.xC = this.width / 2
  this.yC = this.height / 2
	
	// Depth properties in 3D world
	this.cameraZ = 3000
	this.zNearPlan = 1500
	this.zFarPlan = -10000

  this.zoom = 10000
  this.xOffset = -150
  this.yOffset = -150

  this.step = 0

  this.isBubbleReady = false
  this.bubble = []
  for (let i = 0; i < 10; i++) {
    this.bubble.push({ x: 0, y: 0, z: 0 })
  }

  // Bubble energy
  this.bubbleRadii = 0
  this.lastBubbleRadii = 0
  this.historyLength = 6
  this.historyIndex = 0
  this.history = []
  this.energy = 0 // Average of history
}
Bub.update = function () {
  this.step++
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
  let newZoom = Math.max(2, Bub.zoom - 0.0025 * deltaY * Bub.zoom)
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
      Bub.bubble[nb - 1][coord] = param
    }
}
Bub.updateFrame = function (bubbleFrame) {
  Bub.bubble = []
  for (let i = 1; i <= 25; i++) {
    let pt = bubbleFrame["point" + i]
    Bub.bubble.push({
      x: pt.x,
      y: pt.y,
      z: pt.z
    })
  }
}
Bub.getBubbleBarycenter = function () {
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

  return bary
}
Bub.getBubbleRadii = function () {
  let rMin = 999999
  let rMax = 0
  let rAverage
  let rSum = 0

  let bary = this.getBubbleBarycenter()
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

  this.lastBubbleRadii = this.bubbleRadii
  this.bubbleRadii = this.getBubbleRadii()

  // E = variation of weighted average of squares

  let getSquareSum = (rii) => {
    return 1 / (alpha + beta + gamma) * (alpha * Math.pow(rii.rMin, 2) + beta * Math.pow(rii.rAvg, 2) + gamma * Math.pow(rii.rMax, 2))
  }

  let newSquareSum = getSquareSum(this.bubbleRadii)
  let lastSquareSum = getSquareSum(this.lastBubbleRadii)
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
Bub.draw0 = function () {
  let ctx = this.ctxs[0]

  ctx.clearRect(0, 0, this.width, this.height)
  
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xStart = this.xC + (bubStart.x - 0.5) * this.width
    let yStart = this.yC + (bubStart.y - 0.5) * this.height
    let xEnd = this.xC + (bubEnd.x - 0.5) * this.width
    let yEnd = this.yC + (bubEnd.y - 0.5) * this.height
    ctx.moveTo(xStart, yStart)
    ctx.lineTo(xEnd, yEnd)
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.draw1 = function () {
  let ctx = this.ctxs[1]
  ctx.clearRect(0, 0, this.width, this.height)
  
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
Bub.draw2 = function () {
  let ctx = this.ctxs[2]
  ctx.clearRect(0, 0, this.width, this.height)

  let zRescale = 2000

  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    ctx.lineWidth = .15 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
    ctx.stroke()
  }
  
  ctx.closePath()

  this.drawBarycenter(ctx)
}
Bub.draw3 = function () {
  this.drawAura(this.ctxs[3], "iso")
}
Bub.draw4 = function () {
  let ctx = this.ctxs[4]
  ctx.clearRect(0, 0, this.width, this.height)

  let zRescale = 2000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)

  ctx.beginPath()
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    //ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    //ctx.arc(pt.x, pt.y, 3 * xyr.r, 0, 2 * Math.PI, false)
    ctx.fillStyle = "white"
    ctx.fill()
  }
  
  ctx.closePath()
}
Bub.draw5 = function () {
  let ctx = this.ctxs[5]
  let zRescale = 3000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)

  ctx.beginPath()
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    //ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    //ctx.arc(pt.x, pt.y, 3 * xyr.r, 0, 2 * Math.PI, false)
    ctx.fillStyle = "white"
    ctx.fill()
  }
  
  ctx.closePath()
}
Bub.draw6 = function () {
  let ctx = this.ctxs[6]
  
  ctx.clearRect(0, 0, this.width, this.height)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii()
  let bary = this.getBubbleBarycenter()
  let baryXyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)

  ctx.strokeStyle = "#FFFA"

  let rScale = 200
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
Bub.draw7 = function () {
  let ctx = this.ctxs[7]
  
  ctx.clearRect(0, 0, this.width, this.height)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii()
  let bary = this.getBubbleBarycenter()
  let baryXyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)

  ctx.strokeStyle = "#FFFA"
  ctx.lineWidth = 2

  let rScale = 200

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
Bub.draw8 = function () {
  let ctx = this.ctxs[8]
  if (this.energy > 0) {
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.beginPath()
    let rad = this.energy
    ctx.arc(this.xC, this.yC, rad, 0, 2 * Math.PI, false)
    ctx.fill()
    ctx.closePath()
  }
}
Bub.draw9 = function () {
  this.drawAura(this.ctxs[9], "energy")
}
Bub.drawAura = function (ctx, mode) {
  ctx.clearRect(0, 0, this.width, this.height)
  
  let bary = this.getBubbleBarycenter()

  let zRescale = 1500
  ctx.strokeStyle = mode == "iso" ? "#FFFA" : "hsl(210, 80%, 50%)"
  let auraScale = mode == "iso" ? 1 : (0.08 + this.energy * 0.08)

  for (let aura = 2; aura <= 12; aura++) {
    let auraStep = aura / 12 * auraScale
    for (let b = 0; b < this.bubble.length; b++) {
      let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
      let bubStart = this.bubble[startIndex]
      let bubEnd = this.bubble[b]

      ctx.beginPath()
      
      let x1 = bary.x + (bubStart.x - bary.x) * auraStep
      let y1 = bary.y + (bubStart.y - bary.y) * auraStep
      let z1 = bary.z + ((bubStart.z - bary.z) * auraStep) * zRescale
      
      let x2 = bary.x + (bubEnd.x - bary.x) * auraStep
      let y2 = bary.y + (bubEnd.y - bary.y) * auraStep
      let z2 = bary.z + ((bubEnd.z - bary.z) * auraStep) * zRescale

      let xyrStart = Bub.dataXYZtoCanvasXYR(x1, y1, z1)
      let xyrEnd = Bub.dataXYZtoCanvasXYR(x2, y2, z2)

      ctx.moveTo(xyrStart.x, xyrStart.y)
      ctx.lineTo(xyrEnd.x, xyrEnd.y)
      ctx.lineWidth = .15 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
      ctx.stroke()
    }
  
    ctx.closePath()
  }

  this.drawBarycenter(ctx)
}

Bub.clearCanvases = function () {
  this.ctxs[5].clearRect(0, 0, this.width, this.height)
}
Bub.drawBarycenter = function (ctx) {
  let bary = this.getBubbleBarycenter()

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
}
UI.initCaptions = function () {
  document.getElementById("can-0-caption").innerHTML = "2D"
  document.getElementById("can-1-caption").innerHTML = "3D"
  document.getElementById("can-2-caption").innerHTML = "3D depth"
  document.getElementById("can-3-caption").innerHTML = "3D aura"
  document.getElementById("can-4-caption").innerHTML = "Silhouette"
  document.getElementById("can-5-caption").innerHTML = "Painting"
  document.getElementById("can-6-caption").innerHTML = "Circles"
  document.getElementById("can-7-caption").innerHTML = "Vitruvian"
  document.getElementById("can-8-caption").innerHTML = "Energy"
  document.getElementById("can-9-caption").innerHTML = "Aura Energy"
}
UI.updateZoom = function () {
  this.zoomValueNode.innerHTML = Bub.zoom
}
UI.updateFPS = function () {
  this.fpsNode.innerHTML = Bub.fps
}


// Main methods
let frame = () => {
  let startTime = new Date().getTime()

  Bub.update()

  if (Bub.step % 1 == 0) {
    Bub.draw0()
    Bub.draw1()
    Bub.draw2()
    Bub.draw3()
    Bub.draw4()
    Bub.draw5()
    Bub.draw6()
    Bub.draw7()
    Bub.draw8()
    Bub.draw9()
  }
  
  if (Bub.step % 1 == 0) {
    Bub.updateBubbleEnergy()
  }

  let endTime = new Date().getTime()

  Bub.updateFPS(endTime - startTime)

  if (Bub.step % 5 == 0) UI.updateFPS()

  window.requestAnimationFrame(frame)
}

Bub.setup()
UI.setup()
frame()
