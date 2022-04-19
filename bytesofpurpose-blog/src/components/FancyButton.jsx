// https://docusaurus.io/docs/styling-layout#css-modules
// https://codepen.io/merkund/pen/EGpOEr

import React from 'react';
import styles from '../css/FancyButton.module.css';

export const FancyButton = ({children}) => (
    <button 
        className={styles.FancyButton}
    >
        {children}
    </button>
);