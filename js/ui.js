/**
 * UI
 * UI
 * 
 * Latency visualization interface
 * ANDRIX ® 2026
 */

let UI = {}

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
    "2D Average",
    "3D",
    "3D Average",
    "3D Depth",
    "Silhouette",
    "Painting",
    "3D Aura",
    "3D Aura Energy",
    "Energy",
    "Direction",
    "Circles",
    "Vitruvian",
    "Grid",
    "Grid Energy",
    "Sphere",
    "Sphere Energy",
    "Rain",
    "Attraction",
    "Vortex",
    "Vortex Energy",
    "Tempest",
    "Hybrid",
    "Trails",
    "Trails Gravity",
    "Magnetic",
    "Multipole"
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
