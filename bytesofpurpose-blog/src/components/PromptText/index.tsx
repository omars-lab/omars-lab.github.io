import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

/**
 * <PromptText>: a prompt shown exactly as the model got it.
 *
 * Monospace, with the site's copy button (it is the theme's CodeBlock underneath), but the lines
 * wrap: a prompt is prose, and a code block that scrolls sideways makes a reader drag to read it.
 *
 *   <PromptText text={`You are an AI agent helping ...`} />
 *   <PromptText>{`You are an AI agent helping ...`}</PromptText>
 *
 * Pass the text as a JS string (a template literal keeps the line breaks), not as bare MDX
 * children: MDX would read bare text as Markdown and change it. One leading and one trailing
 * line break are trimmed so a template literal can open and close on its own lines.
 */
export interface PromptTextProps {
  text?: string;
  children?: React.ReactNode;
  /** Optional caption above the block, e.g. "System prompt". */
  title?: string;
}

function asText(text: string | undefined, children: React.ReactNode): string {
  if (typeof text === 'string') return text;
  if (typeof children === 'string') return children;
  if (Array.isArray(children) && children.every((c) => typeof c === 'string')) return children.join('');
  return '';
}

export default function PromptText({text, children, title}: PromptTextProps): React.JSX.Element {
  const body = asText(text, children).replace(/^\r?\n/, '').replace(/\r?\n$/, '');
  return (
    <div className={styles.prompt}>
      <CodeBlock language="text" title={title}>
        {body}
      </CodeBlock>
    </div>
  );
}
