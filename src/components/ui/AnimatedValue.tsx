import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook: animates a number from 0 → target using requestAnimationFrame.
 * Returns the current display value as a string.
 */
export function useCountUp(
  target: string,
  duration = 1200,
  delay = 0,
): string {
  const [display, setDisplay] = useState(target)
  const prevTarget = useRef(target)
  const rafRef = useRef<number>(0)

  const animate = useCallback((numericTarget: number, prefix: string, suffix: string, decimals: number, dur: number) => {
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / dur, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numericTarget * eased
      const formatted = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString()
      setDisplay(`${prefix}${formatted}${suffix}`)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    if (target === prevTarget.current && display !== '0') return
    prevTarget.current = target

    // Parse the target string to extract numeric value
    const match = target.match(/^([^0-9-]*)([-]?[\d,]+\.?\d*)(.*)$/)
    if (!match) {
      setDisplay(target)
      return
    }

    const prefix = match[1] ?? ''
    const numStr = (match[2] ?? '').replace(/,/g, '')
    const suffix = match[3] ?? ''
    const numericTarget = parseFloat(numStr)

    if (isNaN(numericTarget) || numericTarget === 0) {
      setDisplay(target)
      return
    }

    const decimals = numStr.includes('.') ? (numStr.split('.')[1]?.length ?? 0) : 0

    const timer = setTimeout(() => {
      animate(numericTarget, prefix, suffix, decimals, duration)
    }, delay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay, animate, display])

  return display
}

/**
 * Inline component for animated number display.
 */
export function AnimatedValue({
  value,
  duration = 1200,
  delay = 0,
  className = '',
}: {
  value: string
  duration?: number
  delay?: number
  className?: string
}) {
  const animated = useCountUp(value, duration, delay)
  return <span className={className}>{animated}</span>
}
