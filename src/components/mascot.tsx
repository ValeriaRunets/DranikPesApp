/**
 * Маскот приложения — мультяшный Драник, длинношёрстная такса окраса мерль:
 * серебристо-серая шёрстка с тёмными мраморными пятнами, кремовая мордочка
 * и грудка, длинные тёмные уши, тёмное пятнышко вокруг левого глаза.
 */

const C = {
  cream: '#f6ead4', // мордочка, грудка, лапки
  creamLight: '#fbf3e2', // морда вокруг носа
  grey: '#aab0be', // основная шёрстка
  greyMid: '#8b93a8', // светлые пятна на ушах
  dark: '#4e5566', // уши, тёмные пятна
  darker: '#3c4252', // мраморные пятна
  ink: '#332a24', // глаза, нос, рот
  blush: '#f2b3a4',
  tongue: '#ef8a8a',
  collar: '#f59e0b',
  collarDark: '#d97706',
}

export type Mood = 'normal' | 'happy'

/** Голова Драника. Рисуется в координатах ~(0,0)–(220,210), центр морды ~(110,120). */
function Head({ mood = 'normal' }: { mood?: Mood }) {
  return (
    <g>
      {/* уши (позади головы) */}
      <g fill={C.dark}>
        <path d="M62 78 C34 84 26 128 33 162 C36 178 46 186 58 180 C74 172 80 128 76 96 C74 82 70 76 62 78 Z" />
        <path d="M158 78 C186 84 194 128 187 162 C184 178 174 186 162 180 C146 172 140 128 144 96 C146 82 150 76 158 78 Z" />
      </g>
      {/* светлые прядки на ушах */}
      <g fill={C.greyMid} opacity="0.85">
        <ellipse cx="50" cy="120" rx="7" ry="14" transform="rotate(8 50 120)" />
        <ellipse cx="58" cy="152" rx="5" ry="10" transform="rotate(14 58 152)" />
        <ellipse cx="170" cy="120" rx="7" ry="14" transform="rotate(-8 170 120)" />
        <ellipse cx="162" cy="152" rx="5" ry="10" transform="rotate(-14 162 152)" />
      </g>
      {/* голова */}
      <ellipse cx="110" cy="120" rx="63" ry="57" fill={C.cream} />
      {/* серая «шапочка» с мысиком на лбу */}
      <path
        d="M49 112 C49 84 72 62 110 62 C148 62 171 84 171 112
           C165 106 154 100 146 102 C136 104 128 112 121 106
           C116 101 112 96 110 96 C108 96 104 101 99 106
           C92 112 84 104 74 102 C66 100 55 106 49 112 Z"
        fill={C.grey}
      />
      {/* мраморные пятна на шапочке */}
      <g fill={C.darker}>
        <ellipse cx="86" cy="76" rx="8" ry="5" transform="rotate(-14 86 76)" />
        <ellipse cx="126" cy="72" rx="10" ry="6" transform="rotate(10 126 72)" />
        <ellipse cx="106" cy="84" rx="5" ry="3.5" transform="rotate(-6 106 84)" />
        <ellipse cx="146" cy="86" rx="5" ry="3.5" transform="rotate(16 146 86)" />
      </g>
      {/* щёчки */}
      <ellipse cx="74" cy="138" rx="9" ry="5.5" fill={C.blush} opacity="0.55" />
      <ellipse cx="146" cy="138" rx="9" ry="5.5" fill={C.blush} opacity="0.55" />
      {/* глаза */}
      {mood === 'happy' ? (
        <g stroke={C.ink} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M74 114 q8 -9 16 0" />
          <path d="M131 114 q8 -9 16 0" />
        </g>
      ) : (
        <g>
          <circle cx="82" cy="113" r="7.5" fill={C.ink} />
          <circle cx="139" cy="113" r="7.5" fill={C.ink} />
          <circle cx="84.5" cy="110.5" r="2.6" fill="#fff" />
          <circle cx="141.5" cy="110.5" r="2.6" fill="#fff" />
        </g>
      )}
      {/* морда */}
      <ellipse cx="110" cy="150" rx="31" ry="22" fill={C.creamLight} />
      <ellipse cx="110" cy="139" rx="11.5" ry="8.5" fill={C.ink} />
      <ellipse cx="106.5" cy="136.5" rx="3" ry="2" fill="#fff" opacity="0.7" />
      {/* рот */}
      {mood === 'happy' ? (
        <g>
          <path
            d="M96 150 q14 16 28 0 q-6 12 -14 12 q-8 0 -14 -12 Z"
            fill={C.ink}
          />
          <path d="M103 158 q7 8 14 0 l0 4 q-7 7 -14 0 Z" fill={C.tongue} />
          <path d="M104 158 q6 6 12 0 v6 q-6 6 -12 0 Z" fill={C.tongue} />
        </g>
      ) : (
        <g stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M110 147 v7" />
          <path d="M110 154 q-8 9 -17 3" />
          <path d="M110 154 q8 9 17 3" />
        </g>
      )}
    </g>
  )
}

/** Портрет для шапки приложения и иконки */
export function DranikFace({
  mood = 'normal',
  className,
}: {
  mood?: Mood
  className?: string
}) {
  return (
    <svg viewBox="14 52 192 140" className={className} role="img" aria-label="Драник">
      <Head mood={mood} />
    </svg>
  )
}

/** Драник сидит — для пустых состояний и онбординга */
export function DranikSitting({
  mood = 'normal',
  className,
}: {
  mood?: Mood
  className?: string
}) {
  return (
    <svg viewBox="0 30 240 260" className={className} role="img" aria-label="Драник сидит">
      <DranikSittingInner mood={mood} />
    </svg>
  )
}

/** Радостный Драник — плашка стрика и моменты успеха */
export function DranikHappy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 30 240 260" role="img" aria-label="Драник радуется" className={className}>
      <g>
        <g fill={C.collar} opacity="0.9">
          <path d="M28 96 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" />
          <path d="M212 80 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
          <path d="M206 170 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
        </g>
      </g>
      <DranikSittingInner mood="happy" />
    </svg>
  )
}

/** Внутренности сидящего Драника без обёртки svg — для композиции */
function DranikSittingInner({ mood }: { mood: Mood }) {
  return (
    <g>
      <path
        d="M208 238 C238 230 250 202 246 182 C243 168 232 166 229 176 C225 190 218 214 196 226 Z"
        fill={C.dark}
      />
      <ellipse cx="174" cy="238" rx="52" ry="34" fill={C.grey} />
      <ellipse cx="192" cy="232" rx="10" ry="6" fill={C.darker} transform="rotate(-12 192 232)" />
      <ellipse cx="166" cy="248" rx="7" ry="4.5" fill={C.darker} transform="rotate(8 166 248)" />
      <path
        d="M78 180 C74 232 92 262 146 266 C186 268 214 254 216 232
           C218 210 196 196 166 190 C140 186 108 178 78 180 Z"
        fill={C.grey}
      />
      <ellipse cx="192" cy="212" rx="11" ry="6" fill={C.darker} transform="rotate(14 192 212)" />
      <ellipse cx="154" cy="200" rx="8" ry="5" fill={C.darker} transform="rotate(-10 154 200)" />
      <path
        d="M82 168 C64 210 64 246 74 262 C80 270 96 272 102 262
           C106 254 106 240 106 232 C110 244 110 256 116 264
           C122 272 138 270 142 260 C150 238 144 196 124 172 Z"
        fill={C.cream}
      />
      <g stroke="#e0cfae" strokeWidth="2.6" strokeLinecap="round">
        <path d="M82 262 v6" />
        <path d="M92 264 v6" />
        <path d="M122 262 v6" />
        <path d="M132 264 v6" />
      </g>
      <path d="M66 168 q40 26 82 10 l-4 14 q-40 14 -80 -10 Z" fill={C.collar} />
      <circle cx="106" cy="188" r="7" fill={C.collarDark} />
      <circle cx="106" cy="188" r="3" fill="#ffd88a" />
      <g transform="translate(30 24) scale(0.78)">
        <Head mood={mood} />
      </g>
    </g>
  )
}
