/**
 * Hand-drawn SVG plates for the landing page. Decorative imagery in the
 * product's own tokens: black canvas, amber engine metal, green means
 * the LP leg, red means the hedge, bone means the reading. All are
 * aria-hidden — the surrounding copy carries the meaning.
 */

function Floor({ x = 260, y = 296, rx = 196 }: { x?: number; y?: number; rx?: number }) {
  return (
    <ellipse cx={x} cy={y} rx={rx} ry={40} fill="var(--surface-raised)" />
  );
}

function CoinStack({
  x,
  y,
  coins,
  color,
  w = 44,
  h = 11,
}: {
  x: number;
  y: number;
  coins: number;
  color: string;
  w?: number;
  h?: number;
}) {
  const gap = 7;
  return (
    <g>
      {Array.from({ length: coins }).map((_, i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y - i * gap}
          rx={w / 2}
          ry={h / 2}
          fill={color}
          opacity={i === coins - 1 ? 0.85 : 0.5 + i * (0.4 / coins)}
        />
      ))}
      <ellipse
        cx={x}
        cy={y - (coins - 1) * gap}
        rx={w / 2}
        ry={h / 2}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        opacity={0.9}
      />
    </g>
  );
}

/** The hero plate: two venues netting into one amber vault. */
export function HeroPlate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 340" className={className} aria-hidden="true">
      <Floor x={260} y={300} rx={210} />

      {/* LP leg: a green book on the left */}
      <CoinStack x={110} y={266} coins={4} color="var(--green)" />
      <text x={110} y={306} textAnchor="middle" fontSize="11" fill="var(--text-dim)" fontFamily="var(--font-data), monospace">
        LP leg
      </text>

      {/* Hedge leg: a red arrow stance on the right */}
      <g transform="translate(408 236)">
        <polygon
          points="0,-16 14,4 6,4 6,26 -6,26 -6,4 -14,4"
          fill="var(--red)"
          opacity="0.85"
        />
        <ellipse cx="0" cy="30" rx="26" ry="7" fill="var(--red)" opacity="0.28" />
      </g>
      <text x={408} y={306} textAnchor="middle" fontSize="11" fill="var(--text-dim)" fontFamily="var(--font-data), monospace">
        short hedge
      </text>

      {/* the amber vault where both legs meet */}
      <g transform="translate(258 208)">
        <polygon points="0,-34 34,-14 0,6 -34,-14" fill="var(--saffron)" opacity="0.95" />
        <polygon points="-34,-14 -34,16 0,36 0,6" fill="var(--saffron)" opacity="0.6" />
        <polygon points="34,-14 34,16 0,36 0,6" fill="var(--saffron)" opacity="0.78" />
        <line x1="0" y1="6" x2="0" y2="36" stroke="var(--background)" strokeWidth="1" opacity="0.6" />
      </g>
      <text x={258} y={272} textAnchor="middle" fontSize="11" fill="var(--saffron)" fontFamily="var(--font-data), monospace">
        one netted vault
      </text>

      {/* the netting flows */}
      <path
        d="M148 242 C 196 214, 214 214, 224 218"
        stroke="var(--line-strong)"
        strokeDasharray="3 7"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="224" cy="218" r="3" fill="var(--green)" />
      <path
        d="M376 244 C 332 222, 306 222, 292 224"
        stroke="var(--line-strong)"
        strokeDasharray="3 7"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="292" cy="224" r="3" fill="var(--red)" />

      {/* floor ticks */}
      <line x1="50" y1="288" x2="470" y2="288" stroke="var(--line)" strokeWidth="1" />
      <line x1="50" y1="298" x2="470" y2="298" stroke="var(--line)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Card plate: equity that comes back — rising bars and a green stack. */
export function PlateReturn({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" className={className} aria-hidden="true">
      <Floor x={200} y={214} rx={150} />
      <g>
        <rect x="96" y="150" width="34" height="56" rx="3" fill="var(--saffron)" opacity="0.55" />
        <rect x="140" y="122" width="34" height="84" rx="3" fill="var(--saffron)" opacity="0.75" />
        <rect x="184" y="92" width="34" height="114" rx="3" fill="var(--saffron)" />
      </g>
      <CoinStack x={262} y={198} coins={3} color="var(--green)" w={40} h={11} />
      <path d="M112 132 C 160 104, 208 84, 258 76" stroke="var(--green)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.9" />
      <polygon points="268,72 252,74 260,86" fill="var(--green)" />
    </svg>
  );
}

/** Card plate: the penalty the isolated desk eats — a cracked shield. */
export function PlatePenalty({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" className={className} aria-hidden="true">
      <Floor x={200} y={214} rx={150} />
      <g transform="translate(176 60)">
        <path
          d="M40 0 L84 16 V64 C84 106 66 132 40 148 C14 132 -4 106 -4 64 V16 Z"
          fill="var(--surface-raised)"
          stroke="var(--red)"
          strokeWidth="1.4"
          opacity="0.9"
        />
        <path d="M28 10 L44 52 L18 66 L52 96" stroke="var(--red)" strokeWidth="1.4" fill="none" opacity="0.85" />
        <path d="M40 118 L34 148" stroke="var(--red)" strokeWidth="1" fill="none" opacity="0.5" />
      </g>
      {/* the split coin */}
      <g transform="translate(296 170)">
        <ellipse cx="-12" cy="6" rx="22" ry="9" fill="var(--red)" opacity="0.75" transform="rotate(18 -12 6)" />
        <ellipse cx="16" cy="16" rx="22" ry="9" fill="var(--red)" opacity="0.5" transform="rotate(-24 16 16)" />
      </g>
      <path d="M242 96 C 268 122, 282 140, 292 156" stroke="var(--line-strong)" strokeWidth="1.4" strokeDasharray="3 6" fill="none" />
    </svg>
  );
}

/** Card plate: what each practice demands — two stacks, one barely there. */
export function PlateTwoStacks({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" className={className} aria-hidden="true">
      <Floor x={200} y={214} rx={150} />
      {/* tall isolated stack */}
      <CoinStack x={140} y={198} coins={7} color="var(--bone)" w={46} h={11} />
      {/* the netted stack, barely there */}
      <CoinStack x={272} y={198} coins={2} color="var(--saffron)" w={46} h={11} />
      {/* the comparison measure */}
      <line x1="206" y1="150" x2="206" y2="182" stroke="var(--line-strong)" strokeWidth="1.2" strokeDasharray="3 5" />
      <line x1="198" y1="150" x2="214" y2="150" stroke="var(--line-strong)" strokeWidth="1.2" />
      <line x1="198" y1="182" x2="214" y2="182" stroke="var(--line-strong)" strokeWidth="1.2" />
    </svg>
  );
}

/** Card plate: zero bad debt — the vault is simply sealed. */
export function PlateVault({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" className={className} aria-hidden="true">
      <Floor x={200} y={214} rx={150} />
      <g transform="translate(200 116)">
        <rect x="-66" y="-74" width="132" height="152" rx="10" fill="var(--surface-raised)" />
        <rect x="-52" y="-60" width="104" height="120" rx="8" fill="var(--surface)" />
        <circle cx="0" cy="0" r="38" fill="var(--surface-raised)" stroke="var(--line-strong)" strokeWidth="1.4" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 10}
              y1={Math.sin(a) * 10}
              x2={Math.cos(a) * 34}
              y2={Math.sin(a) * 34}
              stroke="var(--line-strong)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="0" cy="0" r="7" fill="var(--green)" opacity="0.9" />
      </g>
      <circle cx="200" cy="116" r="54" fill="none" stroke="var(--green)" strokeWidth="1" opacity="0.25" />
    </svg>
  );
}
