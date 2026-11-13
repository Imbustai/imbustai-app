import { useId } from 'react';
import styles from './home-landing.module.css';

/**
 * Flat postal drawings that stand in for the photographs and films still to be
 * produced. All of them are decorative: the text next to them carries the
 * meaning, so they are hidden from assistive technology.
 */

function AirmailPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="40" height="12" patternUnits="userSpaceOnUse">
      <path d="M4 12 L12 0 H22 L14 12 Z" className={styles.artRed} />
      <path d="M24 12 L32 0 H42 L34 12 Z" className={styles.artBlue} />
      <path d="M-16 12 L-8 0 H2 L-6 12 Z" className={styles.artBlue} />
    </pattern>
  );
}

function Postmark({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      className={styles.artInkStroke}
      fill="none"
      strokeWidth="2"
    >
      <circle r="30" />
      <circle r="21" strokeWidth="1.2" />
      <path d="M-11 -4 H11 M-11 4 H11" strokeWidth="1.6" />
      <path d="M28 -16 q14 -8 28 0 t28 0 M30 -5 q14 -8 28 0 t28 0 M30 6 q14 -8 28 0 t28 0 M28 17 q14 -8 28 0 t28 0" />
    </g>
  );
}

function Stamp({ x, y, w = 52, h = 64 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} className={styles.artBlue} />
      <rect
        x="-2"
        y="-2"
        width={w + 4}
        height={h + 4}
        fill="none"
        className={styles.artPaperStroke}
        strokeWidth="5"
        strokeDasharray="0.1 8"
        strokeLinecap="round"
      />
      <rect x="8" y="8" width={w - 16} height={h - 16} className={styles.artPaper} />
      <path
        d={`M${w / 2 - 9} ${h / 2 + 12} V${h / 2 - 12} M${w / 2} ${h / 2 + 12} V${h / 2 - 12} l9 12 l-9 12`}
        fill="none"
        className={styles.artRedStroke}
        strokeWidth="4"
      />
    </g>
  );
}

export function EnvelopeArt({ to, from }: { to?: string; from?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 440 290" className={styles.art} aria-hidden focusable="false">
      <defs>
        <AirmailPattern id={id} />
      </defs>
      <rect x="6" y="6" width="428" height="278" className={styles.artPaper} />
      <rect
        x="12"
        y="12"
        width="416"
        height="266"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="12"
      />
      <rect
        x="6"
        y="6"
        width="428"
        height="278"
        fill="none"
        className={styles.artInkStroke}
        strokeWidth="2"
      />
      <Stamp x={346} y={40} />
      <Postmark x={300} y={84} />
      {to ? (
        <text x="60" y="170" className={styles.artHand}>
          {to}
        </text>
      ) : null}
      <path
        d="M60 190 H250 M60 214 H220 M60 238 H180"
        className={styles.artInkStroke}
        strokeWidth="2"
        opacity="0.45"
      />
      {from ? (
        <text x="40" y="52" className={styles.artSmall}>
          {from}
        </text>
      ) : null}
    </svg>
  );
}

export function LetterArt() {
  return (
    <svg viewBox="0 0 240 180" className={styles.art} aria-hidden focusable="false">
      <rect x="40" y="8" width="160" height="164" className={styles.artPaper} />
      <rect
        x="40"
        y="8"
        width="160"
        height="164"
        fill="none"
        className={styles.artInkStroke}
        strokeWidth="2"
      />
      <path d="M58 34 H110" className={styles.artBlueStroke} strokeWidth="4" />
      <path
        d="M58 58 H182 M58 74 H182 M58 90 H170 M58 106 H182 M58 122 H140"
        className={styles.artInkStroke}
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M120 152 q10 -16 18 -2 t16 -2 t18 2"
        fill="none"
        className={styles.artRedStroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CatalogueArt() {
  return (
    <svg viewBox="0 0 240 180" className={styles.art} aria-hidden focusable="false">
      <g strokeWidth="2">
        <rect x="26" y="34" width="84" height="116" className={styles.artBlue} />
        <rect x="78" y="22" width="84" height="128" className={styles.artRed} />
        <rect x="130" y="34" width="84" height="116" className={styles.artYellow} />
        <rect x="90" y="40" width="60" height="6" className={styles.artPaper} />
        <rect x="90" y="54" width="40" height="6" className={styles.artPaper} />
        <circle cx="120" cy="104" r="20" className={styles.artPaper} />
        <path d="M120 92 v14 M120 113 v1" className={styles.artInkStroke} strokeWidth="4" />
      </g>
    </svg>
  );
}

export function ReplyArt() {
  return (
    <svg viewBox="0 0 240 180" className={styles.art} aria-hidden focusable="false">
      <rect
        x="74"
        y="8"
        width="92"
        height="164"
        rx="10"
        className={`${styles.artPaper} ${styles.artInkStroke}`}
        strokeWidth="3"
      />
      <path
        d="M88 40 H152 M88 56 H152 M88 72 H138 M88 88 H150 M88 104 H120"
        className={styles.artInkStroke}
        strokeWidth="2"
        opacity="0.5"
      />
      <path d="M124 104 v-10" className={styles.artRedStroke} strokeWidth="3" />
      <rect x="88" y="132" width="64" height="24" className={styles.artBlue} />
      <path
        d="M110 144 H130 M124 138 l6 6 l-6 6"
        fill="none"
        className={styles.artPaperStroke}
        strokeWidth="3"
      />
    </svg>
  );
}

export function PostboxArt() {
  return (
    <svg viewBox="0 0 240 180" className={styles.art} aria-hidden focusable="false">
      <path d="M70 172 V30 q0 -18 18 -18 h64 q18 0 18 18 V172 Z" className={styles.artRed} />
      <rect x="88" y="40" width="64" height="12" className={styles.artInk} />
      <rect x="92" y="72" width="56" height="40" className={styles.artPaper} />
      <path
        d="M100 84 H140 M100 94 H132 M100 102 H124"
        className={styles.artInkStroke}
        strokeWidth="2"
      />
      <rect x="112" y="132" width="16" height="22" className={styles.artYellow} />
      <g transform="rotate(-14 150 30)">
        <rect x="118" y="14" width="64" height="40" className={styles.artPaper} />
        <rect
          x="118"
          y="14"
          width="64"
          height="40"
          fill="none"
          className={styles.artInkStroke}
          strokeWidth="2"
        />
        <rect x="164" y="20" width="12" height="14" className={styles.artBlue} />
      </g>
    </svg>
  );
}

/** Everything a Player finds in the letterbox, laid out flat on a table. */
export function FlatLayArt() {
  const id = useId();
  return (
    <svg viewBox="0 0 640 440" className={styles.art} aria-hidden focusable="false">
      <defs>
        <AirmailPattern id={id} />
      </defs>
      {/* newspaper clipping */}
      <g transform="rotate(7 500 300)">
        <rect x="420" y="210" width="180" height="200" className={styles.artPaper} />
        <rect x="434" y="224" width="152" height="16" className={styles.artInk} />
        <rect x="434" y="250" width="70" height="60" className={styles.artInk} opacity="0.25" />
        <path
          d="M514 254 H586 M514 268 H586 M514 282 H586 M514 296 H572 M434 324 H586 M434 338 H586 M434 352 H586 M434 366 H586 M434 380 H540"
          className={styles.artInkStroke}
          strokeWidth="2"
          opacity="0.5"
        />
      </g>
      {/* letter */}
      <g transform="rotate(-5 250 220)">
        <rect x="120" y="30" width="270" height="360" className={styles.artPaper} />
        <rect
          x="120"
          y="30"
          width="270"
          height="360"
          fill="none"
          className={styles.artInkStroke}
          strokeWidth="2"
        />
        <path d="M148 68 H240" className={styles.artBlueStroke} strokeWidth="5" />
        <path
          d="M148 108 H362 M148 130 H362 M148 152 H340 M148 174 H362 M148 196 H362 M148 218 H300 M148 256 H362 M148 278 H362 M148 300 H330"
          className={styles.artInkStroke}
          strokeWidth="2"
          opacity="0.5"
        />
        <path
          d="M270 350 q14 -22 26 -2 t24 -2 t26 2"
          fill="none"
          className={styles.artRedStroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      {/* telegram */}
      <g transform="rotate(-9 470 110)">
        <rect x="360" y="60" width="230" height="110" className={styles.artYellow} />
        <rect x="372" y="72" width="90" height="12" className={styles.artInk} />
        <path
          d="M372 104 H578 M372 124 H578 M372 144 H500"
          className={styles.artInkStroke}
          strokeWidth="4"
          strokeDasharray="26 8"
        />
      </g>
      {/* envelope */}
      <g transform="rotate(4 180 320)">
        <rect x="20" y="230" width="320" height="190" className={styles.artPaper} />
        <rect
          x="26"
          y="236"
          width="308"
          height="178"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="12"
        />
        <rect
          x="20"
          y="230"
          width="320"
          height="190"
          fill="none"
          className={styles.artInkStroke}
          strokeWidth="2"
        />
        <Stamp x={268} y={254} w={44} h={54} />
        <Postmark x={228} y={292} size={0.8} />
        <path
          d="M60 340 H200 M60 360 H180 M60 380 H150"
          className={styles.artInkStroke}
          strokeWidth="2"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
