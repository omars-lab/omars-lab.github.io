import React from 'react';

/**
 * Actor glyphs for <UseCaseDiagram>.
 *
 * UML draws actors as stick figures outside the system boundary. We keep that
 * PLACEMENT but swap the generic figure for cleaner marks, each drawn to a
 * box x box square whose top-left is the local origin (0,0) so the caller can
 * position it with a <g transform>. All strokes/fills use currentColor so the
 * wrapping <g>'s color: controls the tint.
 *
 *   internal -> a filled user glyph (head + shoulders), for our own operators
 *   external -> a line "person" (head + shoulders arc), for customers
 *   system   -> a line gear, for automated / non-human actors (jobs, schedulers)
 *
 * Returning JSX (not an HTML string) keeps this framework-native: no
 * dangerouslySetInnerHTML, no build-time file read.
 */
export type ActorKind = 'internal' | 'external' | 'system';

export function ActorGlyph({kind, box}: {kind: ActorKind; box: number}): React.JSX.Element {
  const c = box / 2;

  if (kind === 'system') {
    // A line gear: outer ring + eight teeth + hub.
    const r = box * 0.3;
    const sw = box * 0.05;
    const teeth = Array.from({length: 8}, (_, i) => {
      const a = (i * Math.PI) / 4;
      return {
        x1: c + Math.cos(a) * r,
        y1: c + Math.sin(a) * r,
        x2: c + Math.cos(a) * (r + box * 0.1),
        y2: c + Math.sin(a) * (r + box * 0.1),
      };
    });
    return (
      <g fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
        <circle cx={c} cy={c} r={r} />
        {teeth.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
        <circle cx={c} cy={c} r={box * 0.1} />
      </g>
    );
  }

  const headR = box * 0.16;
  const headCy = box * 0.3;

  if (kind === 'internal') {
    // A FILLED user glyph, to read as "us" (distinct from the line customer).
    return (
      <g fill="currentColor" stroke="none">
        <circle cx={c} cy={headCy} r={headR} />
        <path
          d={`M ${box * 0.18} ${box * 0.86} Q ${c} ${box * 0.5}, ${box * 0.82} ${box * 0.86} Z`}
        />
      </g>
    );
  }

  // external -> line person: head circle + shoulders arc.
  const sw = box * 0.06;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <circle cx={c} cy={headCy} r={headR} />
      <path
        d={`M ${box * 0.2} ${box * 0.82} Q ${c} ${box * 0.48}, ${box * 0.8} ${box * 0.82}`}
      />
    </g>
  );
}
