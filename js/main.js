/**
 * ANDRIX ® 2026
 */

let Bub = {}
let UI = {}
Bub.setup = function () {
  const inner = window.innerWidth
  let size = inner * (inner > 600 ? 0.42 : 0.97)
  let dpr = window.devicePixelRatio
  this.width = size
	this.height = size * 9 / 16
  
  let body = document.getElementsByTagName("body")[0]

  this.cans = []
  this.ctxs = []
  this.canPop = 7
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
    body.appendChild(can)
  }

	this.dataToImageRatio3D = this.width / 5
  this.xC = this.width / 2
  this.yC = this.height / 2
	
	// Depth properties in 3D world
	this.cameraZ = 3000
	this.zNearPlan = 1500
	this.zFarPlan = -10000

  this.zoom = 2000
  this.xOffset = -10
  this.yOffset = -10

  this.step = 0

  this.isBubbleReady = false
  this.bubble = []
  for (let i = 0; i < 10; i++) {
    this.bubble.push({ x: 0, y: 0, z: 0 })
  }
}
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
}
Bub.updateZoomClick = (type) => {
  if (type == "minusminus") Bub.zoom = Math.round(Bub.zoom * 0.5)
  if (type == "minus") Bub.zoom = Math.round(Bub.zoom * 0.85)
  if (type == "plus") Bub.zoom = Math.round(Bub.zoom * 20/17)
  if (type == "plusplus") Bub.zoom = Math.round(Bub.zoom * 2)
}
Bub.updateZoomWheel = function (deltaY) {
  Bub.zoom += -2.5 * deltaY
}
UI.updateZoom = function () {
  this.zoomValueNode.innerHTML = Bub.zoom
}
UI.updateFPS = function (deltaTime) {
  this.fps = Math.round(1000 / deltaTime)
  this.fpsNode.innerHTML = this.fps
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
Bub.draw0 = function () {
  let ctx = this.ctxs[0]
  ctx.clearRect(0, 0, this.width, this.height)

  ctx.beginPath()
  
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
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
Bub.draw1 = function () {
  let ctx = this.ctxs[1]
  ctx.clearRect(0, 0, this.width, this.height)

  ctx.beginPath()
  
  let zRescale = 2000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    //ctx.arc(pt.x, pt.y, 3 * xyr.r, 0, 2 * Math.PI, false)
    //ctx.fill()
    ctx.lineWidth = .15 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
    ctx.stroke()
  }
  
  ctx.closePath()

  this.drawBarycenter(ctx)
}
Bub.draw2 = function () {
  let ctx = this.ctxs[2]
  ctx.fillStyle = "#00000002"
  ctx.fillRect(0, 0, this.width, this.height)

  ctx.beginPath()
  
  let zRescale = 2000
  ctx.moveTo(this.bubble[0].x, this.bubble[0].y)
  
  ctx.fillStyle = "hsl(" + this.step/5 + ", 60%, 40%)"
  for (let b = 0; b < this.bubble.length; b++) {
    let startIndex = b == 0 ? this.bubble.length - 1 : (b - 1)
    ctx.beginPath()
    let bubStart = this.bubble[startIndex]
    let bubEnd = this.bubble[b]
    let xyrStart = Bub.dataXYZtoCanvasXYR(bubStart.x, bubStart.y, bubStart.z * zRescale)
    let xyrEnd = Bub.dataXYZtoCanvasXYR(bubEnd.x, bubEnd.y, bubEnd.z * zRescale)
    ctx.moveTo(xyrStart.x, xyrStart.y)
    ctx.lineTo(xyrEnd.x, xyrEnd.y)
    //ctx.arc(pt.x, pt.y, 3 * xyr.r, 0, 2 * Math.PI, false)
    //ctx.fill()
    ctx.lineWidth = .1 * Math.sqrt((xyrStart.r + xyrEnd.r) / 2)
    ctx.stroke()
  }
  
  ctx.closePath()
}
Bub.draw3 = function () {
  let ctx = this.ctxs[3]
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
Bub.draw4 = function () {
  //this.ctxs[4].clearRect(0, 0, this.cans[4].width, this.cans[4].height)

  let ctx = this.ctxs[4]
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
  
  ctx.clearRect(0, 0, this.width, this.height)

  this.drawBarycenter(ctx)

  let rii = this.getBubbleRadii()
  let bary = this.getBubbleBarycenter()
  let baryXyr = this.dataXYZtoCanvasXYR(bary.x, bary.y, bary.z)

  ctx.strokeStyle = "#FFFA"

  let rScale = 200

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
  ctx.lineWidth = 2
  ctx.arc(baryXyr.x, baryXyr.y, rScale * rii.rMax, 0, 2 * Math.PI, false)
  ctx.stroke()
  ctx.closePath()
  

}
Bub.clearCanvases = function () {
  this.ctxs[2].clearRect(0, 0, this.width, this.height)
  this.ctxs[4].clearRect(0, 0, this.width, this.height)
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
Bub.update = function () {
  this.step++
}
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
  }

  let endTime = new Date().getTime()

  UI.updateFPS(endTime - startTime)

  window.requestAnimationFrame(frame)
}

Bub.setup()
UI.setup()
frame()
