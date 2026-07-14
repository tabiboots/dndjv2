import { useEffect, useRef } from 'react'

// infinite-scroll sentinel (same pattern as MediaDrilldown): observe a trailing
// element and fire onVisible when it scrolls into view. retriggerKey (e.g. items
// count) recreates the observer so a sentinel that stays in view fires again.
export function useSentinel<T extends HTMLElement>(
  enabled: boolean,
  onVisible: () => void,
  retriggerKey: number
) {
  const ref = useRef<T>(null)
  const cbRef = useRef(onVisible)
  cbRef.current = onVisible

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) cbRef.current()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, retriggerKey])

  return ref
}
