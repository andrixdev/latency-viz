/**
 * ANDRIX ® 2026
 */

// Particle system
let Dust = {}

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
    hue: 15 + 35 * Math.random(),
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
  let isVortexStyle = (style == "vortex" || style == "vortex-energy" || style == "tempest" || style == "hybrid")
  let isMagneticStyle = style == "magnetic" || style == "multipole"
  
  let vorticity = isVortexStyle ? 10 : (style == "attraction" ? 0.5 : 0)
  let mag = style == "magnetic" ? 20 : (style == "multipole" ? 40 : 0)
  let g = (style == "rain") ? 1 : (style == "trails-gravity" ? 2.5 : 0)
  let mu = style == "attraction" ? 30 : 0
  let rainRepulse = style == "rain" ? 2 : 0
  let attractionR0 = 0.01 * w
  let rainR0 = 0.015 * w
  let visc = isVortexStyle ? .1 : ((style == "magnetic" || style =="attraction") ? .05 : 0)

  if (style == "hybrid") {
    vorticity = .5
    mag = 4
    g = -.7
    mu = -1.5
    visc = 0.015
  }

  let baryXY = {
    x: Bub.xC + Bub.bary.x * w,
    y: Bub.yC + Bub.bary.y * h
  }

  // Update first eddy (barycenter)
  this.eddies[0].x = baryXY.x
  this.eddies[0].y = baryXY.y

  if (style == "tempest") this.moveEddies()

  this.particles.forEach(p => {
    // Dist to bary
    let dx = baryXY.x - p.x
    let dy = baryXY.y - p.y
    let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
    let xAcc = 0
    let yAcc = 0

    // Dist to center with offset (for multipole)
    let dxc = Bub.xC - p.x
    let dyc = (0.6 * Bub.h) - p.y
    let distc = Math.sqrt(Math.pow(dxc, 2) + Math.pow(dyc, 2))

    // Gravity
    yAcc += g

    // Attraction
    xAcc += mu * dx / Math.pow(dist / attractionR0, 2.0)
    yAcc += mu * dy / Math.pow(dist / attractionR0, 2.0)

    // Magnetic dipole
    let getMagneticAcceleration = (chosenDist, chosenDX, chosenDY) => {
      let multi = Math.pow(chosenDist, -5)
      let xAccMag = 3 * chosenDX * chosenDY * multi
      let yAccMag = (3 * chosenDY * chosenDY - chosenDist * chosenDist) * multi
      let accNorm = Math.sqrt(xAccMag * xAccMag + yAccMag * yAccMag)

      return {
        x: mag * xAccMag / accNorm,
        y: mag * yAccMag / accNorm
      }
    }
    let magAcc = getMagneticAcceleration(dist, dx, dy)
    xAcc += magAcc.x
    yAcc += magAcc.y

    // Multipole (extra magnetic dipole at center)
    if (style == "multipole") {
      let centralMagAcc = getMagneticAcceleration(distc, dxc, dyc)
      xAcc -= 1.4 * centralMagAcc.x
      yAcc -= 1.4 * centralMagAcc.y
      visc = .08
    }

    // Update velocities
    p.vx += xAcc * dt
    p.vy += yAcc * dt

    // Rain
    p.vx += -rainRepulse * Math.sign(dx) * Math.exp(-Math.pow(dist/rainR0, 0.5))

    // Vortices
    let nbOfEddies = style == "tempest" ? this.eddies.length : 1
    if (isVortexStyle) {
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
          
          
        let K = style == "tempest" ? (e == 0 ? 2 : 0.5) : 5
        if (style == "vortex-energy") {
          K *= (0.15 + Bub.energy / 2)
          r0 *= 0.1 * (0.1 + 1/200 * Bub.energy)
        }

        let radialVelocity = -0.003 * Math.abs(dx*dy)/3000,
          sigma = 100,
          azimutalVelocity = Math.exp(-Math.pow((r - r0) / sigma, 2))

          if (style == "vortex-energy") {
            sigma = 30
          }
        
        p.vx += vorticity * K * (radialVelocity * er.x + azimutalVelocity * eO.x)
        p.vy += vorticity * K * (radialVelocity * er.y + azimutalVelocity * eO.y)
      }
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
  } else if (style == "vortex-energy") {
    hue = 320
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
      lum = 10 + 0.7 * p.hue
    }
    else if (style == "trails-gravity") {
      hue = 160 + p.hue
      lum += 10 
    }
    else if (style == "hybrid") {
      hue = 150 + p.hue * 3
      sat = 50
    }
    ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, " + lum + "%)"
    ctx.fill()
    ctx.closePath()
  })
}
