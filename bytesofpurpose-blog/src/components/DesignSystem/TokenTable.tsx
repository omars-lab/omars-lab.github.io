import React from 'react';
import styles from './styles.module.css';

/**
 * TokenTable — a small "token · value · purpose" table primitive shared by the design-system
 * pages, so the four pages read consistently. When a row's `swatch` is set to a CSS token, a
 * live inline chip renders before the token name (handy for the color/motion tables).
 *
 *   <TokenTable rows={[
 *     {token: '--duration-fast', value: '0.12s', purpose: 'quick state change'},
 *   ]} />
 */
export interface TokenRow {
  token: string;
  value: string;
  purpose: string;
  /** Optional CSS token to render a live inline swatch (e.g. a color token). */
  swatch?: string;
}

export default function TokenTable({rows}: {rows: TokenRow[]}): React.JSX.Element {
  return (
    <table className={styles.tokenTable}>
      <thead>
        <tr>
          <th>Token</th>
          <th>Value</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.token}>
            <td>
              {row.swatch && (
                <span
                  className={styles.swatchInline}
                  style={{background: `var(${row.swatch})`}}
                  aria-hidden="true"
                />
              )}
              <code>{row.token}</code>
            </td>
            <td>
              <code>{row.value}</code>
            </td>
            <td>{row.purpose}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
