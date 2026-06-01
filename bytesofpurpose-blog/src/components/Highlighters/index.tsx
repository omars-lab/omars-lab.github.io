import React from 'react';

interface HighlightProps {
  children: React.ReactNode;
  /** Optional trailing label rendered after the highlighted text. */
  label?: React.ReactNode;
}

export const Highlight = ({children, label}: HighlightProps) => (
    <mark 
        style={{
            background: 'linear-gradient(90deg, #FFD8CB, #F9D29D)',
            padding: '0.45em 0.6em',
            margin: '0 0.25em',
            lineHeight: '1',
            borderRadius: '0.35em'
        }}>
        {children}
        <span 
            style={{
                fontSize: '0.8em',
                fontWeight: 'bold',
                lineHeight: '1',
                borderRadius: '0.35em',
                textTransform: 'uppercase',
                verticalAlign: 'middle',
                marginLeft: '0.5rem',
            }}>
            {label}
        </span>
    </mark>
);

