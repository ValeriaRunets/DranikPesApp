import { DranikFace, DranikHappy, DranikSitting } from './mascot'

/** Страница-галерея маскота: /?mascot — для визуальной проверки поз */
export function MascotPreview() {
  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-cream p-6">
      <h1 className="text-xl font-extrabold">Маскот Драник</h1>
      <div className="grid grid-cols-2 gap-4">
        <Cell label="Портрет">
          <DranikFace className="w-40" />
        </Cell>
        <Cell label="Портрет (рад)">
          <DranikFace mood="happy" className="w-40" />
        </Cell>
        <Cell label="Сидит">
          <DranikSitting className="w-40" />
        </Cell>
        <Cell label="Радуется">
          <DranikHappy className="w-40" />
        </Cell>
      </div>
    </div>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-4 shadow-sm">
      {children}
      <span className="text-xs font-bold text-ink-soft">{label}</span>
    </div>
  )
}
