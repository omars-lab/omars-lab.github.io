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

export type WalkStep =
  | {type: 'move'; target: string; say?: string; hold?: number}
  | {type: 'highlight'; target: string; say?: string; hold?: number}
  | {type: 'dragSelect'; target: string; say?: string; hold?: number}
  | {type: 'type'; target: string; text: string; say?: string; hold?: number}
  | {type: 'comment'; target: string; text: string; say?: string; hold?: number}
  | {type: 'click'; target: string; say?: string; hold?: number}
  | {type: 'scene'; to: 'app' | 'claude'; say?: string; hold?: number};

export interface ClaudeScene {
  prompt: string;
  steps: string[];
}

export interface WalkthroughProps {
  children: ReactNode; // the app scene (a <Mockup>)
  steps: WalkStep[];
  claude?: ClaudeScene; // the built-in Claude CLI scene
  stepHold?: number;
  autoPlay?: boolean;
  className?: string;
  style?: CSSProperties;
}

const Walkthrough: React.FC<WalkthroughProps> = ({
  children,
  steps,
  claude,
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
  const [claudeLines, setClaudeLines] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [playing, setPlaying] = useState(false);

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
    setClaudeLines([]);
  };

  const runStep = useCallback(
    async (step: WalkStep) => {
      setCaption(step.say || '');

      if (step.type === 'scene') {
        // crossfade scenes
        setScene(step.to);
        await wait(450);
        if (step.to === 'claude' && claude) {
          // type the prompt letter-by-letter, then stream the agent steps
          setClaudePrompt('');
          for (let i = 1; i <= claude.prompt.length; i++) {
            setClaudePrompt(claude.prompt.slice(0, i));
            await wait(22);
          }
          await wait(300);
          setClaudeLines([]);
          for (const line of claude.steps) {
            setClaudeLines((prev) => [...prev, line]);
            await wait(480);
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
    [rectOf, claude, reduced]
  );

  const play = useCallback(async () => {
    if (!steps.length) return;
    setPlaying(true);
    setScene('app');
    resetScene();
    await wait(300);
    for (const step of steps) {
      await runStep(step);
      await wait(step.hold ?? stepHold);
    }
    setPlaying(false);
  }, [steps, runStep, stepHold]);

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
              {scene === 'claude' && claudePrompt.length < (claude?.prompt.length ?? 0) && (
                <span className={styles.blink}>▋</span>
              )}
            </div>
            {claudeLines.map((l, i) => (
              <div key={i} className={styles.claudeLine}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => {
            if (playing) {
              clearTimers();
              setPlaying(false);
              loopingRef.current = false;
            } else {
              loop();
            }
          }}
          aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}>
          {playing ? '❚❚ Pause' : '▶ Play'}
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
