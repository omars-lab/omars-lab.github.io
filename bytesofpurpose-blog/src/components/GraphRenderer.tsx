import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph from 'force-graph';
import { useColorMode } from '@docusaurus/theme-common';
import * as d3 from 'd3-force';

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
  id?: string; // Optional ID for anchor links
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
  highlightEdgeId?: string; // Optional edge ID to highlight
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
  highlightEdgeId: propHighlightEdgeId,
  graphId = 'graph'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const isAdjustingZoomRef = useRef<boolean>(false);
  const previousZoomRef = useRef<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [paneVisible, setPaneVisible] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>(null);
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
          id: `${parentId}-${node.id}`, // Generate ID for parent-child links
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
    data.links.forEach((link, index) => {
      flattenedLinks.push({
        source: link.source,
        target: link.target,
        value: link.value ?? 1,
        label: link.label,
        id: link.id || `${link.source}-${link.target}-${index}`, // Generate ID if not provided
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
  const copyAnchorLink = useCallback(async (nodeId?: string, edgeId?: string) => {
    let anchorLink: string;
    if (nodeId) {
      anchorLink = `${window.location.origin}${window.location.pathname}#${graphId}-node-${nodeId}`;
    } else if (edgeId) {
      anchorLink = `${window.location.origin}${window.location.pathname}#${graphId}-edge-${edgeId}`;
    } else {
      return;
    }
    
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

  // Highlight a specific edge
  const highlightEdge = useCallback((edgeId: string, scrollToGraph = false) => {
    if (!edgeId) return;
    
    // Scroll to graph if requested (for anchor links)
    if (scrollToGraph && outerContainerRef.current) {
      outerContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Set highlighted edge
    setHighlightedEdgeId(edgeId);
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const nodeHashPrefix = `#${graphId}-node-`;
    const edgeHashPrefix = `#${graphId}-edge-`;
    
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith(nodeHashPrefix)) {
        const nodeId = hash.substring(nodeHashPrefix.length);
        highlightNode(nodeId, true); // Scroll to graph when hash changes
      } else if (hash.startsWith(edgeHashPrefix)) {
        const edgeId = hash.substring(edgeHashPrefix.length);
        highlightEdge(edgeId, true); // Scroll to graph when hash changes
      }
    };
    
    // Check initial hash
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [graphId, highlightNode, highlightEdge]);

  // Handle prop-based highlighting
  useEffect(() => {
    if (propHighlightNodeId) {
      highlightNode(propHighlightNodeId);
    }
  }, [propHighlightNodeId, highlightNode]);

  useEffect(() => {
    if (propHighlightEdgeId) {
      highlightEdge(propHighlightEdgeId);
    }
  }, [propHighlightEdgeId, highlightEdge]);

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

  // Calculate bounding box of all visible nodes
  const calculateNodeBoundingBox = useCallback(() => {
    if (!graphRef.current) return null;
    
    const currentGraphData = graphRef.current.graphData();
    if (!currentGraphData || !currentGraphData.nodes || currentGraphData.nodes.length === 0) {
      return null;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let validNodes = 0;

    currentGraphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && 
          isFinite(node.x) && isFinite(node.y)) {
        const nodeRadius = node.hasChildren ? 12 : 8;
        minX = Math.min(minX, node.x - nodeRadius);
        minY = Math.min(minY, node.y - nodeRadius);
        maxX = Math.max(maxX, node.x + nodeRadius);
        maxY = Math.max(maxY, node.y + nodeRadius);
        validNodes++;
      }
    });

    if (validNodes === 0) return null;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, []);

  // Check if zoom out would make cluster < 25% of viewport
  const canZoomOut = useCallback((newZoom: number) => {
    if (!graphRef.current || !containerRef.current) return true;
    
    const bbox = calculateNodeBoundingBox();
    if (!bbox) return true;

    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return true;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Calculate what the bounding box would be at the new zoom level
    // The bounding box size in screen space = bbox size * zoom
    const screenWidth = bbox.width * newZoom;
    const screenHeight = bbox.height * newZoom;

    // Calculate percentage of viewport
    const viewportArea = graphWidth * graphHeight;
    const clusterArea = screenWidth * screenHeight;
    const percentage = (clusterArea / viewportArea) * 100;

    // Allow zoom out if cluster would still be >= 25% of viewport
    return percentage >= 25;
  }, [calculateNodeBoundingBox, width, height, paneVisible]);

  // Check if zoom in would result in only one node visible
  // Allow zooming in much more - only prevent if a single node would take up >90% of viewport
  const canZoomIn = useCallback((newZoom: number) => {
    if (!graphRef.current || !containerRef.current) return true;
    
    const currentGraphData = graphRef.current.graphData();
    if (!currentGraphData || !currentGraphData.nodes || currentGraphData.nodes.length <= 1) {
      return true; // If there's only one node or none, allow zoom
    }

    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return true;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Calculate viewport bounds in graph coordinates at new zoom
    const viewportGraphWidth = graphWidth / newZoom;
    const viewportGraphHeight = graphHeight / newZoom;

    // Get the current camera position
    let centerX: number, centerY: number;
    
    if (graphRef.current.screen2GraphCoords) {
      const center = graphRef.current.screen2GraphCoords(graphWidth / 2, graphHeight / 2);
      centerX = center.x;
      centerY = center.y;
    } else {
      const bbox = calculateNodeBoundingBox();
      if (!bbox) return true;
      centerX = bbox.centerX;
      centerY = bbox.centerY;
    }

    const halfWidth = viewportGraphWidth / 2;
    const halfHeight = viewportGraphHeight / 2;

    // Count visible nodes and find the largest node in viewport
    let visibleNodes = 0;
    let maxNodeSize = 0;
    currentGraphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && 
          isFinite(node.x) && isFinite(node.y)) {
        const nodeRadius = node.hasChildren ? 12 : 8;
        const nodeDiameter = nodeRadius * 2;
        
        // Check if node is within viewport bounds
        if (node.x - nodeRadius >= centerX - halfWidth &&
            node.x + nodeRadius <= centerX + halfWidth &&
            node.y - nodeRadius >= centerY - halfHeight &&
            node.y + nodeRadius <= centerY + halfHeight) {
          visibleNodes++;
          maxNodeSize = Math.max(maxNodeSize, nodeDiameter);
        }
      }
    });

    // Allow zoom in unless a single node would take up more than 90% of viewport
    if (visibleNodes === 1) {
      // Calculate the screen size of the node at the new zoom level
      const nodeScreenSize = maxNodeSize * newZoom;
      // Calculate the viewport size in screen coordinates
      const viewportScreenSize = Math.min(graphWidth, graphHeight);
      const nodePercentage = (nodeScreenSize / viewportScreenSize) * 100;
      
      // Prevent zoom if node would take up more than 90% of viewport
      if (nodePercentage >= 90) {
        return false;
      }
    }

    // If multiple nodes visible, always allow zoom
    return true;
  }, [calculateNodeBoundingBox, width, height, paneVisible]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Theme-based colors
    const backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
    const borderColor = isDarkMode ? '#333' : '#e0e0e0';
    const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';
    const linkColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    const arrowColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
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
        .linkWidth((link: any) => Math.max(2, Math.sqrt(link.value || 1) * 2))
        .linkDirectionalArrowLength(6)
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalArrowColor(() => arrowColor)
        .d3Force('link', d3.forceLink().id((d: any) => d.id).distance(50))
        .d3Force('charge', d3.forceManyBody().strength(-200))
        .d3Force('collision', d3.forceCollide().radius((d: any) => {
          const nodeRadius = d.hasChildren ? 12 : 8;
          return nodeRadius + 5; // Add padding around nodes
        }))
        .onNodeClick((node: any) => {
          // Clear context menu if open
          setContextMenu(null);
          
          // Clear edge highlight if any
          if (highlightedEdgeId) {
            setHighlightedEdgeId(null);
          }
          
          // Highlight the clicked node
          setHighlightedNodeId(node.id);
          
          // Update URL fragment to reflect the selected node
          if (graphId) {
            window.location.hash = `#${graphId}-node-${node.id}`;
          }
          
          // Single click - toggle expansion if has children, otherwise select
          if (node.hasChildren) {
            toggleNodeExpansion(node.id);
          }
          // Always select the node to show details
          setSelectedNode(node);
          setSelectedEdge(null);
        })
        .onNodeRightClick((node: any) => {
          // Use the stored right-click position
          if (rightClickPositionRef.current) {
            setContextMenu({ 
              x: rightClickPositionRef.current.x, 
              y: rightClickPositionRef.current.y, 
              nodeId: node.id,
              edgeId: undefined
            });
            rightClickPositionRef.current = null;
          }
        })
        .onLinkClick((link: any) => {
          // Clear context menu if open
          setContextMenu(null);
          
          // Clear highlights if clicking a different edge
          if (highlightedEdgeId && highlightedEdgeId !== link.id) {
            setHighlightedEdgeId(null);
          }
          if (highlightedNodeId) {
            setHighlightedNodeId(null);
          }
          
          // Select the edge
          setSelectedEdge(link);
          setSelectedNode(null);
        })
        .onLinkRightClick((link: any) => {
          // Use the stored right-click position
          if (rightClickPositionRef.current) {
            setContextMenu({ 
              x: rightClickPositionRef.current.x, 
              y: rightClickPositionRef.current.y, 
              edgeId: link.id,
              nodeId: undefined
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
          
          // Draw emoji indicator and text inside node
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Determine emoji based on node type
          let emoji: string;
          if (node.hasChildren) {
            emoji = node.isExpanded ? '▼' : '▶'; // Expanded vs collapsed (down arrow vs right arrow)
          } else {
            emoji = '🍃'; // Leaf node
          }
          
          // Scale font size proportionally to node radius and zoom level
          // Best practice: Use logarithmic scaling to maintain good text-to-node ratio
          // Base font size proportional to node radius
          const baseFontSize = nodeRadius * 0.4; // Proportional to node size
          
          // Use logarithmic scaling for text: grows slower than linear zoom
          // This keeps text readable and proportional to node size at all zoom levels
          // Handle both zoom in (globalScale > 1) and zoom out (globalScale < 1)
          const textScale = globalScale > 1 
            ? 1 + Math.log(globalScale) * 0.4  // Logarithmic growth when zoomed in
            : Math.max(0.5, globalScale * 0.8); // Linear scaling when zoomed out (but slower)
          const fontSize = Math.max(5, Math.min(12, baseFontSize * textScale)); // Clamp between 5-12px
          
          // Emoji uses even more conservative scaling
          const emojiScale = globalScale > 1
            ? 1 + Math.log(globalScale) * 0.25  // Very conservative growth
            : Math.max(0.6, globalScale * 0.9); // Less shrinkage when zoomed out
          const emojiFontSize = Math.max(5, Math.min(10, nodeRadius * 0.35 * emojiScale)); // Reduced from 0.5 to 0.35, and max from 14 to 10
          
          // Only show title for leaf nodes
          if (!node.hasChildren) {
            // Ensure we have a label to display
            const labelStr = String(label || node.id || '');
            if (!labelStr) return; // Skip if no label at all
            
            // Set font before measuring (important for accurate measurements)
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Calculate available width for title (full diameter minus padding)
            // Use actual node size - text must stay within node boundaries
            // Font size uses logarithmic scaling, so when zoomed in, text grows slower than zoom,
            // allowing more characters to fit naturally without scaling available width
            const padding = 6; // Fixed padding in screen pixels
            const availableWidth = (nodeRadius * 2) - padding;
            
            // Measure text and truncate if needed (only need to fit title now)
            let displayLabel = labelStr;
            let textWidth = ctx.measureText(displayLabel).width;
            
            // Only truncate if text is actually too wide for the available space
            // Since font size uses logarithmic scaling, when zoomed in enough, the text will
            // naturally fit within the node and ellipsis will disappear
            if (textWidth > availableWidth && labelStr.length > 0) {
              const ellipsis = '...';
              ctx.font = `${fontSize}px Sans-Serif`; // Ensure font is set for measurement
              const ellipsisWidth = ctx.measureText(ellipsis).width;
              const maxTextWidth = availableWidth - ellipsisWidth;
              
              // Binary search for the right length - ensure text + ellipsis fits within node
              let low = 0;
              let high = labelStr.length;
              while (low < high) {
                const mid = Math.floor((low + high) / 2);
                const truncated = labelStr.substring(0, mid) + ellipsis;
                textWidth = ctx.measureText(truncated).width;
                
                if (textWidth <= maxTextWidth) {
                  low = mid + 1;
                } else {
                  high = mid;
                }
              }
              displayLabel = labelStr.substring(0, Math.max(0, low - 1)) + ellipsis;
              // Verify final width doesn't exceed available width
              textWidth = ctx.measureText(displayLabel).width;
              if (textWidth > availableWidth) {
                // If still too wide, truncate more aggressively
                displayLabel = ellipsis;
              }
            }
            
            // Always render title if we have a label (remove fontSize check to ensure visibility)
            if (displayLabel) {
              // Calculate vertical spacing - title at center of node, badge at bottom
              const titleY = node.y; // Title at center of node
              
              // Badge should be at bottom of node and not exceed 1/20 of node diameter
              const maxBadgeSize = (nodeRadius * 2) / 20; // 1/20 of node diameter
              const badgeSize = Math.min(emojiFontSize * 1.2, maxBadgeSize); // Limit badge size
              const badgeRadius = badgeSize / 2;
              
              // Position badge at bottom of node with small margin
              const margin = 2;
              const maxBadgeBottom = node.y + nodeRadius - margin;
              let emojiY = maxBadgeBottom - badgeRadius; // Badge at bottom
              
              // Ensure badge doesn't overlap with title
              const titleBottom = node.y + fontSize / 2;
              if (emojiY - badgeRadius <= titleBottom) {
                // Badge would overlap with title, skip badge rendering
                emojiY = null; // Use null as flag to skip badge
              }
              
              // Draw title at center of node
              ctx.font = `${fontSize}px Sans-Serif`;
              
              // Add text shadow for better visibility
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 2;
              ctx.shadowOffsetX = 0.5;
              ctx.shadowOffsetY = 0.5;
              
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(displayLabel, node.x, titleY);
              
              // Reset shadow
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              // Draw emoji below title (only if it fits within node)
              if (emojiY !== null) {
                // Draw emoji - centered horizontally, at bottom of node
                ctx.font = `${emojiFontSize}px Sans-Serif`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Move emoji up slightly to keep it within node
                const emojiOffsetY = 1; // Small upward offset
                ctx.fillText(emoji, node.x, emojiY - emojiOffsetY);
              }
            }
          } else {
            // For nodes with children, only show emoji badge (no title)
            // Badge should be at bottom of node and not exceed 1/20 of node diameter
            const maxBadgeSize = (nodeRadius * 2) / 20; // 1/20 of node diameter
            const badgeSize = Math.min(emojiFontSize * 1.2, maxBadgeSize); // Limit badge size
            const badgeRadius = badgeSize / 2;
            
            // Position badge at bottom of node with small margin
            const margin = 2;
            const badgeY = node.y + nodeRadius - margin - badgeRadius; // Badge at bottom
            
            // Draw badge background (rounded rectangle)
            ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
            const badgeX = node.x - badgeRadius;
            const cornerRadius = badgeRadius * 0.3;
            ctx.beginPath();
            ctx.moveTo(badgeX + cornerRadius, badgeY);
            ctx.lineTo(badgeX + badgeSize - cornerRadius, badgeY);
            ctx.quadraticCurveTo(badgeX + badgeSize, badgeY, badgeX + badgeSize, badgeY + cornerRadius);
            ctx.lineTo(badgeX + badgeSize, badgeY + badgeSize - cornerRadius);
            ctx.quadraticCurveTo(badgeX + badgeSize, badgeY + badgeSize, badgeX + badgeSize - cornerRadius, badgeY + badgeSize);
            ctx.lineTo(badgeX + cornerRadius, badgeY + badgeSize);
            ctx.quadraticCurveTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - cornerRadius);
            ctx.lineTo(badgeX, badgeY + cornerRadius);
            ctx.quadraticCurveTo(badgeX, badgeY, badgeX + cornerRadius, badgeY);
            ctx.closePath();
            ctx.fill();
            
            // Draw badge border
            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw emoji in badge
            ctx.font = `${emojiFontSize}px Sans-Serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, node.x, node.y);
          }
        })
        .linkCanvasObjectMode(() => 'after')
        .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isHighlighted = highlightedEdgeId === link.id;
          
          // Draw edge label if it exists
          if (link.label && link.source && link.target) {
            // Get nodes from the graph's current data
            const currentData = graphRef.current?.graphData();
            const startNode = currentData?.nodes?.find((n: any) => n.id === link.source);
            const endNode = currentData?.nodes?.find((n: any) => n.id === link.target);
            
            if (startNode && endNode && 
                startNode.x !== undefined && startNode.y !== undefined &&
                endNode.x !== undefined && endNode.y !== undefined &&
                isFinite(startNode.x) && isFinite(startNode.y) &&
                isFinite(endNode.x) && isFinite(endNode.y)) {
              // Calculate midpoint of the edge
              const midX = (startNode.x + endNode.x) / 2;
              const midY = (startNode.y + endNode.y) / 2;
              
              // Draw background for label
              const fontSize = 10 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(link.label).width;
              const padding = 4 / globalScale;
              
              ctx.fillStyle = isHighlighted 
                ? (isDarkMode ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.9)')
                : (isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
              ctx.fillRect(
                midX - textWidth / 2 - padding,
                midY - fontSize / 2 - padding,
                textWidth + padding * 2,
                fontSize + padding * 2
              );
              
              // Draw label text
              ctx.fillStyle = isHighlighted
                ? (isDarkMode ? '#000000' : '#000000')
                : (isDarkMode ? '#ffffff' : '#1a1a1a');
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(link.label, midX, midY);
            }
          }
        })
        .linkColor((link: any) => {
          if (highlightedEdgeId === link.id) {
            return isDarkMode ? '#FFD700' : '#FFA500';
          }
          return linkColor;
        })
        .linkWidth((link: any) => {
          const baseWidth = Math.sqrt(link.value || 1);
          return highlightedEdgeId === link.id ? baseWidth * 2 : baseWidth;
        })
        .cooldownTicks(100)
        .onEngineStop(() => {
          // Graph has stabilized
        })
        .onZoom((transform: { k: number; x: number; y: number }) => {
          // Intercept zoom changes and enforce limits
          if (!graphRef.current || isAdjustingZoomRef.current) {
            previousZoomRef.current = transform.k;
            return;
          }
          
          const newZoom = transform.k;
          const previousZoom = previousZoomRef.current;
          
          // Check zoom limits
          if (newZoom < previousZoom) {
            // Zooming out - check if allowed
            if (!canZoomOut(newZoom)) {
              // Prevent zoom out - revert to previous zoom
              isAdjustingZoomRef.current = true;
              graphRef.current.zoom(previousZoom, 0);
              setTimeout(() => {
                isAdjustingZoomRef.current = false;
              }, 10);
              return;
            }
          } else if (newZoom > previousZoom) {
            // Zooming in - check if allowed
            if (!canZoomIn(newZoom)) {
              // Prevent zoom in - revert to previous zoom
              isAdjustingZoomRef.current = true;
              graphRef.current.zoom(previousZoom, 0);
              setTimeout(() => {
                isAdjustingZoomRef.current = false;
              }, 10);
              return;
            }
          }
          
          // Update previous zoom if zoom was allowed
          previousZoomRef.current = newZoom;
        });
    }

    // Update graph data and theme when they change
    if (graphRef.current && containerRef.current) {
      updateGraphWidth();
      graphRef.current.graphData(graphData);
      graphRef.current.backgroundColor(backgroundColor);
      graphRef.current.linkColor(() => linkColor);
      graphRef.current.linkDirectionalArrowColor(() => arrowColor);
      
      // Ensure onZoom callback is set (in case it was overwritten)
      graphRef.current.onZoom((transform: { k: number; x: number; y: number }) => {
        // Intercept zoom changes and enforce limits
        if (!graphRef.current || isAdjustingZoomRef.current) {
          previousZoomRef.current = transform.k;
          return;
        }
        
        const newZoom = transform.k;
        const previousZoom = previousZoomRef.current;
        
        // Check zoom limits
        if (newZoom < previousZoom) {
          // Zooming out - check if allowed
          if (!canZoomOut(newZoom)) {
            // Prevent zoom out - revert to previous zoom
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(previousZoom, 0);
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
            }, 10);
            return;
          }
        } else if (newZoom > previousZoom) {
          // Zooming in - check if allowed
          if (!canZoomIn(newZoom)) {
            // Prevent zoom in - revert to previous zoom
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(previousZoom, 0);
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
            }, 10);
            return;
          }
        }
        
        // Update previous zoom if zoom was allowed
        previousZoomRef.current = newZoom;
      });
      
      // Initialize previous zoom ref if not set
      if (previousZoomRef.current === 1) {
        const currentZoom = graphRef.current.zoom();
        if (currentZoom) {
          previousZoomRef.current = currentZoom;
        }
      }
      
      // Update node canvas object to use theme-aware colors
      graphRef.current.nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Skip rendering if node coordinates are not valid
        if (node.x === undefined || node.y === undefined || 
            !isFinite(node.x) || !isFinite(node.y)) {
          return;
        }
        
        const label = node.title || node.name || node.id;
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
        
        // Draw emoji indicator and text inside node
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Determine emoji based on node type
        // Check expanded state directly from expandedNodes to ensure it's up to date
        const isExpanded = expandedNodes.has(node.id);
        let emoji: string;
        if (node.hasChildren) {
          emoji = isExpanded ? '▼' : '▶'; // Expanded vs collapsed (down arrow vs right arrow)
        } else {
          emoji = '🌿'; // Laf node
        }
        
        // Scale font size proportionally to node radius and zoom level
        // Best practice: Use logarithmic scaling to maintain good text-to-node ratio
        // Base font size proportional to node radius
        const baseFontSize = nodeRadius * 0.4; // Proportional to node size
        
        // Use logarithmic scaling for text: grows slower than linear zoom
        // This keeps text readable and proportional to node size at all zoom levels
        // Handle both zoom in (globalScale > 1) and zoom out (globalScale < 1)
        const textScale = globalScale > 1 
          ? 1 + Math.log(globalScale) * 0.4  // Logarithmic growth when zoomed in
          : Math.max(0.5, globalScale * 0.8); // Linear scaling when zoomed out (but slower)
        const fontSize = Math.max(5, Math.min(12, baseFontSize * textScale)); // Clamp between 5-12px
        
        // Emoji uses even more conservative scaling
        const emojiScale = globalScale > 1
          ? 1 + Math.log(globalScale) * 0.25  // Very conservative growth
          : Math.max(0.6, globalScale * 0.9); // Less shrinkage when zoomed out
        const emojiFontSize = Math.max(5, Math.min(10, nodeRadius * 0.35 * emojiScale)); // Reduced from 0.5 to 0.35, and max from 14 to 10
        
        // Only show title for leaf nodes
        if (!node.hasChildren) {
          // Ensure we have a label to display
          const labelStr = String(label || node.id || '');
          if (!labelStr) return; // Skip if no label at all
          
          // Set font before measuring (important for accurate measurements)
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // Calculate available width for title (full diameter minus padding)
          // Use actual node size - text must stay within node boundaries
          // Font size uses logarithmic scaling, so when zoomed in, text grows slower than zoom,
          // allowing more characters to fit naturally without scaling available width
          const padding = 6; // Fixed padding in screen pixels
          const availableWidth = (nodeRadius * 2) - padding;
          
          // Measure text and truncate if needed (only need to fit title now)
          let displayLabel = labelStr;
          let textWidth = ctx.measureText(displayLabel).width;
          
          // Only truncate if text is actually too wide for the available space
          // Since font size uses logarithmic scaling, when zoomed in enough, the text will
          // naturally fit within the node and ellipsis will disappear
          if (textWidth > availableWidth && labelStr.length > 0) {
            const ellipsis = '...';
            ctx.font = `${fontSize}px Sans-Serif`; // Ensure font is set for measurement
            const ellipsisWidth = ctx.measureText(ellipsis).width;
            const maxTextWidth = availableWidth - ellipsisWidth;
            
            // Binary search for the right length - ensure text + ellipsis fits within node
            let low = 0;
            let high = labelStr.length;
            while (low < high) {
              const mid = Math.floor((low + high) / 2);
              const truncated = labelStr.substring(0, mid) + ellipsis;
              textWidth = ctx.measureText(truncated).width;
              
              if (textWidth <= maxTextWidth) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            displayLabel = labelStr.substring(0, Math.max(0, low - 1)) + ellipsis;
            // Verify final width doesn't exceed available width
            textWidth = ctx.measureText(displayLabel).width;
            if (textWidth > availableWidth) {
              // If still too wide, truncate more aggressively
              displayLabel = ellipsis;
            }
          }
          
          // Always render title if we have a label (remove fontSize check to ensure visibility)
          if (displayLabel) {
            // Calculate vertical spacing - title at center of node, badge at bottom
            const titleY = node.y; // Title at center of node
            
            // Badge should be at bottom of node and not exceed 1/20 of node diameter
            const maxBadgeSize = (nodeRadius * 2) / 20; // 1/20 of node diameter
            const badgeSize = Math.min(emojiFontSize * 1.2, maxBadgeSize); // Limit badge size
            const badgeRadius = badgeSize / 2;
            
            // Position badge at bottom of node with small margin
            const margin = 2;
            const maxBadgeBottom = node.y + nodeRadius - margin;
            let emojiY = maxBadgeBottom - badgeRadius; // Badge at bottom
            
            // Ensure badge doesn't overlap with title
            const titleBottom = node.y + fontSize / 2;
            if (emojiY - badgeRadius <= titleBottom) {
              // Badge would overlap with title, skip badge rendering
              emojiY = null; // Use null as flag to skip badge
            }
            
            // Draw title at center of node
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Add text shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 0.5;
            ctx.shadowOffsetY = 0.5;
            
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayLabel, node.x, titleY);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw emoji badge below title (only if it fits within node)
            if (emojiY !== null) {
              // Draw badge background (rounded rectangle) - centered at emojiY
              ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
              const badgeX = node.x - badgeRadius;
              const badgeY = emojiY - badgeRadius; // Center badge at emojiY
              const cornerRadius = badgeRadius * 0.3;
              ctx.beginPath();
              ctx.moveTo(badgeX + cornerRadius, badgeY);
              ctx.lineTo(badgeX + badgeSize - cornerRadius, badgeY);
              ctx.quadraticCurveTo(badgeX + badgeSize, badgeY, badgeX + badgeSize, badgeY + cornerRadius);
              ctx.lineTo(badgeX + badgeSize, badgeY + badgeSize - cornerRadius);
              ctx.quadraticCurveTo(badgeX + badgeSize, badgeY + badgeSize, badgeX + badgeSize - cornerRadius, badgeY + badgeSize);
              ctx.lineTo(badgeX + cornerRadius, badgeY + badgeSize);
              ctx.quadraticCurveTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - cornerRadius);
              ctx.lineTo(badgeX, badgeY + cornerRadius);
              ctx.quadraticCurveTo(badgeX, badgeY, badgeX + cornerRadius, badgeY);
              ctx.closePath();
              ctx.fill();
              
              // Draw badge border
              ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
              ctx.lineWidth = 1;
              ctx.stroke();
              
              // Draw emoji in badge - centered both horizontally and vertically
              ctx.font = `${emojiFontSize}px Sans-Serif`;
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(emoji, node.x, emojiY);
            }
          }
          } else {
            // For nodes with children, only show emoji (no title)
            // Position emoji at bottom of node with small margin
            const margin = 2;
            const emojiY = node.y + nodeRadius - margin - emojiFontSize / 2; // Emoji at bottom
            
            // Draw emoji - centered horizontally, at bottom of node
            ctx.font = `${emojiFontSize}px Sans-Serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Move emoji up slightly to keep it within node
            const emojiOffsetY = 1; // Small upward offset
            ctx.fillText(emoji, node.x, emojiY - emojiOffsetY);
          }
      });
      
      // Add edge rendering with labels
      graphRef.current.linkCanvasObjectMode(() => 'after');
      graphRef.current.linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHighlighted = highlightedEdgeId === link.id;
        
        // Draw edge label if it exists
        if (link.label && link.source && link.target) {
          // Get nodes from the graph's current data
          const currentData = graphRef.current?.graphData();
          const startNode = currentData?.nodes?.find((n: any) => n.id === link.source);
          const endNode = currentData?.nodes?.find((n: any) => n.id === link.target);
          
          if (startNode && endNode && 
              startNode.x !== undefined && startNode.y !== undefined &&
              endNode.x !== undefined && endNode.y !== undefined &&
              isFinite(startNode.x) && isFinite(startNode.y) &&
              isFinite(endNode.x) && isFinite(endNode.y)) {
            // Calculate midpoint of the edge
            const midX = (startNode.x + endNode.x) / 2;
            const midY = (startNode.y + endNode.y) / 2;
            
            // Draw background for label
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(link.label).width;
            const padding = 4 / globalScale;
            
            ctx.fillStyle = isHighlighted 
              ? (isDarkMode ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.9)')
              : (isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
            ctx.fillRect(
              midX - textWidth / 2 - padding,
              midY - fontSize / 2 - padding,
              textWidth + padding * 2,
              fontSize + padding * 2
            );
            
            // Draw label text
            ctx.fillStyle = isHighlighted
              ? (isDarkMode ? '#000000' : '#000000')
              : (isDarkMode ? '#ffffff' : '#1a1a1a');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(link.label, midX, midY);
          }
        }
      });
      
      // Update link color based on highlight
      graphRef.current.linkColor((link: any) => {
        if (highlightedEdgeId === link.id) {
          return isDarkMode ? '#FFD700' : '#FFA500';
        }
        return linkColor;
      });
      
      graphRef.current.linkWidth((link: any) => {
        const baseWidth = Math.sqrt(link.value || 1);
        return highlightedEdgeId === link.id ? baseWidth * 2 : baseWidth;
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

    // Handle wheel events to enforce zoom limits (using capture phase to intercept before force-graph)
    const handleWheel = (event: WheelEvent) => {
      if (!graphRef.current || !containerRef.current) return;

      const currentZoom = graphRef.current.zoom() || 1;
      // Calculate zoom factor from wheel delta
      // Force-graph typically uses a zoom factor of ~1.1 per wheel step
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = currentZoom * zoomFactor;

      // Check if zoom is allowed
      if (zoomFactor > 1) {
        // Zooming in
        if (!canZoomIn(newZoom)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        
        // If there's a highlighted node, zoom into it instead of cursor position
        if (highlightedNodeId) {
          const currentGraphData = graphRef.current.graphData();
          const highlightedNode = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
          
          if (highlightedNode && 
              highlightedNode.x !== undefined && highlightedNode.y !== undefined &&
              isFinite(highlightedNode.x) && isFinite(highlightedNode.y)) {
            // Prevent default zoom behavior
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Manually zoom and center on the highlighted node
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(newZoom, 100);
            graphRef.current.centerAt(highlightedNode.x, highlightedNode.y, 100);
            
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
              previousZoomRef.current = newZoom;
            }, 150);
            
            return false;
          }
        }
      } else {
        // Zooming out
        if (!canZoomOut(newZoom)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        
        // If there's a highlighted node, keep it centered while zooming out
        if (highlightedNodeId) {
          const currentGraphData = graphRef.current.graphData();
          const highlightedNode = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
          
          if (highlightedNode && 
              highlightedNode.x !== undefined && highlightedNode.y !== undefined &&
              isFinite(highlightedNode.x) && isFinite(highlightedNode.y)) {
            // Prevent default zoom behavior
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Manually zoom and center on the highlighted node
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(newZoom, 100);
            graphRef.current.centerAt(highlightedNode.x, highlightedNode.y, 100);
            
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
              previousZoomRef.current = newZoom;
            }, 150);
            
            return false;
          }
        }
      }
    };

    // Get the canvas element and add context menu listener
    // Use a small delay to ensure canvas is rendered
    const setupCanvasListener = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', handleCanvasContextMenu);
        // Use capture phase to intercept wheel events before force-graph handles them
        canvas.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        return canvas;
      }
      return null;
    };
    
    // Also add wheel listener to container with capture to catch events early
    if (containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    }

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
        canvas.removeEventListener('wheel', handleWheel, { capture: true } as any);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel, { capture: true } as any);
      }
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [graphData, width, height, toggleNodeExpansion, isDarkMode, updateGraphWidth, paneVisible, highlightedNodeId, highlightedEdgeId, expandedNodes, canZoomIn, canZoomOut]);

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
              onClick={() => copyAnchorLink(contextMenu.nodeId, contextMenu.edgeId)}
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
            ) : selectedEdge ? (
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: panelTextColor,
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.4',
                }}>
                  {selectedEdge.label || 'Edge'}
                </h3>
                <p style={{
                  margin: '0',
                  color: panelTextColor,
                  fontSize: '12px',
                  lineHeight: '1.5',
                  opacity: 0.7,
                }}>
                  From: {selectedEdge.source}<br />
                  To: {selectedEdge.target}
                </p>
              </div>
            ) : (
              <div style={{
                color: panelTextColor,
                fontSize: '12px',
                opacity: 0.5,
                fontStyle: 'italic',
              }}>
                Hover or click a node or edge
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

