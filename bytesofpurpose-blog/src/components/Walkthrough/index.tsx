import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Walkthrough — a scripted, animated UX demo over live HTML, with scene transitions.
 *
 * A static mockup shows what a UI looks like; a Walkthrough shows it being USED, then
 * hands off to a Claude Code terminal that "fixes" it. It plays a scripted sequence:
 * the cursor drags across a sentence to select it, a comment is typed letter-by-letter,
 * a "Fix with Claude" button is clicked, the app scene crossfades to a Claude CLI scene
 * where a prompt types in and the agent's thinking/tool steps stream, then it fades back
 * to the resolved app and loops. Honors prefers-reduced-motion (shows end states, no motion).
 *
 * The app scene is the children (typically a <Mockup>). The Claude terminal scene is
 * built-in and driven by the `claude` prop. Targets are CSS selectors against the app
 * scene, so the mockup marks anchorable elements with ids.
 *
 *   <Walkthrough
 *     claude={{prompt: 'see the latest feedback on review.studio/doc/hld',
 *              steps: ['● reading the open comment', '● rewriting the passage', '✓ committed to git']}}
 *     steps={[
 *       {type:'dragSelect', target:'#sentence', say:'Select the phrase to comment on'},
 *       {type:'type', target:'#commentbox', text:'Anchor this to the exact range?', say:'Type a comment'},
 *       {type:'click', target:'#fix', say:'Fix with Claude'},
 *       {type:'scene', to:'claude', say:'Claude reads the feedback and fixes the doc'},
 *       {type:'scene', to:'app', say:'The edit is applied'},
 *     ]}
 *   >
 *     <Mockup …>… #sentence … #commentbox … <button id="fix">Fix with Claude</button> …</Mockup>
 *   </Walkthrough>
 */

// A Claude-Code tool-use line: `● Verb(target)  note` (the real-CLI look).
export interface ClaudeTool {
  verb: string; // e.g. 'Open', 'Read', 'Update'
  target: string; // e.g. 'Markdown Studio', 'plan.md'
  note?: string; // dim trailing note
  done?: boolean; // render as a ✓ result line instead of a ● tool line
}

// A `scene` step toward 'claude' carries its OWN beat (prompt + tool-use lines), so a
// walkthrough can have multiple distinct Claude beats (e.g. "open studio" then "continue").
export type WalkStep =
  | {type: 'move'; target: string; say?: string; hold?: number}
  | {type: 'highlight'; target: string; say?: string; hold?: number}
  | {type: 'dragSelect'; target: string; say?: string; hold?: number}
  | {type: 'type'; target: string; text: string; say?: string; hold?: number}
  | {type: 'comment'; target: string; text: string; say?: string; hold?: number}
  | {type: 'click'; target: string; say?: string; hold?: number}
  | {
      type: 'scene';
      to: 'app' | 'claude';
      prompt?: string; // claude beats: the typed prompt line
      intro?: string; // claude beats: a human assistant line shown BEFORE the tools
      tools?: ClaudeTool[]; // claude beats: the streamed tool-use lines
      say?: string;
      hold?: number;
    };

export interface WalkthroughProps {
  children: ReactNode; // the app scene (a <Mockup>)
  steps: WalkStep[];
  stepHold?: number;
  autoPlay?: boolean;
  className?: string;
  style?: CSSProperties;
}

const Walkthrough: React.FC<WalkthroughProps> = ({
  children,
  steps,
  stepHold = 1000,
  autoPlay = true,
  className,
  style,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({x: 24, y: 24, clicking: false});
  const [hl, setHl] = useState<{x: number; y: number; w: number; h: number} | null>(null);
  const [typed, setTyped] = useState<{sel: string; text: string} | null>(null);
  const [scene, setScene] = useState<'app' | 'claude'>('app');
  const [claudePrompt, setClaudePrompt] = useState('');
  const [claudeIntro, setClaudeIntro] = useState('');
  const [claudeTools, setClaudeTools] = useState<ClaudeTool[]>([]);
  const [caption, setCaption] = useState('');
  const [playing, setPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  // does the walkthrough OPEN on a claude beat? (then the initial scene is claude)
  const opensOnClaude =
    steps[0]?.type === 'scene' && steps[0].to === 'claude';

  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const wait = (ms: number) =>
    new Promise<void>((res) => timers.current.push(window.setTimeout(res, reduced ? 0 : ms)));

  const rectOf = useCallback((selector: string) => {
    const stage = appRef.current;
    if (!stage) return null;
    const el = stage.querySelector(selector) as HTMLElement | null;
    if (!el) return null;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height};
  }, []);

  const moveTo = async (x: number, y: number, ms = 480) => {
    setCursor((c) => ({...c, x, y}));
    await wait(ms);
  };

  const resetScene = () => {
    setHl(null);
    setTyped(null);
    setClaudePrompt('');
    setClaudeIntro('');
    setClaudeTools([]);
  };

  const runStep = useCallback(
    async (step: WalkStep) => {
      setCaption(step.say || '');

      if (step.type === 'scene') {
        // crossfade scenes
        setScene(step.to);
        await wait(450);
        if (step.to === 'claude') {
          // each claude beat: type the prompt, then (optional) a human assistant line, then
          // stream the tool-use lines — so it reads like a real session, not a tool dump.
          setClaudePrompt('');
          setClaudeIntro('');
          setClaudeTools([]);
          const prompt = step.prompt || '';
          for (let i = 1; i <= prompt.length; i++) {
            setClaudePrompt(prompt.slice(0, i));
            await wait(20);
          }
          await wait(300);
          if (step.intro) {
            setClaudeIntro(step.intro);
            await wait(700);
          }
          for (const tool of step.tools || []) {
            setClaudeTools((prev) => [...prev, tool]);
            await wait(520);
          }
        }
        return;
      }

      const r = rectOf(step.target);
      if (!r) return;

      if (step.type === 'dragSelect') {
        // move to the start, then grow the highlight across the word to the end
        await moveTo(r.x, r.y + r.h / 2, 420);
        const frames = reduced ? 1 : 10;
        for (let i = 1; i <= frames; i++) {
          const w = (r.w * i) / frames;
          setHl({x: r.x, y: r.y, w, h: r.h});
          setCursor((c) => ({...c, x: r.x + w, y: r.y + r.h / 2}));
          await wait(40);
        }
        return;
      }
      if (step.type === 'move' || step.type === 'highlight') {
        await moveTo(r.x + Math.min(r.w * 0.5, 40), r.y + r.h / 2);
        if (step.type === 'highlight') setHl({x: r.x, y: r.y, w: r.w, h: r.h});
        return;
      }
      if (step.type === 'type') {
        await moveTo(r.x + 12, r.y + r.h / 2, 360);
        const t = step.text;
        for (let i = 1; i <= t.length; i++) {
          setTyped({sel: step.target, text: t.slice(0, i)});
          await wait(reduced ? 0 : 38);
        }
        return;
      }
      if (step.type === 'comment') {
        await moveTo(r.x + r.w, r.y, 360);
        setTyped({sel: step.target, text: step.text});
        return;
      }
      if (step.type === 'click') {
        await moveTo(r.x + r.w / 2, r.y + r.h / 2, 420);
        setCursor((c) => ({...c, clicking: true}));
        await wait(220);
        setCursor((c) => ({...c, clicking: false}));
        return;
      }
    },
    [rectOf, reduced]
  );

  const play = useCallback(async () => {
    if (!steps.length) return;
    setPlaying(true);
    // start on whichever scene the first step implies (claude if it opens on a claude beat)
    setScene(opensOnClaude ? 'claude' : 'app');
    resetScene();
    await wait(300);
    for (let i = 0; i < steps.length; i++) {
      setActiveStep(i);
      await runStep(steps[i]);
      await wait(steps[i].hold ?? stepHold);
    }
    setPlaying(false);
  }, [steps, runStep, stepHold, opensOnClaude]);

  const loopingRef = useRef(false);
  const inView = useRef(false);
  const loop = useCallback(async () => {
    if (loopingRef.current) return;
    loopingRef.current = true;
    await play();
    await wait(1600);
    loopingRef.current = false;
    if (autoPlay && inView.current && !reduced) loop();
  }, [play, autoPlay, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !autoPlay) return;
    const io = new IntersectionObserver(
      (entries) => {
        inView.current = entries[0]?.isIntersecting ?? false;
        if (inView.current && !loopingRef.current) loop();
      },
      {threshold: 0.4}
    );
    io.observe(root);
    return () => {
      io.disconnect();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, loop]);

  // inject the typed comment text into the targeted comment box (if present)
  const typedText = typed?.text || '';
  const typedSel = typed?.sel || '';

  return (
    <div ref={rootRef} className={clsx(styles.walkthrough, className)} style={style}>
      <div className={styles.viewport}>
        {/* APP scene */}
        <div
          ref={appRef}
          className={clsx(styles.scene, scene === 'app' ? styles.shown : styles.hidden)}>
          {children}

          {hl && (
            <span
              className={styles.highlight}
              style={{left: hl.x, top: hl.y, width: hl.w, height: hl.h}}
              aria-hidden="true"
            />
          )}

          {/* live-typed comment text mirrored into the box marked by the selector */}
          {typedText && <CommentInjector selector={typedSel} text={typedText} scope={appRef} />}

          <span
            className={clsx(styles.cursor, cursor.clicking && styles.clicking)}
            style={{transform: `translate(${cursor.x}px, ${cursor.y}px)`}}
            aria-hidden="true"
          />
        </div>

        {/* CLAUDE CLI scene */}
        <div
          className={clsx(
            styles.scene,
            styles.claude,
            scene === 'claude' ? styles.shown : styles.hidden
          )}
          aria-hidden={scene !== 'claude'}>
          <div className={styles.claudeBar}>
            <span className={styles.dots}>
              <i /><i /><i />
            </span>
            <span className={styles.claudeTitle}>claude code</span>
          </div>
          <div className={styles.claudeBody}>
            <div className={styles.claudePrompt}>
              <span className={styles.caret}>›</span> {claudePrompt}
              {scene === 'claude' &&
                claudePrompt &&
                !claudeIntro &&
                claudeTools.length === 0 && <span className={styles.blink}>▋</span>}
            </div>
            {claudeIntro && <div className={styles.claudeIntro}>{claudeIntro}</div>}
            {claudeTools.map((t, i) => (
              <div
                key={i}
                className={t.done ? styles.claudeDone : styles.claudeTool}>
                <span className={styles.toolGlyph}>{t.done ? '✓' : '●'}</span>{' '}
                {t.done ? (
                  <span>{t.target}</span>
                ) : (
                  <>
                    <span className={styles.toolVerb}>{t.verb}</span>
                    <span className={styles.toolTarget}>({t.target})</span>
                    {t.note && <span className={styles.toolNote}> {t.note}</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* timeline: a continuous rail with one dot per step at an even position; a fill
          bar + a single marker that SLIDES to the active step, so the viewer follows one
          moving "you are here" along the sequence. Dots are inset from both ends so the
          first/last are centered, not clipped. */}
      {(() => {
        const n = steps.length;
        const pct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
        const activePct = activeStep < 0 ? 0 : pct(activeStep);
        return (
          <div className={styles.timeline} aria-label="Walkthrough progress">
            <div className={styles.tlRail} />
            <div className={styles.tlFill} style={{width: `${activePct}%`}} />
            {steps.map((s, i) => (
              <span
                key={i}
                className={clsx(
                  styles.tlDot,
                  i < activeStep && styles.tlDone,
                  i === activeStep && styles.tlActive
                )}
                style={{left: `${pct(i)}%`}}
                title={s.say || `Step ${i + 1}`}
                aria-current={i === activeStep ? 'step' : undefined}
              />
            ))}
            <span className={styles.tlMarker} style={{left: `${activePct}%`}} />
          </div>
        );
      })()}

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => {
            if (playing) {
              // PAUSE: stop the animation in place.
              clearTimers();
              setPlaying(false);
              loopingRef.current = false;
            } else {
              // RESTART: the player isn't resumable mid-step (the sequence is imperative),
              // so this honestly restarts from the top — which loop()/play() already does.
              loopingRef.current = false;
              loop();
            }
          }}
          aria-label={playing ? 'Pause walkthrough' : 'Restart walkthrough'}>
          {playing ? '❚❚ Pause' : '↺ Restart'}
        </button>
        <span className={styles.caption}>{caption}</span>
      </div>
    </div>
  );
};

// Mirrors the live-typed comment text into the element matched by `selector` inside the
// app scene, without the mockup author having to wire state. Falls back to a no-op if the
// target isn't found.
const CommentInjector: React.FC<{
  selector: string;
  text: string;
  scope: React.RefObject<HTMLDivElement>;
}> = ({selector, text, scope}) => {
  useEffect(() => {
    const el = scope.current?.querySelector(selector) as HTMLElement | null;
    if (el) el.textContent = text;
  }, [selector, text, scope]);
  return null;
};

export default Walkthrough;
