import React from 'react';

export const Highlight = ({children, label}) => (
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

