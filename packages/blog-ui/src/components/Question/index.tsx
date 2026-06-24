import React, {CSSProperties, ReactNode, useCallback, useEffect, useState} from 'react';
import clsx from 'clsx';
import {GiLightningArc, GiFlame, GiChisel, GiAnvil, GiCycle} from 'react-icons/gi';
import type {IconType} from 'react-icons';
import Tooltip from '../Tooltip';
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
/**
 * Cron cadence — how often a RECURRING question comes around. Think of it as the question's
 * schedule (a "cron job" for self-reflection). `adhoc` marks a question with no fixed cadence
 * (ask it when its situation arises). Rendered as a pill with a recurring-cycle icon.
 */
export type QuestionCron = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'adhoc';

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
  /** Recurring cadence (daily/weekly/monthly/quarterly/yearly/adhoc). Pill + cycle icon. */
  cron?: QuestionCron;
  /**
   * @deprecated Use `cron` instead. Free-text cadence label kept for back-compat: if `cron`
   * is unset and `frequency` is a recognized cadence word it maps to `cron`; otherwise it
   * renders as a plain text pill (no icon).
   */
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
  cron?: QuestionCron;
  /** Free-text fallback when `frequency` wasn't a recognized cadence word (no icon). */
  frequencyText?: string;
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

const PRIORITY_META: Record<QuestionPriority, {label: string; gloss: string}> = {
  core: {label: 'Core', gloss: 'A foundational question; everything else builds on it'},
  high: {label: 'High', gloss: 'Important; worth returning to often'},
  medium: {label: 'Medium', gloss: 'Useful, but not foundational'},
  low: {label: 'Low', gloss: 'A lighter question; ask it when it fits'},
};

const DEPTH_META: Record<QuestionDepth, {label: string; gloss: string}> = {
  quick: {label: 'Quick', gloss: 'A fast gut-check; answer in a moment'},
  moderate: {label: 'Moderate', gloss: 'Some real reflection required'},
  deep: {label: 'Deep', gloss: 'Sit with it; this one takes time'},
};

/** Cron cadence → {label, gloss}. The cycle icon (GiCycle) is shared across all cadences. */
const CRON_META: Record<QuestionCron, {label: string; gloss: string}> = {
  daily: {label: 'Daily', gloss: 'Ask every day'},
  weekly: {label: 'Weekly', gloss: 'Ask every week'},
  monthly: {label: 'Monthly', gloss: 'Ask every month'},
  quarterly: {label: 'Quarterly', gloss: 'Ask every quarter'},
  yearly: {label: 'Yearly', gloss: 'Ask every year'},
  adhoc: {label: 'As needed', gloss: 'No fixed cadence; ask when it applies'},
};

const CRON_ORDER: QuestionCron[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'adhoc'];

/** Map a free-text `frequency` value to a `cron` cadence when it's a recognized word. */
function frequencyToCron(freq: string | undefined): QuestionCron | undefined {
  if (!freq) return undefined;
  const f = freq.trim().toLowerCase();
  const direct = (CRON_ORDER as string[]).includes(f) ? (f as QuestionCron) : undefined;
  if (direct) return direct;
  const synonyms: Record<string, QuestionCron> = {
    annually: 'yearly',
    annual: 'yearly',
    'every year': 'yearly',
    'every day': 'daily',
    'every week': 'weekly',
    'every month': 'monthly',
    'every quarter': 'quarterly',
    'as needed': 'adhoc',
    'ad hoc': 'adhoc',
    'ad-hoc': 'adhoc',
  };
  return synonyms[f];
}

function normalizePower(power: QuestionPowerProp | undefined): QuestionPower[] {
  if (!power) return [];
  const arr = Array.isArray(power) ? power : [power];
  // de-dupe + apply a stable order so cards read consistently
  return POWER_ORDER.filter((p) => arr.includes(p));
}

/** Resolve the cron cadence + any leftover free-text frequency for rendering. */
function resolveCadence(
  cron: QuestionCron | undefined,
  frequency: string | undefined,
): {cron?: QuestionCron; frequencyText?: string} {
  if (cron) return {cron};
  const mapped = frequencyToCron(frequency);
  if (mapped) return {cron: mapped};
  if (frequency) return {frequencyText: frequency};
  return {};
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
  cron?: QuestionCron;
  frequencyText?: string;
  depth?: QuestionDepth;
  /** 'card' is compact (icons only, terse pills); 'modal' shows labels. */
  variant: 'card' | 'modal';
}

function QuestionBadges({
  power,
  priority,
  cron,
  frequencyText,
  depth,
  variant,
}: BadgesProps): React.JSX.Element | null {
  const hasAny = power.length > 0 || priority || cron || frequencyText || depth;
  if (!hasAny) return null;

  return (
    <span className={clsx(styles.badges, variant === 'modal' && styles.badgesModal)}>
      {power.map((p) => {
        const {Icon, name, label} = POWER_META[p];
        return (
          <Tooltip
            key={p}
            content={
              <>
                <b>Power: {name}</b>
                <br />
                {label}
              </>
            }>
            <span className={clsx(styles.powerBadge, styles[`power_${p}`])} aria-label={`Power: ${name}. ${label}`}>
              <Icon className={styles.powerIcon} aria-hidden="true" />
              {variant === 'modal' && <span className={styles.powerLabel}>{label}</span>}
            </span>
          </Tooltip>
        );
      })}
      {priority && (
        <Tooltip
          content={
            <>
              <b>Priority: {PRIORITY_META[priority].label}</b>
              <br />
              {PRIORITY_META[priority].gloss}
            </>
          }>
          <span className={clsx(styles.pill, styles[`priority_${priority}`])}>
            {PRIORITY_META[priority].label}
          </span>
        </Tooltip>
      )}
      {cron && (
        <Tooltip
          content={
            <>
              <b>Cadence: {CRON_META[cron].label}</b>
              <br />
              {CRON_META[cron].gloss}
            </>
          }>
          <span className={clsx(styles.pill, styles.pillCron)}>
            <GiCycle className={styles.cronIcon} aria-hidden="true" />
            {CRON_META[cron].label}
          </span>
        </Tooltip>
      )}
      {!cron && frequencyText && (
        <Tooltip
          content={
            <>
              <b>How often</b>
              <br />
              {frequencyText}
            </>
          }>
          <span className={clsx(styles.pill, styles.pillFrequency)}>{frequencyText}</span>
        </Tooltip>
      )}
      {depth && (
        <Tooltip
          content={
            <>
              <b>Depth: {DEPTH_META[depth].label}</b>
              <br />
              {DEPTH_META[depth].gloss}
            </>
          }>
          <span className={clsx(styles.pill, styles.pillDepth)}>{DEPTH_META[depth].label}</span>
        </Tooltip>
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
  cron,
  frequency,
  depth,
  className,
  style,
}) => {
  const powers = normalizePower(power);
  const cadence = resolveCadence(cron, frequency);
  const hasBadges =
    powers.length > 0 || !!priority || !!cadence.cron || !!cadence.frequencyText || !!depth;
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
      cron: cadence.cron,
      frequencyText: cadence.frequencyText,
      depth,
    });
  }, [
    children,
    why,
    howOften,
    when,
    record,
    priority,
    cadence.cron,
    cadence.frequencyText,
    depth,
    powers,
    hasDetail,
  ]);

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
          cron={cadence.cron}
          frequencyText={cadence.frequencyText}
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
          cron={detail.cron}
          frequencyText={detail.frequencyText}
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
