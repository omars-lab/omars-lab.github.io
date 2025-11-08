import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph from 'force-graph';
import { useColorMode } from '@docusaurus/theme-common';

interface Node {
  id: string;
  label: string;
  title?: string;
  description?: string;
  group?: number;
  color?: string;
  children?: Node[];
}

interface Link {
  source: string;
  target: string;
  value?: number;
  label?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphRendererProps {
  data: GraphData;
  width?: number;
  height?: number;
  highlightNodeId?: string; // Optional node ID to highlight
  graphId?: string; // Optional unique ID for this graph instance (for URL hash support)
}

// Neo4j-like color palette
const NEO4J_COLORS = [
  '#68BDF6', // Neo4j blue
  '#60BE86', // Green
  '#FF6B6B', // Red
  '#FFD93D', // Yellow
  '#A78BFA', // Purple
  '#FB7185', // Pink
  '#34D399', // Emerald
  '#FBBF24', // Amber
];

const GraphRenderer: React.FC<GraphRendererProps> = ({ 
  data, 
  width = 800, 
  height = 600,
  highlightNodeId: propHighlightNodeId,
  graphId = 'graph'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [paneVisible, setPaneVisible] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const rightClickPositionRef = useRef<{ x: number; y: number } | null>(null);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';
  
  const menuBarHeight = 40;

  // Flatten nodes with children based on expansion state
  const flattenNodes = useCallback((nodes: Node[], expanded: Set<string>): { nodes: any[], links: any[] } => {
    const flattenedNodes: any[] = [];
    const flattenedLinks: any[] = [];
    const nodeMap = new Map<string, any>();

    const processNode = (node: Node, index: number, parentId?: string) => {
      const nodeData = {
        id: node.id,
        name: node.label,
        title: node.title || node.label,
        description: node.description,
        group: node.group ?? (index % NEO4J_COLORS.length),
        color: node.color ?? NEO4J_COLORS[index % NEO4J_COLORS.length],
        hasChildren: node.children && node.children.length > 0,
        isExpanded: expanded.has(node.id),
        originalNode: node,
      };
      
      flattenedNodes.push(nodeData);
      nodeMap.set(node.id, nodeData);

      // Add link to parent if exists
      if (parentId) {
        flattenedLinks.push({
          source: parentId,
          target: node.id,
          value: 1,
        });
      }

      // Process children if node is expanded
      if (node.children && expanded.has(node.id)) {
        node.children.forEach((child, childIndex) => {
          processNode(child, childIndex, node.id);
        });
      }
    };

    nodes.forEach((node, index) => {
      processNode(node, index);
    });

    // Add original links
    data.links.forEach(link => {
      flattenedLinks.push({
        source: link.source,
        target: link.target,
        value: link.value ?? 1,
        label: link.label,
      });
    });

    return { nodes: flattenedNodes, links: flattenedLinks };
  }, [data]);

  // Transform data to format expected by force-graph
  const graphData = useMemo(() => {
    return flattenNodes(data.nodes, expandedNodes);
  }, [data, expandedNodes, flattenNodes]);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Get all nodes with children
  const getAllNodesWithChildren = useCallback((): Set<string> => {
    const nodesWithChildren = new Set<string>();
    const traverse = (nodes: Node[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          nodesWithChildren.add(node.id);
          traverse(node.children);
        }
      });
    };
    traverse(data.nodes);
    return nodesWithChildren;
  }, [data]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    const allNodesWithChildren = getAllNodesWithChildren();
    setExpandedNodes(allNodesWithChildren);
  }, [getAllNodesWithChildren]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Auto center the graph
  const autoCenter = useCallback(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Calculate center of all nodes
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      graphData.nodes.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          minX = Math.min(minX, node.x);
          maxX = Math.max(maxX, node.x);
          minY = Math.min(minY, node.y);
          maxY = Math.max(maxY, node.y);
        }
      });

      if (minX !== Infinity) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Get current camera position
        const currentZoom = graphRef.current.zoom() || 1;
        const containerElement = containerRef.current?.parentElement;
        const actualWidth = containerElement ? containerElement.offsetWidth : width;
        const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
        const graphWidth = actualWidth - panelWidth;
        
        // Center the view
        graphRef.current.centerAt(centerX, centerY, 1000);
      }
    }
  }, [graphData, width, paneVisible]);

  // Toggle pane visibility
  const togglePane = useCallback(() => {
    setPaneVisible(prev => !prev);
  }, []);

  // Copy anchor link to clipboard
  const copyAnchorLink = useCallback(async (nodeId: string) => {
    const anchorLink = `${window.location.origin}${window.location.pathname}#${graphId}-node-${nodeId}`;
    try {
      await navigator.clipboard.writeText(anchorLink);
      // Close context menu
      setContextMenu(null);
      // Optional: Show a brief success message (you could add a toast notification here)
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: try using the older method
      const textArea = document.createElement('textarea');
      textArea.value = anchorLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setContextMenu(null);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  }, [graphId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [contextMenu]);

  // Find path to a node (all parent node IDs)
  const findPathToNode = useCallback((targetId: string, nodes: Node[], path: string[] = []): string[] | null => {
    for (const node of nodes) {
      const currentPath = [...path, node.id];
      
      if (node.id === targetId) {
        return currentPath;
      }
      
      if (node.children) {
        const found = findPathToNode(targetId, node.children, currentPath);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }, []);

  // Highlight a specific node by expanding parents and centering
  const highlightNode = useCallback((nodeId: string, scrollToGraph = false) => {
    if (!nodeId) return;
    
    // Scroll to graph if requested (for anchor links)
    if (scrollToGraph && outerContainerRef.current) {
      outerContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Find path to the node
    const path = findPathToNode(nodeId, data.nodes);
    if (!path) return; // Node not found
    
    // Expand all parent nodes (all nodes in path except the target)
    const parentsToExpand = path.slice(0, -1);
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      parentsToExpand.forEach(parentId => newSet.add(parentId));
      return newSet;
    });
    
    // Set highlighted node
    setHighlightedNodeId(nodeId);
  }, [data.nodes, findPathToNode]);

  // Handle URL hash changes
  useEffect(() => {
    const hashPrefix = `#${graphId}-node-`;
    
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith(hashPrefix)) {
        const nodeId = hash.substring(hashPrefix.length);
        highlightNode(nodeId, true); // Scroll to graph when hash changes
      }
    };
    
    // Check initial hash
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [graphId, highlightNode]);

  // Handle prop-based highlighting
  useEffect(() => {
    if (propHighlightNodeId) {
      highlightNode(propHighlightNodeId);
    }
  }, [propHighlightNodeId, highlightNode]);

  // Re-center on highlighted node when graph data updates (after expansion)
  useEffect(() => {
    if (highlightedNodeId && graphRef.current && graphData.nodes.length > 0) {
      // Wait for node to be positioned by force simulation
      const attemptCenter = (attempts = 0) => {
        if (attempts > 30) return; // Give up after 3 seconds
        
        setTimeout(() => {
          if (graphRef.current) {
            // Get the current graph data (may have updated positions)
            const currentGraphData = graphRef.current.graphData();
            const node = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
            
            if (node && node.x !== undefined && node.y !== undefined && 
                isFinite(node.x) && isFinite(node.y)) {
              // Center and zoom on the node
              graphRef.current.centerAt(node.x, node.y, 1000);
              graphRef.current.zoom(1.5, 1000);
              setSelectedNode(node);
            } else {
              // Node not yet positioned, try again
              attemptCenter(attempts + 1);
            }
          }
        }, 100);
      };
      
      attemptCenter();
    }
  }, [graphData, highlightedNodeId]);

  // Function to get and update graph width
  const updateGraphWidth = useCallback(() => {
    if (!containerRef.current || !graphRef.current) return;
    
    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;
    
    graphRef.current.width(graphWidth);
    graphRef.current.height(graphHeight);
  }, [width, height, paneVisible]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Theme-based colors
    const backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
    const borderColor = isDarkMode ? '#333' : '#e0e0e0';
    const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';
    const linkColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
    const arrowColor = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)';
    const nodeBorderColor = isDarkMode ? '#ffffff' : '#333333';

    // Get actual container width (use parent container if available, otherwise use prop)
    const containerElement = containerRef.current.parentElement;
    const actualWidth = containerElement ? containerElement.offsetWidth : width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Initialize force graph
    if (!graphRef.current) {
      graphRef.current = new ForceGraph(containerRef.current)
        .width(graphWidth)
        .height(graphHeight)
        .backgroundColor(backgroundColor)
        .nodeLabel((node: any) => `${node.title || node.name || node.id}`)
        .nodeVal((node: any) => node.hasChildren ? 12 : 8)
        .nodeColor((node: any) => node.color || '#68BDF6')
        .linkColor(() => linkColor)
        .linkWidth((link: any) => Math.sqrt(link.value || 1))
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalArrowColor(() => arrowColor)
        .onNodeClick((node: any) => {
          // Clear context menu if open
          setContextMenu(null);
          
          // Clear highlight if clicking a different node
          if (highlightedNodeId && highlightedNodeId !== node.id) {
            setHighlightedNodeId(null);
          }
          
          // Single click - toggle expansion if has children, otherwise select
          if (node.hasChildren) {
            toggleNodeExpansion(node.id);
          }
          // Always select the node to show details
          setSelectedNode(node);
        })
        .onNodeRightClick((node: any) => {
          // Use the stored right-click position
          if (rightClickPositionRef.current) {
            setContextMenu({ 
              x: rightClickPositionRef.current.x, 
              y: rightClickPositionRef.current.y, 
              nodeId: node.id 
            });
            rightClickPositionRef.current = null;
          }
        })
        .onNodeHover((node: any) => {
          // Show details on hover as well
          if (node) {
            setSelectedNode(node);
          }
        })
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          // Skip rendering if node coordinates are not valid
          if (node.x === undefined || node.y === undefined || 
              !isFinite(node.x) || !isFinite(node.y)) {
            return;
          }
          
          const label = node.title || node.name || node.id;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const isHighlighted = highlightedNodeId === node.id;
          const nodeRadius = node.hasChildren ? 12 : 8;
          
          // Draw highlight glow for highlighted nodes
          if (isHighlighted) {
            const glowRadius = nodeRadius + 4;
            const gradient = ctx.createRadialGradient(node.x, node.y, nodeRadius, node.x, node.y, glowRadius);
            gradient.addColorStop(0, isDarkMode ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.6)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
            ctx.fill();
          }
          
          // Draw node circle
          ctx.fillStyle = node.color || '#68BDF6';
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          ctx.fill();
          
          // Draw node border (thicker and colored for highlighted nodes)
          if (isHighlighted) {
            ctx.strokeStyle = isDarkMode ? '#FFD700' : '#FFA500';
            ctx.lineWidth = 4 / globalScale;
          } else {
            ctx.strokeStyle = nodeBorderColor;
            ctx.lineWidth = 2 / globalScale;
          }
          ctx.stroke();
          
          // Draw expand/collapse indicator for nodes with children
          if (node.hasChildren) {
            ctx.fillStyle = textColor;
            ctx.font = `${10 / globalScale}px Sans-Serif`;
            ctx.fillText(node.isExpanded ? '−' : '+', node.x, node.y);
          }
          
          // Draw label below node
          ctx.fillStyle = textColor;
          ctx.font = `${fontSize}px Sans-Serif`;
          const labelY = node.y + nodeRadius + fontSize + 2;
          ctx.fillText(label, node.x, labelY);
        })
        .cooldownTicks(100)
        .onEngineStop(() => {
          // Graph has stabilized
        });
    }

    // Update graph data and theme when they change
    if (graphRef.current && containerRef.current) {
      updateGraphWidth();
      graphRef.current.graphData(graphData);
      graphRef.current.backgroundColor(backgroundColor);
      graphRef.current.linkColor(() => linkColor);
      graphRef.current.linkDirectionalArrowColor(() => arrowColor);
      
      // Update node canvas object to use theme-aware colors
      graphRef.current.nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Skip rendering if node coordinates are not valid
        if (node.x === undefined || node.y === undefined || 
            !isFinite(node.x) || !isFinite(node.y)) {
          return;
        }
        
        const label = node.title || node.name || node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const isHighlighted = highlightedNodeId === node.id;
        const nodeRadius = node.hasChildren ? 12 : 8;
        
        // Draw highlight glow for highlighted nodes
        if (isHighlighted) {
          const glowRadius = nodeRadius + 4;
          const gradient = ctx.createRadialGradient(node.x, node.y, nodeRadius, node.x, node.y, glowRadius);
          gradient.addColorStop(0, isDarkMode ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.6)');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
          ctx.fill();
        }
        
        // Draw node circle
        ctx.fillStyle = node.color || '#68BDF6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        
        // Draw node border (thicker and colored for highlighted nodes)
        if (isHighlighted) {
          ctx.strokeStyle = isDarkMode ? '#FFD700' : '#FFA500';
          ctx.lineWidth = 4 / globalScale;
        } else {
          ctx.strokeStyle = nodeBorderColor;
          ctx.lineWidth = 2 / globalScale;
        }
        ctx.stroke();
        
        // Draw expand/collapse indicator for nodes with children
        if (node.hasChildren) {
          ctx.fillStyle = textColor;
          ctx.font = `${10 / globalScale}px Sans-Serif`;
          ctx.fillText(node.isExpanded ? '−' : '+', node.x, node.y);
        }
        
        // Draw label below node
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px Sans-Serif`;
        const labelY = node.y + nodeRadius + fontSize + 2;
        ctx.fillText(label, node.x, labelY);
      });
      
      // Force a redraw by reheating the simulation
      if (graphRef.current.d3ReheatSimulation) {
        graphRef.current.d3ReheatSimulation();
      }
    }

    // Setup resize observer to handle dynamic width changes
    const resizeObserver = new ResizeObserver(() => {
      updateGraphWidth();
    });
    
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    // Track right-click position on the canvas
    const handleCanvasContextMenu = (event: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        rightClickPositionRef.current = {
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
        };
      }
    };

    // Get the canvas element and add context menu listener
    // Use a small delay to ensure canvas is rendered
    const setupCanvasListener = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', handleCanvasContextMenu);
        return canvas;
      }
      return null;
    };

    let canvas: HTMLCanvasElement | null = null;
    const timeoutId = setTimeout(() => {
      canvas = setupCanvasListener();
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      if (canvas) {
        canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
      }
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [graphData, width, height, toggleNodeExpansion, isDarkMode, updateGraphWidth, paneVisible, highlightedNodeId]);

  const containerBorderColor = isDarkMode ? '#333' : '#e0e0e0';
  const containerBackgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
  const containerBoxShadow = isDarkMode 
    ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
    : '0 4px 6px rgba(0, 0, 0, 0.1)';
  
  const panelBackgroundColor = isDarkMode ? '#2a2a2a' : '#fafafa';
  const panelTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const panelBorderColor = isDarkMode ? '#555' : '#e0e0e0';
  const menuBarBackgroundColor = isDarkMode ? '#252525' : '#f0f0f0';
  const menuBarBorderColor = isDarkMode ? '#444' : '#ddd';
  const menuBarTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const buttonHoverColor = isDarkMode ? '#333' : '#e0e0e0';

  const graphHeight = height - menuBarHeight;
  const graphAreaHeight = height - menuBarHeight;

  return (
    <div 
      ref={outerContainerRef}
      style={{
        width: '100%',
        border: `1px solid ${containerBorderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: containerBackgroundColor,
        boxShadow: containerBoxShadow,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        height: graphAreaHeight,
        position: 'relative',
      }}>
        <div ref={containerRef} style={{ 
          flex: paneVisible ? '1 1 80%' : '1 1 100%', 
          minWidth: 0, 
          height: graphAreaHeight 
        }} />
        {contextMenu && (
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
              borderRadius: '4px',
              boxShadow: isDarkMode 
                ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '4px 0',
              minWidth: '180px',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={() => copyAnchorLink(contextMenu.nodeId)}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                color: isDarkMode ? '#ffffff' : '#1a1a1a',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#333' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              📋 Copy Anchor Link
            </button>
          </div>
        )}
        {paneVisible && (
          <div style={{
            flex: '0 0 20%',
            minWidth: 0,
            height: graphAreaHeight,
            borderLeft: `2px solid ${panelBorderColor}`,
            backgroundColor: panelBackgroundColor,
            padding: '12px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            {selectedNode ? (
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: panelTextColor,
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.4',
                }}>
                  {selectedNode.title || selectedNode.name || selectedNode.id}
                </h3>
                {selectedNode.description && (
                  <p style={{
                    margin: '0',
                    color: panelTextColor,
                    fontSize: '12px',
                    lineHeight: '1.5',
                    opacity: 0.85,
                  }}>
                    {selectedNode.description}
                  </p>
                )}
                {!selectedNode.description && (
                  <p style={{
                    margin: '0',
                    color: panelTextColor,
                    fontSize: '12px',
                    lineHeight: '1.5',
                    opacity: 0.5,
                    fontStyle: 'italic',
                  }}>
                    No description
                  </p>
                )}
              </div>
            ) : (
              <div style={{
                color: panelTextColor,
                fontSize: '12px',
                opacity: 0.5,
                fontStyle: 'italic',
              }}>
                Hover or click a node
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{
        height: menuBarHeight,
        borderTop: `1px solid ${menuBarBorderColor}`,
        backgroundColor: menuBarBackgroundColor,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        boxSizing: 'border-box',
      }}>
        <button
          onClick={autoCenter}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
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
          onClick={expandAll}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
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
          onClick={collapseAll}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Collapse All
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={togglePane}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
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
    </div>
  );
};

export default GraphRenderer;

