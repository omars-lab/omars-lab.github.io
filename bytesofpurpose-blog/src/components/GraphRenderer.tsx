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
  height = 600 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [paneVisible, setPaneVisible] = useState<boolean>(true);
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
          // Single click - toggle expansion if has children, otherwise select
          if (node.hasChildren) {
            toggleNodeExpansion(node.id);
          }
          // Always select the node to show details
          setSelectedNode(node);
        })
        .onNodeHover((node: any) => {
          // Show details on hover as well
          if (node) {
            setSelectedNode(node);
          }
        })
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.title || node.name || node.id;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw node circle
          const nodeRadius = node.hasChildren ? 12 : 8;
          ctx.fillStyle = node.color || '#68BDF6';
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          ctx.fill();
          
          // Draw node border
          ctx.strokeStyle = nodeBorderColor;
          ctx.lineWidth = 2 / globalScale;
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
        const label = node.title || node.name || node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw node circle
        const nodeRadius = node.hasChildren ? 12 : 8;
        ctx.fillStyle = node.color || '#68BDF6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        
        // Draw node border
        ctx.strokeStyle = nodeBorderColor;
        ctx.lineWidth = 2 / globalScale;
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

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [graphData, width, height, toggleNodeExpansion, isDarkMode, updateGraphWidth, paneVisible]);

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
    <div style={{
      width: '100%',
      border: `1px solid ${containerBorderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: containerBackgroundColor,
      boxShadow: containerBoxShadow,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        height: graphAreaHeight,
      }}>
        <div ref={containerRef} style={{ 
          flex: paneVisible ? '1 1 80%' : '1 1 100%', 
          minWidth: 0, 
          height: graphAreaHeight 
        }} />
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

