/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface SnackState {
  text: string
  actionLabel?: string
  onAction?: () => void
}

export function useSnackbar(timeoutMs = 5000) {
  const [snack, setSnack] = useState<SnackState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (s: SnackState) => {
      if (timer.current) clearTimeout(timer.current)
      setSnack(s)
      timer.current = setTimeout(() => setSnack(null), timeoutMs)
    },
    [timeoutMs],
  )

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setSnack(null)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return { snack, show, hide }
}

export function Snackbar({ snack, onHide }: { snack: SnackState | null; onHide: () => void }) {
  if (!snack) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex animate-pop items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-cream shadow-lg">
        <span>{snack.text}</span>
        {snack.actionLabel && (
          <button
            onClick={() => {
              snack.onAction?.()
              onHide()
            }}
            className="rounded-lg px-2 py-1 text-carrot underline-offset-2 hover:underline"
          >
            {snack.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
