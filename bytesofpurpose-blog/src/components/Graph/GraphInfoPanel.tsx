/**
 * ============================================================================
 * GraphInfoPanel Component
 * ============================================================================
 * Side panel component displaying detailed information about selected nodes/edges.
 * ============================================================================
 */

import React from 'react';
import styles from './GraphRenderer.module.css';
import { cleanNodeForSelection } from './graphUtils';

export interface GraphInfoPanelProps {
  selectedNode: any;
  selectedEdge: any;
  graphData: any;
  expandedNodes: Set<string>;
  graphRef: React.RefObject<any>;
  graphId: string;
  isDarkMode: boolean;
  height: number;
  onNodeClick: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => void;
}

/**
 * Helper function to scroll to markdown section
 */
const scrollToMarkdownSection = (sectionId: string, isDarkMode: boolean) => {
  setTimeout(() => {
    let section = document.getElementById(sectionId);
    
    if (!section) {
      section = document.getElementById(`article-${sectionId}`);
    }
    
    if (!section) {
      section = document.querySelector(`[data-graph-node="${sectionId}"], [data-graph-edge="${sectionId}"]`) as HTMLElement;
    }
    
    if (section) {
      const rect = section.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
      
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
      
      section.style.transition = 'background-color 0.3s';
      section.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
      setTimeout(() => {
        section!.style.backgroundColor = '';
      }, 2000);
    } else {
      // Try to find by heading text
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of Array.from(headings)) {
        const headingEl = heading as HTMLElement;
        const headingId = headingEl.id || headingEl.getAttribute('data-graph-node') || headingEl.getAttribute('data-graph-edge');
        if (headingId === sectionId || 
            headingEl.textContent?.toLowerCase().includes(sectionId.toLowerCase())) {
          const rect = headingEl.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
          
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
          
          headingEl.style.transition = 'background-color 0.3s';
          headingEl.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
          setTimeout(() => {
            headingEl.style.backgroundColor = '';
          }, 2000);
          break;
        }
      }
    }
  }, 100);
};

/**
 * Formats external link text for display
 */
const formatLinkText = (link: string): string => {
  try {
    const url = new URL(link);
    let displayText = url.hostname.replace('www.', '');
    
    if (displayText.includes('github.com')) {
      const pathParts = url.pathname.split('/').filter(p => p);
      if (pathParts.length >= 2) {
        displayText = `GitHub: ${pathParts[0]}/${pathParts[1]}`;
      } else {
        displayText = 'GitHub';
      }
    } else if (displayText.includes('medium.com')) {
      displayText = 'Medium';
    } else if (displayText.includes('docs.')) {
      displayText = displayText.replace('docs.', '');
    }
    
    return displayText;
  } catch (e) {
    return link.length > 50 ? link.substring(0, 50) + '...' : link;
  }
};

/**
 * Side panel component displaying node/edge information.
 * 
 * @example
 * ```tsx
 * <GraphInfoPanel
 *   selectedNode={selectedNode}
 *   selectedEdge={null}
 *   graphData={graphData}
 *   expandedNodes={expandedNodes}
 *   graphRef={graphRef}
 *   graphId="my-graph"
 *   isDarkMode={false}
 *   height={600}
 *   onNodeClick={(id) => handleNodeClick(id)}
 *   onExpandNode={(id) => expandNode(id)}
 * />
 * ```
 */
export const GraphInfoPanel: React.FC<GraphInfoPanelProps> = ({
  selectedNode,
  selectedEdge,
  graphData,
  expandedNodes,
  graphRef,
  graphId,
  isDarkMode,
  height,
  onNodeClick,
  onExpandNode,
}) => {
  const linkStyle = {
    color: isDarkMode ? '#68BDF6' : '#2563eb',
    borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
  };

  const linkHoverStyle = {
    opacity: 0.7,
  };

  const panelTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';

  const handleNodeClick = (nodeId: string) => {
    const node = graphData.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      onNodeClick(nodeId);
      
      if (node.hasChildren && !expandedNodes.has(nodeId)) {
        onExpandNode(nodeId);
      }
      
      if (graphId) {
        window.location.hash = `#${graphId}-node-${nodeId}`;
      }
      
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        (graphRef.current as any)?.centerAt?.(node.x, node.y, 500);
      }
    }
  };

  if (selectedNode) {
    // Find ingress and egress links
    const ingressLinks = graphData.links.filter((link: any) => {
      const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
      return targetId === selectedNode.id;
    });
    
    const egressLinks = graphData.links.filter((link: any) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
      return sourceId === selectedNode.id;
    });

    const ingressNodes = ingressLinks.map((link: any) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
      return graphData.nodes.find((n: any) => n.id === sourceId);
    }).filter(Boolean);

    const egressNodes = egressLinks.map((link: any) => {
      const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
      return graphData.nodes.find((n: any) => n.id === targetId);
    }).filter(Boolean);

    return (
      <div 
        className={`${styles.sidePanel} ${isDarkMode ? styles.sidePanelDark : styles.sidePanelLight}`}
        style={{ height }}
      >
        <div>
          <h3 className={`${styles.panelTitle} ${isDarkMode ? styles.panelTitleDark : styles.panelTitleLight}`}>
            {selectedNode.title || selectedNode.name || selectedNode.id}
          </h3>
          
          {selectedNode.description && typeof selectedNode.description === 'string' ? (
            <p className={`${styles.panelDescription} ${isDarkMode ? styles.panelDescriptionDark : styles.panelDescriptionLight}`}>
              {selectedNode.description}
            </p>
          ) : (
            <p className={`${styles.panelDescription} ${styles.panelDescriptionEmpty} ${isDarkMode ? styles.panelDescriptionDark : styles.panelDescriptionLight}`}>
              No description
            </p>
          )}

          {/* Ingress Section */}
          {ingressNodes.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Ingress ({ingressNodes.length})
              </h4>
              <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                {ingressNodes.map((node: any, idx: number) => {
                  const link = ingressLinks[idx];
                  const linkLabel = link?.label || 'connected from';
                  return (
                    <div key={node.id} className={idx < ingressNodes.length - 1 ? styles.panelNodeItem : styles.panelNodeItemLast}>
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          handleNodeClick(node.id);
                        }}
                        className={`${styles.panelLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, linkHoverStyle);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <span className={styles.panelLinkText}>{node.title || node.name || node.id}</span>
                        {linkLabel && (
                          <span className={styles.panelLinkLabel}>
                            ({linkLabel})
                          </span>
                        )}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Egress Section */}
          {egressNodes.length > 0 && (
            <div>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Egress ({egressNodes.length})
              </h4>
              <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                {egressNodes.map((node: any, idx: number) => {
                  const link = egressLinks[idx];
                  const linkLabel = link?.label || 'connected to';
                  return (
                    <div key={node.id} className={idx < egressNodes.length - 1 ? styles.panelNodeItem : styles.panelNodeItemLast}>
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          handleNodeClick(node.id);
                        }}
                        className={`${styles.panelLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, linkHoverStyle);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <span className={styles.panelLinkText}>{node.title || node.name || node.id}</span>
                        {linkLabel && (
                          <span className={styles.panelLinkLabel}>
                            ({linkLabel})
                          </span>
                        )}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ingressNodes.length === 0 && egressNodes.length === 0 && (
            <p className={`${styles.panelNoConnections} ${isDarkMode ? styles.panelNoConnectionsDark : styles.panelNoConnectionsLight}`}>
              No connections
            </p>
          )}

          {/* External Links */}
          {(selectedNode as any).keyLinks && (selectedNode as any).keyLinks.length > 0 && (
            <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Learn More
              </h4>
              <div className={styles.panelExternalLinksContainer}>
                {(selectedNode as any).keyLinks.map((link: string, idx: number) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                    style={linkStyle}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, linkHoverStyle);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    title={link}
                  >
                    🔗 {formatLinkText(link)} →
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Markdown Section Link */}
          {selectedNode.markdownSection && (
            <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Documentation
              </h4>
              <a
                href={`#${selectedNode.markdownSection}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToMarkdownSection(selectedNode.markdownSection, isDarkMode);
                }}
                className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                style={linkStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, linkHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                📄 View in Documentation →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const sourceId = typeof selectedEdge.source === 'string' ? selectedEdge.source : (selectedEdge.source as any)?.id || String(selectedEdge.source);
    const targetId = typeof selectedEdge.target === 'string' ? selectedEdge.target : (selectedEdge.target as any)?.id || String(selectedEdge.target);
    
    const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
    const targetNode = graphData.nodes.find((n: any) => n.id === targetId);
    
    const sourceDisplayName = sourceNode?.title || sourceNode?.name || sourceId;
    const targetDisplayName = targetNode?.title || targetNode?.name || targetId;

    return (
      <div 
        className={`${styles.sidePanel} ${isDarkMode ? styles.sidePanelDark : styles.sidePanelLight}`}
        style={{ height }}
      >
        <div>
          <h3 className={`${styles.panelTitle} ${isDarkMode ? styles.panelTitleDark : styles.panelTitleLight}`}>
            {(selectedEdge as any).type === 'differentiating' 
              ? `${sourceDisplayName} vs. ${targetDisplayName}`
              : (selectedEdge.label || 'Edge')}
          </h3>

          {/* Source Node */}
          {sourceNode && (
            <div className={styles.panelEdgeSection}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Source
              </h4>
              <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleNodeClick(sourceNode.id);
                  }}
                  className={`${styles.panelLinkBase} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, linkHoverStyle);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span className={styles.panelLinkText}>{sourceNode.title || sourceNode.name || sourceNode.id}</span>
                </a>
                {sourceNode.description && (
                  <p className={`${styles.panelEdgeNodeDescription} ${isDarkMode ? styles.panelEdgeNodeDescriptionDark : styles.panelEdgeNodeDescriptionLight}`}>
                    {sourceNode.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Target Node */}
          {targetNode && (
            <div className={styles.panelEdgeSection}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Destination
              </h4>
              <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleNodeClick(targetNode.id);
                  }}
                  className={`${styles.panelLinkBase} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, linkHoverStyle);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span className={styles.panelLinkText}>{targetNode.title || targetNode.name || targetNode.id}</span>
                </a>
                {targetNode.description && (
                  <p className={`${styles.panelEdgeNodeDescription} ${isDarkMode ? styles.panelEdgeNodeDescriptionDark : styles.panelEdgeNodeDescriptionLight}`}>
                    {targetNode.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comparison Details for Differentiating Edges */}
          {(selectedEdge as any).type === 'differentiating' && (
            <>
              {/* Key Features */}
              {(selectedEdge as any).sourceData && (selectedEdge as any).targetData && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                  borderRadius: '4px',
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    color: panelTextColor,
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: 0.8,
                  }}>
                    Key Features
                  </h4>
                  <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: isDarkMode ? '#68BDF6' : '#0066cc' }}>
                        {sourceDisplayName}:
                      </strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                        {((selectedEdge as any).sourceData.key_features || []).map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: isDarkMode ? '#60BE86' : '#006600' }}>
                        {targetDisplayName}:
                      </strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                        {((selectedEdge as any).targetData.key_features || []).map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Similarities */}
              {(selectedEdge as any).similarities && (selectedEdge as any).similarities.length > 0 && (
                <div className={`${styles.panelSimilaritiesContainer} ${isDarkMode ? styles.panelSimilaritiesContainerDark : styles.panelSimilaritiesContainerLight}`}>
                  <h4 className={styles.panelSimilaritiesTitle}>Similarities</h4>
                  <ul className={styles.panelSimilaritiesList}>
                    {(selectedEdge as any).similarities.map((similarity: string, idx: number) => (
                      <li key={idx}>{similarity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Differences */}
              {(selectedEdge as any).differences && (
                <div className={`${styles.panelDifferencesContainer} ${isDarkMode ? styles.panelDifferencesContainerDark : styles.panelDifferencesContainerLight}`}>
                  <h4 className={styles.panelDifferencesTitle}>Differences</h4>
                  {(selectedEdge as any).differences.source && (selectedEdge as any).differences.source.length > 0 && (
                    <div className={styles.panelDifferencesSection}>
                      <strong className={`${styles.panelDifferencesLabel} ${isDarkMode ? styles.panelDifferencesLabelDark : styles.panelDifferencesLabelLight}`}>
                        {selectedEdge.source} only:
                      </strong>
                      <ul className={styles.panelDifferencesListWithMargin}>
                        {(selectedEdge as any).differences.source.map((diff: string, idx: number) => (
                          <li key={idx}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(selectedEdge as any).differences.target && (selectedEdge as any).differences.target.length > 0 && (
                    <div>
                      <strong className={`${styles.panelDifferencesLabel} ${isDarkMode ? styles.panelDifferencesLabelDark : styles.panelDifferencesLabelLight}`}>
                        {selectedEdge.target} only:
                      </strong>
                      <ul className={styles.panelDifferencesListWithMargin}>
                        {(selectedEdge as any).differences.target.map((diff: string, idx: number) => (
                          <li key={idx}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Markdown Section Link */}
          {selectedEdge.markdownSection && (
            <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
              <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                Documentation
              </h4>
              <a
                href={`#${selectedEdge.markdownSection}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToMarkdownSection(selectedEdge.markdownSection, isDarkMode);
                }}
                className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                style={linkStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, linkHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                📄 View in Documentation →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.sidePanel} ${isDarkMode ? styles.sidePanelDark : styles.sidePanelLight}`}
      style={{ height }}
    >
      <div className={`${styles.panelEmptyState} ${isDarkMode ? styles.panelEmptyStateDark : styles.panelEmptyStateLight}`}>
        Hover or click a node or edge
      </div>
    </div>
  );
};

