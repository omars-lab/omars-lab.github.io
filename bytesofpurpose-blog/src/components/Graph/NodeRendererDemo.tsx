import React, { useRef, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';

interface NodeRendererDemoProps {
  title: string;
  zoomLevel?: number;
  isParent?: boolean;
  color?: string;
}

/**
 * Demo component to showcase NodeRenderer with isolated nodes
 * Shows how titles are rendered at different zoom levels
 */
const NodeRendererDemoImpl: React.FC<NodeRendererDemoProps> = ({
  title,
  zoomLevel = 1.0,
  isParent = false,
  color = '#68BDF6',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically import NodeRenderer (browser-only)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeRenderer } = require('./NodeRenderer');

    // Set canvas size - smaller canvas so node appears larger
    const size = 150;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas with appropriate background
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Create a mock node object
    // Position node in center, but scale it up relative to canvas
    const node = {
      id: 'demo',
      x: size / 2,
      y: size / 2,
      hasChildren: isParent,
      isExpanded: false,
      color,
      title,
    };
    
    // Scale up the node by adjusting the zoom level
    // This makes the node appear larger relative to the canvas
    const effectiveZoom = zoomLevel * 1.5;

    // Create NodeRenderer instance
    // Use effectiveZoom to make node appear larger in the demo
    const renderer = new NodeRenderer({
      ctx,
      node,
      globalScale: effectiveZoom,
      isDarkMode,
      isHighlighted: false,
      nodeBorderColor: isDarkMode ? '#ffffff' : '#000000',
      showDebugSeparators: false,
    });

    // Render the node
    renderer.render();
  }, [title, zoomLevel, isParent, color, isDarkMode]);

  return (
    <div style={{ display: 'inline-block', margin: '10px', textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          display: 'block',
          margin: '0 auto',
        }}
      />
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        <div><strong>Title:</strong> {title}</div>
        <div><strong>Length:</strong> {title.length} chars</div>
        <div><strong>Zoom:</strong> {zoomLevel}x</div>
      </div>
    </div>
  );
};

// Wrap the implementation with BrowserOnly to prevent SSR issues
const NodeRendererDemo: React.FC<NodeRendererDemoProps> = (props) => {
  return (
    <BrowserOnly fallback={<div>Loading demo...</div>}>
      {() => <NodeRendererDemoImpl {...props} />}
    </BrowserOnly>
  );
};

export default NodeRendererDemo;

