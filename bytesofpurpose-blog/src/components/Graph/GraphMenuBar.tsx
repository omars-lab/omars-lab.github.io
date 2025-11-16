/**
 * ============================================================================
 * GraphMenuBar Component
 * ============================================================================
 * Menu bar with controls for graph navigation and expansion.
 * ============================================================================
 */

import React from 'react';
import styles from './GraphRenderer.module.css';

export interface GraphMenuBarProps {
  onCenter: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onTogglePane: () => void;
  paneVisible: boolean;
  isDarkMode: boolean;
  menuBarHeight: number;
}

/**
 * Menu bar component with graph control buttons.
 * 
 * @example
 * ```tsx
 * <GraphMenuBar
 *   onCenter={() => centerGraph()}
 *   onExpandAll={() => expandAll()}
 *   onCollapseAll={() => collapseAll()}
 *   onTogglePane={() => togglePane()}
 *   paneVisible={true}
 *   isDarkMode={false}
 *   menuBarHeight={40}
 * />
 * ```
 */
export const GraphMenuBar: React.FC<GraphMenuBarProps> = ({
  onCenter,
  onExpandAll,
  onCollapseAll,
  onTogglePane,
  paneVisible,
  isDarkMode,
  menuBarHeight,
}) => {
  const buttonHoverColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div 
      className={`${styles.menuBarBase} ${styles.menuBar} ${isDarkMode ? styles.menuBarDark : styles.menuBarLight}`}
      style={{ height: menuBarHeight }}
    >
      <button
        onClick={onCenter}
        className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Center
      </button>
      <button
        onClick={onExpandAll}
        className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Expand All
      </button>
      <button
        onClick={onCollapseAll}
        className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Collapse All
      </button>
      <div className={styles.menuBarSpacer} />
      <button
        onClick={onTogglePane}
        className={`${styles.menuBarButton} ${styles.menuBarToggle} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {paneVisible ? 'Hide Pane' : 'Show Pane'}
      </button>
    </div>
  );
};

