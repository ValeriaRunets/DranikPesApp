import { useEffect } from 'react'
import type { ReactNode } from 'react'

/** Нижняя шторка — основной вид диалогов в приложении */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 animate-fade-in"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg animate-slide-up rounded-t-3xl bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <h2 className="mb-4 text-center text-lg font-extrabold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
