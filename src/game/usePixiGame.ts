import { useCallback, useEffect, useRef } from 'react'
import { Application, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import { DEFAULT_CONFIG } from './types'
import { useGame } from '../context/useGameContext'
import type { GameStatus } from '../context/types'
import { getRandomQuestion } from '../data/icebreakers'
import { usePixiInputs } from '../hooks/usePixiInputs'

type PipePair = Container & {
  gap: number
  scored?: boolean
}

const rainbowColors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc']

const computePipeGap = (score: number, difficulty: number) =>
  Math.max(DEFAULT_CONFIG.pipe.gap - score * 2 - difficulty * 8, 120)
const computePipeSpeed = (score: number, difficulty: number) =>
  Math.min(DEFAULT_CONFIG.pipe.speed + score * 0.035 + difficulty * 0.2, 5.5)
const computePipeSpacing = (score: number, difficulty: number) =>
  Math.max(DEFAULT_CONFIG.pipe.spacing - score * 1.2 - difficulty * 12, 210)

const intersects = (a: Rectangle, b: Rectangle) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

export const usePixiGame = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const catRef = useRef<Sprite | null>(null)
  const trailRef = useRef<Graphics | null>(null)
  const pipesRef = useRef<Container | null>(null)
  const backgroundRef = useRef<Graphics | null>(null)
  const velocityRef = useRef(0)
  const scoreRef = useRef(0)
  const lastReportedScoreRef = useRef(0)
  const elapsedRef = useRef(0)
  const difficultyRef = useRef(0)

  const { status, answered, end, setLiveScore, start } = useGame()

  const statusRef = useRef<GameStatus>(status)
  const answeredRef = useRef(answered)
  const endRef = useRef(end)
  const setLiveScoreRef = useRef(setLiveScore)
  const startRef = useRef(start)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    answeredRef.current = answered
  }, [answered])

  useEffect(() => {
    endRef.current = end
  }, [end])

  useEffect(() => {
    setLiveScoreRef.current = setLiveScore
  }, [setLiveScore])

  useEffect(() => {
    startRef.current = start
  }, [start])

  const syncLiveScore = useCallback(() => {
    if (statusRef.current !== 'running') return
    if (lastReportedScoreRef.current !== scoreRef.current) {
      lastReportedScoreRef.current = scoreRef.current
      setLiveScoreRef.current?.(scoreRef.current)
    }
  }, [])

  const handleFlap = useCallback(() => {
    if (statusRef.current === 'idle') {
      startRef.current?.()
      statusRef.current = 'running'
      elapsedRef.current = 0
      difficultyRef.current = 0
    }
    if (statusRef.current !== 'running') return
    velocityRef.current = DEFAULT_CONFIG.flapStrength
  }, [])

  usePixiInputs({ onFlap: handleFlap })

  const createCatTexture = useCallback(async () => {
    const graphic = new Graphics()
    graphic.roundRect(0, 0, 80, 60, 20).fill({ color: 0xf472b6 })
    graphic.roundRect(15, 10, 50, 40, 16).fill({ color: 0xffffff })
    graphic.circle(30, 30, 4).fill({ color: 0x0f172a })
    graphic.circle(50, 30, 4).fill({ color: 0x0f172a })
    graphic.roundRect(32, 40, 16, 6, 3).fill({ color: 0xfb7185 })
    graphic.star(70, 10, 5, 6).fill({ color: 0xfacc15 })

    const texture = appRef.current?.renderer.generateTexture(graphic)
    return texture || Texture.WHITE
  }, [])

  const createBackground = useCallback(() => {
    const bg = new Graphics()
    const width = window.innerWidth
    const height = window.innerHeight
    for (let i = 0; i < 110; i += 1) {
      const color = Math.random() > 0.5 ? 0xffffff : 0xfef3c7
      const size = Math.random() * 2.5 + 0.5
      const x = Math.random() * width
      const y = Math.random() * height
      bg.circle(x, y, size).fill({ color, alpha: Math.random() * 0.8 })
    }
    return bg
  }, [])

  const createPipePair = useCallback((centerY: number, gap: number) => {
    const container = new Container() as PipePair
    container.gap = gap
    const width = DEFAULT_CONFIG.pipe.width
    const topHeight = Math.max(24, centerY - gap / 2)
    const bottomY = Math.min(window.innerHeight - 24, centerY + gap / 2)
    const bottomHeight = Math.max(24, window.innerHeight - bottomY)

    const topPipe = new Graphics()
    topPipe.roundRect(0, 0, width, topHeight, 18).fill({ color: 0x1e1b4b })

    const bottomPipe = new Graphics()
    bottomPipe.roundRect(0, bottomY, width, bottomHeight + 40, 18).fill({ color: 0x312e81 })

    container.addChild(topPipe, bottomPipe)
    container.x = window.innerWidth + 100
    container.y = 0
    return container
  }, [])

  const checkPipeCollision = useCallback((cat: Sprite, pipe: PipePair) => {
    const catBounds = new Rectangle().copyFromBounds(cat.getBounds())
    return pipe.children.some((child) => {
      const childBounds = new Rectangle().copyFromBounds(child.getBounds())
      return intersects(catBounds, childBounds)
    })
  }, [])

  const resetGame = useCallback(() => {
    velocityRef.current = 0
    scoreRef.current = 0
    lastReportedScoreRef.current = 0
    elapsedRef.current = 0
    difficultyRef.current = 0
    if (catRef.current) {
      catRef.current.position.set(window.innerWidth * 0.2, window.innerHeight / 2)
      catRef.current.rotation = 0
    }
    if (pipesRef.current) {
      pipesRef.current.removeChildren()
    }
    syncLiveScore()
  }, [syncLiveScore])

  const handleGameOver = useCallback(() => {
    const question = getRandomQuestion(answeredRef.current)
    endRef.current?.(scoreRef.current, question)
    resetGame()
  }, [resetGame])

  const updateGame = useCallback((ticker: Ticker) => {
    const delta = ticker.deltaTime
    const cat = catRef.current
    const pipes = pipesRef.current
    const app = appRef.current
    const trail = trailRef.current
    const background = backgroundRef.current
    if (!cat || !pipes || !app || !trail) return
    if (statusRef.current !== 'running') return

    elapsedRef.current += ticker.deltaMS
    const targetDifficulty = Math.floor(elapsedRef.current / 10000)
    if (targetDifficulty > difficultyRef.current) {
      difficultyRef.current = targetDifficulty
    }

    const difficulty = difficultyRef.current

    velocityRef.current += DEFAULT_CONFIG.gravity * delta
    velocityRef.current = Math.min(velocityRef.current, DEFAULT_CONFIG.terminalVelocity)
    cat.y += velocityRef.current * delta
    cat.rotation = velocityRef.current * 0.035

    if (cat.y - cat.height / 2 < 0 || cat.y + cat.height / 2 > app.renderer.height) {
      handleGameOver()
      return
    }

    if (background) {
      background.alpha = 0.85 + 0.05 * Math.sin(performance.now() / 700)
    }

    trail.clear()
    for (let i = 0; i < rainbowColors.length; i += 1) {
      trail.lineStyle(8, parseInt(rainbowColors[i].replace('#', ''), 16), 0.85 - i * 0.12)
      trail.moveTo(cat.x - 60, cat.y + i * 7 - 14)
      trail.lineTo(cat.x - 160, cat.y + i * 7 - 14)
    }

    const pipeSpeed = computePipeSpeed(scoreRef.current, difficulty)
    const spacing = computePipeSpacing(scoreRef.current, difficulty)
    const pipePairs = pipes.children as PipePair[]

    for (let i = pipePairs.length - 1; i >= 0; i -= 1) {
      const pipe = pipePairs[i]
      pipe.x -= pipeSpeed * delta

      if (!pipe.scored && pipe.x + DEFAULT_CONFIG.pipe.width < cat.x) {
        pipe.scored = true
        scoreRef.current += 1
        syncLiveScore()
      }

      if (pipe.x < -DEFAULT_CONFIG.pipe.width * 2) {
        pipes.removeChild(pipe)
      }
    }

    const lastPipe = pipePairs[pipePairs.length - 1]
    if (!lastPipe || lastPipe.x < window.innerWidth - spacing) {
      const gap = computePipeGap(scoreRef.current, difficulty)
      const y =
        DEFAULT_CONFIG.pipe.minY + Math.random() * (DEFAULT_CONFIG.pipe.maxY - DEFAULT_CONFIG.pipe.minY)
      pipes.addChild(createPipePair(y, gap))
    }

    const hasCollision = pipePairs.some((pipe) => checkPipeCollision(cat, pipe))
    if (hasCollision) {
      handleGameOver()
    }
  }, [checkPipeCollision, createPipePair, handleGameOver, syncLiveScore])

  useEffect(() => {
    const host = canvasRef.current
    if (!host) return undefined

    const app = new Application({
      sharedTicker: false,
    })
    let cancelled = false
    let initialized = false
    let destroyed = false

    const initialize = async () => {
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
      })
      app.renderer.resize(window.innerWidth, window.innerHeight)
      initialized = true
      if (cancelled) {
        if (!destroyed) {
          app.destroy(true)
          destroyed = true
        }
        return
      }

      host.replaceChildren(app.canvas)
      appRef.current = app

      const background = createBackground()
      backgroundRef.current = background
      app.stage.addChild(background)

      const trail = new Graphics()
      trailRef.current = trail
      app.stage.addChild(trail)

      const pipes = new Container()
      pipesRef.current = pipes
      app.stage.addChild(pipes)

      const texture = await createCatTexture()
      if (cancelled) {
        if (!destroyed) {
          app.destroy(true)
          destroyed = true
        }
        return
      }

      const cat = new Sprite(texture)
      cat.anchor.set(0.5)
      cat.position.set(window.innerWidth * 0.2, window.innerHeight / 2)
      catRef.current = cat
      app.stage.addChild(cat)

      app.ticker.add(updateGame)
    }

    initialize()

    const handleResize = () => {
      if (!app.renderer) return
      const width = window.innerWidth
      const height = window.innerHeight
      app.renderer.resize(width, height)

      const previousBackground = backgroundRef.current
      if (previousBackground) {
        app.stage.removeChild(previousBackground)
        previousBackground.destroy()
      }

      const refreshedBackground = createBackground()
      backgroundRef.current = refreshedBackground
      app.stage.addChildAt(refreshedBackground, 0)

      if (catRef.current) {
        catRef.current.position.set(width * 0.2, height / 2)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
      if (!initialized || destroyed) {
        return
      }
      app.ticker?.remove(updateGame)
      catRef.current = null
      trailRef.current = null
      pipesRef.current = null
      backgroundRef.current = null
      appRef.current = null
      app.destroy(true)
      destroyed = true
    }
  }, [createBackground, createCatTexture, updateGame])

  return { canvasRef }
}
