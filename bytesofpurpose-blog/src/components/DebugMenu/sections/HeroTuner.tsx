import React from 'react';
import type {DebugSection} from '../types';
import {
  HERO_PARAMS,
  heroDefaults,
  applyHeroValues,
  writeHeroParamsToUrl,
  readHeroParamsFromUrl,
  type HeroParam,
} from '@site/src/lib/hero-tuning';
import styles from './HeroTuner.module.css';

// HERO TUNER (dev-only DebugMenu section). Drag/slide/pick the tunable hero properties; every change
// writes to BOTH the hero root's inline CSS vars (live preview) and the URL (`ht-<key>=`), so the
// look is shareable. "Copy URL" yields a link that reproduces the look (and that you can paste to
// Claude to bake the values into the CSS defaults). A mask-overlay toggle shows the arch mask over the
// live scene at 50% so you can pin it to the drawn arch. The whole DebugMenu is localhost+dev gated,
// so none of this ships.

// The active variant the tuner is editing (read from the ?ab-homepage-hero-anim= override).
const VARIANTS: ReadonlyArray<{key: string; label: string}> = [
  {key: 'control', label: 'Scroll'},
  {key: 'test', label: 'Flash'},
  {key: 'variant_c', label: 'Studio'},
  {key: 'variant_d', label: 'Boutique'},
];

function heroRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>('[data-hero-root]');
}

function currentVariantKey(): string {
  if (typeof window === 'undefined') return 'control';
  return new URLSearchParams(window.location.search).get('ab-homepage-hero-anim') || 'control';
}

// which schema variant tag(s) a UI variant maps to (for filtering the controls shown)
function variantTag(abKey: string): 'studio' | 'boutique' | null {
  if (abKey === 'variant_c' || abKey === 'studio') return 'studio';
  if (abKey === 'variant_d' || abKey === 'boutique') return 'boutique';
  return null;
}

function HeroTunerBody(): React.JSX.Element {
  const [values, setValues] = React.useState<Record<string, string>>(() => ({
    ...heroDefaults(),
    ...(typeof window !== 'undefined' ? readHeroParamsFromUrl(window.location.search) : {}),
  }));
  const [overlay, setOverlay] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const ab = currentVariantKey();
  const tag = variantTag(ab);

  // Apply the values to the hero root whenever they change (live preview), and reflect to the URL.
  React.useEffect(() => {
    const root = heroRoot();
    if (root) applyHeroValues(root, values);
    writeHeroParamsToUrl(values);
  }, [values]);

  // The mask overlay: toggle an attribute on the hero root that the CSS uses to tint the arch mask, so
  // you can see it vs the drawn arch. Driven purely by the `overlay` state (no unmount cleanup), so the
  // overlay PERSISTS when you close the panel to look at the hero; unchecking the box removes it.
  React.useEffect(() => {
    const root = heroRoot();
    if (root) root.toggleAttribute('data-hero-mask-overlay', overlay);
  }, [overlay]);

  const set = (key: string, v: string) => setValues((s) => ({...s, [key]: v}));

  const reset = () => setValues(heroDefaults());

  const copyUrl = async () => {
    const url = writeHeroParamsToUrl(values);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the URL is already in the address bar */
    }
  };

  const switchVariant = (key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('ab-homepage-hero-anim', key);
    window.location.href = url.toString(); // reload so the hero re-resolves the variant
  };

  // Only show params relevant to the active variant (or the always-relevant 'all').
  const shown = HERO_PARAMS.filter(
    (p) => p.variants.includes('all') || (tag && p.variants.includes(tag)),
  );
  const groups = ['Arch mask', 'Layout', 'Style'] as const;

  // The shareable param string (also handy to paste to Claude).
  const paramString =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).toString().split('&').filter((s) => s.startsWith('ht-')).join('&') ||
        '(defaults)'
      : '';

  return (
    <div className={styles.tuner}>
      <div className={styles.variantRow}>
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={v.key === ab ? styles.variantActive : styles.variant}
            onClick={() => switchVariant(v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      {!tag && (
        <p className={styles.hint}>
          Switch to Studio or Boutique to tune its scene. (Scroll + Flash have no tunable params.)
        </p>
      )}

      {tag &&
        groups.map((g) => {
          const inGroup = shown.filter((p) => p.group === g);
          if (!inGroup.length) return null;
          return (
            <fieldset key={g} className={styles.group}>
              <legend className={styles.legend}>{g}</legend>
              {inGroup.map((p) => (
                <Control key={p.key} param={p} value={values[p.key]} onChange={(v) => set(p.key, v)} />
              ))}
            </fieldset>
          );
        })}

      {tag && (
        <label className={styles.overlayToggle}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />{' '}
          Show arch-mask overlay (pin to the drawn arch)
        </label>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.copy} onClick={copyUrl}>
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <button type="button" className={styles.resetBtn} onClick={reset}>
          Reset
        </button>
      </div>

      <code className={styles.readout}>{paramString}</code>
    </div>
  );
}

function Control({
  param,
  value,
  onChange,
}: {
  param: HeroParam;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  if (param.kind === 'slider') {
    const unit = param.unit ?? '';
    const num = parseFloat(value);
    return (
      <label className={styles.control}>
        <span className={styles.controlLabel}>
          {param.label} <em>{value}</em>
        </span>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={Number.isFinite(num) ? num : 0}
          onChange={(e) => onChange(`${e.target.value}${unit}`)}
        />
      </label>
    );
  }
  if (param.kind === 'color') {
    return (
      <label className={styles.control}>
        <span className={styles.controlLabel}>{param.label}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (param.kind === 'select') {
    return (
      <label className={styles.control}>
        <span className={styles.controlLabel}>{param.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {param.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  // toggle
  return (
    <label className={styles.control}>
      <span className={styles.controlLabel}>{param.label}</span>
      <input
        type="checkbox"
        checked={value === 'true' || value === '1'}
        onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
      />
    </label>
  );
}

export const heroTunerSection: DebugSection = {
  id: 'hero-tuner',
  title: 'Hero Tuner',
  render: () => <HeroTunerBody />,
};
