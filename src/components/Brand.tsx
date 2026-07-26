/**
 * The logo and the bird mark, inlined rather than loaded through <img> so both
 * inherit `currentColor` and follow the theme. Geometry is shared with
 * src/assets/{logo,mark}.svg and with scripts/gen-icons.mjs, which builds the
 * app icons from the same path.
 */

interface MarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Kept in step with src/assets/mark.svg. Bounding box: x 6..97, y 21..90. */
const BIRD =
  'M6 90C20 68 33 45 49 31C56 25 67 21 75 27C78 29 80 31 81 33L97 37L80 45C86 57 86 70 79 79C72 85 63 88 52 88C62 80 70 68 73 54C60 70 46 78 34 80C20 83 11 87 6 90Z';

/** Bird only. Fills with the current text colour. */
export function Mark({ size = 20, className, style }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label="Perch"
    >
      <path fill="currentColor" fillRule="evenodd" d={BIRD} />
    </svg>
  );
}

interface LogoProps {
  /** Height in pixels; width follows the lockup's aspect ratio. */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Bird + "perch" wordmark. The wordmark is a geometric monoline construction. */
export function Logo({ height = 34, className, style }: LogoProps) {
  return (
    <svg
      height={height}
      width={height * (440 / 108)}
      viewBox="0 0 440 108"
      className={className}
      style={style}
      role="img"
      aria-label="Perch"
    >
      <g transform="translate(-2 -17) scale(1.28)" fill="currentColor">
        <path fillRule="evenodd" d={BIRD} />
      </g>
      {/* Geometry mirrors src/assets/logo.svg — see the notes there. */}
      <g
        transform="translate(150 3)"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        {/* p */}
        <path d="M0 24V94" />
        <circle cx="23" cy="47" r="23" />
        {/* e */}
        <path d="M68 47H114" />
        <path d="M114 47a23 23 0 1 0 -8.2 17.6" />
        {/* r */}
        <path d="M136 24v46" />
        <path d="M136 40c0-12 8-16 20-16" />
        {/* c */}
        <path d="M218.6 32.2a23 23 0 1 0 0 29.6" />
        {/* h */}
        <path d="M246 8v62" />
        <path d="M246 40c0-12 8-16 19-16c11 0 15 7 15 18v28" />
      </g>
    </svg>
  );
}
