import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph from 'force-graph';
import { useColorMode } from '@docusaurus/theme-common';

interface Node {
  id: string;
  label: string;
  title?: string;
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
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Theme-based colors
    const backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
    const borderColor = isDarkMode ? '#333' : '#e0e0e0';
    const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';
    const linkColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
    const arrowColor = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)';
    const nodeBorderColor = isDarkMode ? '#ffffff' : '#333333';

    // Initialize force graph
    if (!graphRef.current) {
      graphRef.current = new ForceGraph(containerRef.current)
        .width(width)
        .height(height)
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
          if (node.hasChildren) {
            toggleNodeExpansion(node.id);
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
    if (graphRef.current) {
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

    // Cleanup
    return () => {
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [graphData, width, height, toggleNodeExpansion, isDarkMode]);

  const containerBorderColor = isDarkMode ? '#333' : '#e0e0e0';
  const containerBackgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
  const containerBoxShadow = isDarkMode 
    ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
    : '0 4px 6px rgba(0, 0, 0, 0.1)';

  return (
    <div style={{
      border: `1px solid ${containerBorderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: containerBackgroundColor,
      boxShadow: containerBoxShadow,
    }}>
      <div ref={containerRef} style={{ width, height }} />
    </div>
  );
};

export default GraphRenderer;

