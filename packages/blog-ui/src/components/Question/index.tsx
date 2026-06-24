import React, {CSSProperties, ReactNode, useCallback, useEffect, useState} from 'react';
import clsx from 'clsx';
import {GiLightningArc, GiFlame, GiChisel, GiAnvil} from 'react-icons/gi';
import type {IconType} from 'react-icons';
import styles from './styles.module.css';

/**
 * Question — a clickable card for a single introspective question in a "What I Ask Myself"
 * question-set post. The question text is the children. Optional props carry the per-question
 * metadata (why, howOften, when, record) that appears in a modal when the card is clicked,
 * plus glanceable BADGES (power, priority, frequency, depth) shown on the card AND modal.
 *
 * The modal is app-wide (single host, pub/sub) so it renders above everything. Mount
 * <QuestionModalHost /> once in Root.tsx (or equivalent) alongside <SignInModalHost />.
 *
 *   <Question
 *     power={['fire', 'anvil']} priority="core" frequency="Yearly" depth="deep"
 *     why="This anchors every other question to an actual foundation."
 *     howOften="Once per quarter or when you feel directionless"
 *     when="During annual reviews, major life transitions"
 *     record="Write a paragraph each time; compare across quarters">
 *     What is the purpose of your life?
 *   </Question>
 *
 * POWER TAXONOMY — the "power of a question" is the kind of CHARGE it carries (a forge
 * metaphor: how the question works on you). A calm everyday question gets no icon. A
 * question can carry MULTIPLE powers (pass an array); they render left-to-right.
 *
 *   - 'spark'  (GiLightningArc): a JOLT. Wakes you up, cuts through, sudden clarity.
 *   - 'fire'   (GiFlame):        a BURN. Confronts you, uncomfortable, demands change.
 *   - 'chisel' (GiChisel):       CARVES AWAY what isn't you; reveals who you already are.
 *   - 'anvil'  (GiAnvil):        RESHAPES you over repeated blows; forges who you become.
 *   - (none):                    a calm, everyday question. No icon.
 *
 * The canonical reader-facing legend for these lives in the "What I Ask Myself" keystone
 * post. If you change this taxonomy, update that post's legend in the SAME change so the
 * two never drift (see the upgrade-post skill).
 */
export type QuestionPower = 'spark' | 'fire' | 'chisel' | 'anvil';
export type QuestionPriority = 'core' | 'high' | 'medium' | 'low';
export type QuestionDepth = 'quick' | 'moderate' | 'deep';

/** A single power may be passed as a bare string; multiple as an array. */
export type QuestionPowerProp = QuestionPower | QuestionPower[];

export interface QuestionProps {
  children: ReactNode;
  why?: string;
  howOften?: string;
  when?: string;
  record?: string;
  /** Charge(s) the question carries. Omit for a calm/no-icon question. See taxonomy above. */
  power?: QuestionPowerProp;
  /** Importance tier. Renders as a colored pill. */
  priority?: QuestionPriority;
  /** Short cadence label for the badge (e.g. "Yearly", "Daily"). The full sentence goes in howOften. */
  frequency?: string;
  /** How much reflection it demands. */
  depth?: QuestionDepth;
  className?: string;
  style?: CSSProperties;
}

export interface QuestionDetail {
  text: string;
  why?: string;
  howOften?: string;
  when?: string;
  record?: string;
  /** Normalized to an array before dispatch so the modal renders consistently. */
  power?: QuestionPower[];
  priority?: QuestionPriority;
  frequency?: string;
  depth?: QuestionDepth;
}

/**
 * Power → {Icon, name, label} for the charge badge. Icon inherits currentColor (theme-aware).
 * `name` is the title-case noun (Spark/Fire/Chisel/Anvil); `label` is the short gloss shown
 * on the modal badge and in the legend. This object is the SINGLE SOURCE OF TRUTH for the
 * taxonomy — the <PowerLegend> component renders straight from it, so the reader-facing legend
 * can never drift from what the cards actually show.
 */
const POWER_META: Record<QuestionPower, {Icon: IconType; name: string; label: string}> = {
  spark: {Icon: GiLightningArc, name: 'Spark', label: 'A jolt that wakes you up'},
  fire: {Icon: GiFlame, name: 'Fire', label: 'A burn that confronts you'},
  chisel: {Icon: GiChisel, name: 'Chisel', label: "Carves away what isn't you"},
  anvil: {Icon: GiAnvil, name: 'Anvil', label: 'Reshapes who you become'},
};

/** Stable render order regardless of the order props are passed in. */
const POWER_ORDER: QuestionPower[] = ['spark', 'fire', 'chisel', 'anvil'];

const PRIORITY_META: Record<QuestionPriority, string> = {
  core: 'Core',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const DEPTH_META: Record<QuestionDepth, string> = {
  quick: 'Quick',
  moderate: 'Moderate',
  deep: 'Deep',
};

function normalizePower(power: QuestionPowerProp | undefined): QuestionPower[] {
  if (!power) return [];
  const arr = Array.isArray(power) ? power : [power];
  // de-dupe + apply a stable order so cards read consistently
  return POWER_ORDER.filter((p) => arr.includes(p));
}

export const QUESTION_MODAL_EVENT = 'bop:question-modal';

export function openQuestionModal(detail: QuestionDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUESTION_MODAL_EVENT, {detail}));
}

function nodeToText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{children?: ReactNode}>;
    return nodeToText(el.props.children);
  }
  return '';
}

/* ── Badges (shared by card + modal) ─────────────────────────────────── */

interface BadgesProps {
  power: QuestionPower[];
  priority?: QuestionPriority;
  frequency?: string;
  depth?: QuestionDepth;
  /** 'card' is compact (icons only, terse pills); 'modal' shows labels. */
  variant: 'card' | 'modal';
}

function QuestionBadges({power, priority, frequency, depth, variant}: BadgesProps): React.JSX.Element | null {
  const hasAny = power.length > 0 || priority || frequency || depth;
  if (!hasAny) return null;

  return (
    <span className={clsx(styles.badges, variant === 'modal' && styles.badgesModal)}>
      {power.map((p) => {
        const {Icon, label} = POWER_META[p];
        return (
          <span
            key={p}
            className={clsx(styles.powerBadge, styles[`power_${p}`])}
            title={label}
            aria-label={label}>
            <Icon className={styles.powerIcon} aria-hidden="true" />
            {variant === 'modal' && <span className={styles.powerLabel}>{label}</span>}
          </span>
        );
      })}
      {priority && (
        <span
          className={clsx(styles.pill, styles[`priority_${priority}`])}
          title={`Priority: ${PRIORITY_META[priority]}`}>
          {PRIORITY_META[priority]}
        </span>
      )}
      {frequency && (
        <span className={clsx(styles.pill, styles.pillFrequency)} title={`How often: ${frequency}`}>
          {frequency}
        </span>
      )}
      {depth && (
        <span className={clsx(styles.pill, styles.pillDepth)} title={`Depth: ${DEPTH_META[depth]}`}>
          {DEPTH_META[depth]}
        </span>
      )}
    </span>
  );
}

const Question: React.FC<QuestionProps> = ({
  children,
  why,
  howOften,
  when,
  record,
  power,
  priority,
  frequency,
  depth,
  className,
  style,
}) => {
  const powers = normalizePower(power);
  const hasBadges = powers.length > 0 || !!priority || !!frequency || !!depth;
  const hasDetail = !!(why || howOften || when || record) || hasBadges;

  const handleClick = useCallback(() => {
    if (!hasDetail) return;
    openQuestionModal({
      text: nodeToText(children),
      why,
      howOften,
      when,
      record,
      power: powers,
      priority,
      frequency,
      depth,
    });
  }, [children, why, howOften, when, record, priority, frequency, depth, powers, hasDetail]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <button
      type="button"
      className={clsx(styles.card, className)}
      style={style}
      onClick={hasDetail ? handleClick : undefined}
      onKeyDown={hasDetail ? handleKey : undefined}
      aria-haspopup={hasDetail ? 'dialog' : undefined}>
      <span className={styles.text}>{children}</span>
      <span className={styles.cardRight}>
        <QuestionBadges
          power={powers}
          priority={priority}
          frequency={frequency}
          depth={depth}
          variant="card"
        />
        {hasDetail && (
          <span className={styles.expandIcon} aria-hidden="true">
            &#8250;
          </span>
        )}
      </span>
    </button>
  );
};

export default Question;

/* ── PowerLegend (canonical reader-facing legend) ────────────────────── */

export interface PowerLegendProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * PowerLegend — renders the canonical "power of a question" legend straight from POWER_META,
 * using the SAME icons the cards show. Drop it into the "What I Ask Myself" keystone post so
 * the reader-facing legend is generated from the source of truth and can never drift from the
 * badges. (Do NOT hand-author the legend as a markdown table with approximate emoji — it will
 * fall out of sync with the real icons.)
 */
export function PowerLegend({className, style}: PowerLegendProps): React.JSX.Element {
  return (
    <dl className={clsx(styles.legend, className)} style={style}>
      {POWER_ORDER.map((p) => {
        const {Icon, name, label} = POWER_META[p];
        return (
          <div key={p} className={styles.legendRow}>
            <dt className={clsx(styles.legendIcon, styles[`power_${p}`])}>
              <Icon className={styles.powerIcon} aria-hidden="true" />
            </dt>
            <dd className={styles.legendText}>
              <span className={styles.legendName}>{name}</span>
              <span className={styles.legendGloss}>{label}</span>
            </dd>
          </div>
        );
      })}
      <div className={styles.legendRow}>
        <dt className={clsx(styles.legendIcon, styles.legendNone)} aria-hidden="true">
          ·
        </dt>
        <dd className={styles.legendText}>
          <span className={styles.legendName}>Calm</span>
          <span className={styles.legendGloss}>An everyday question. No charge, still worth asking.</span>
        </dd>
      </div>
    </dl>
  );
}

/* ── Modal host (mount once in Root.tsx) ─────────────────────────────── */

interface ModalState {
  open: boolean;
  detail: QuestionDetail | null;
}

function QuestionModalImpl(): React.JSX.Element | null {
  const [{open, detail}, setState] = useState<ModalState>({open: false, detail: null});

  const close = useCallback(() => setState((s) => ({...s, open: false})), []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<QuestionDetail>).detail;
      setState({open: true, detail: d});
    };
    window.addEventListener(QUESTION_MODAL_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(QUESTION_MODAL_EVENT, onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !detail) return null;

  const meta: Array<{label: string; value: string | undefined; key: keyof QuestionDetail}> = [
    {label: 'Why this question matters', value: detail.why, key: 'why'},
    {label: 'How often to ask', value: detail.howOften, key: 'howOften'},
    {label: 'When to ask it', value: detail.when, key: 'when'},
    {label: 'How often to record answers', value: detail.record, key: 'record'},
  ];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Question details"
      onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} aria-label="Dismiss" onClick={close}>
          &times;
        </button>
        <p className={styles.question}>{detail.text || 'Question'}</p>
        <QuestionBadges
          power={detail.power ?? []}
          priority={detail.priority}
          frequency={detail.frequency}
          depth={detail.depth}
          variant="modal"
        />
        <ul className={styles.metaList}>
          {meta
            .filter((m) => m.value)
            .map((m) => (
              <li key={m.key} className={styles.metaItem}>
                <span className={styles.metaLabel}>{m.label}</span>
                <span className={styles.metaValue}>{m.value}</span>
              </li>
            ))}
        </ul>
        <button type="button" className={styles.dismissBtn} onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}

export function QuestionModalHost(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <QuestionModalImpl />;
}
