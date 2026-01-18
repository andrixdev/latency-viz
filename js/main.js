/**
 * MAIN
 * Boot methods
 * 
 * Latency visualization interface
 * ANDRIX ® 2026
 */

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
