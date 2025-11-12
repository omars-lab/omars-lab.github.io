import React, { useMemo, useState } from 'react';
import GraphRenderer from './GraphRenderer';
import { useColorMode } from '@docusaurus/theme-common';

interface TechnologyData {
  category: string;
  main_use_case: string;
  compared_with: string[];
  key_features: string[];
  differentiators: string;
  [key: string]: any;
}

interface FrameworkData {
  processed_technologies: string[];
  queue: string[];
  enhanced_queue: string[];
  data: Record<string, TechnologyData>;
}

interface ComparisonEdge {
  source: string;
  target: string;
  label: string;
  id: string;
  type: 'differentiating' | 'category';
  similarities?: string[];
  differences?: {
    source: string[];
    target: string[];
  };
  sourceData?: TechnologyData;
  targetData?: TechnologyData;
}

const AIFrameworkGraph: React.FC<{ data: FrameworkData }> = ({ data }) => {
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';
  const [selectedEdge, setSelectedEdge] = useState<ComparisonEdge | null>(null);

  // Get all category IDs to expand them by default
  const defaultExpandedNodes = useMemo(() => {
    const categories = new Set<string>();
    Object.values(data.data).forEach(techData => {
      categories.add(`category-${techData.category}`);
    });
    return new Set(categories);
  }, [data]);

  // Transform data into graph format
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: ComparisonEdge[] = [];
    const categoryMap = new Map<string, string[]>();

    // Group technologies by category
    Object.entries(data.data).forEach(([techName, techData]) => {
      const category = techData.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(techName);
    });

    // Create category nodes (parent nodes)
    // Map category names to their markdown section IDs (matching the heading IDs in the markdown)
    const categorySectionMap: Record<string, string> = {
      'framework': 'frameworks',
      'specialized_library': 'specialized-libraries',
      'multi_agent_framework': 'multi-agent-frameworks',
      'platform': 'platforms',
      'development_tool': 'tools',
      'low_code_platform': 'low-code-platforms',
    };
    
    const categoryNodes = Array.from(categoryMap.keys()).map((category, index) => ({
      id: `category-${category}`,
      title: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Category: ${category.replace(/_/g, ' ')}`,
      group: 0,
      color: '#68BDF6',
      markdownSection: categorySectionMap[category] || category.replace(/_/g, '-'), // Use mapped section ID or fallback
      children: categoryMap.get(category)!.map(tech => ({
        id: tech,
        title: tech,
        label: tech,
        description: data.data[tech].main_use_case,
        group: 1,
        color: '#60BE86',
        markdownSection: tech.toLowerCase().replace(/\s+/g, '-'), // Generate section ID from tech name
        keyLinks: data.data[tech].key_links || [], // Include external links if available
      })),
    }));

    // Add category nodes and their children
    nodes.push(...categoryNodes);

    // Create category links (from technology to category - "is a" relationship)
    categoryNodes.forEach(categoryNode => {
      categoryNode.children.forEach((child: any) => {
        links.push({
          source: child.id,
          target: categoryNode.id,
          label: 'is a',
          id: `category-${child.id}-${categoryNode.id}`,
          type: 'category',
        });
      });
    });

    // Create comparison links (differentiating edges) - bidirectional
    Object.entries(data.data).forEach(([techName, techData]) => {
      techData.compared_with.forEach(comparedTech => {
        // Only create edge if the compared technology exists in data
        if (data.data[comparedTech]) {
          const comparedTechData = data.data[comparedTech];
          
          // Find similarities (common features)
          const sourceFeatures = new Set(techData.key_features || []);
          const targetFeatures = new Set(comparedTechData.key_features || []);
          const similarities = Array.from(sourceFeatures).filter(f => targetFeatures.has(f));

          // Find differences
          const sourceOnly = Array.from(sourceFeatures).filter(f => !targetFeatures.has(f));
          const targetOnly = Array.from(targetFeatures).filter(f => !sourceFeatures.has(f));

          // Create edge ID (alphabetically sorted to avoid duplicates)
          const [source, target] = [techName, comparedTech].sort();
          const baseEdgeId = `compare-${source}-${target}`;

          // Check if edge already exists (avoid duplicates) - check for either forward or reverse
          if (!links.find(l => l.id === `${baseEdgeId}-forward` || l.id === `${baseEdgeId}-reverse`)) {
            // Create bidirectional edges by creating two edges (one in each direction)
            // Both edges share the same comparison data
            links.push({
              source: techName,
              target: comparedTech,
              label: 'vs.',
              id: `${baseEdgeId}-forward`,
              type: 'differentiating',
              similarities: similarities.length > 0 ? similarities : undefined,
              differences: {
                source: sourceOnly,
                target: targetOnly,
              },
              sourceData: techData,
              targetData: comparedTechData,
            });
            
            // Reverse edge
            links.push({
              source: comparedTech,
              target: techName,
              label: 'vs.',
              id: `${baseEdgeId}-reverse`,
              type: 'differentiating',
              similarities: similarities.length > 0 ? similarities : undefined,
              differences: {
                source: targetOnly,
                target: sourceOnly,
              },
              sourceData: comparedTechData,
              targetData: techData,
            });
          }
        }
      });
    });

    // Ensure links have source and target as strings (not objects)
    const processedLinks = links.map(link => ({
      ...link,
      source: typeof link.source === 'string' ? link.source : (link.source as any)?.id || String(link.source),
      target: typeof link.target === 'string' ? link.target : (link.target as any)?.id || String(link.target),
    }));


    return { nodes, links: processedLinks };
  }, [data]);

  // Handle edge click - no longer needed since GraphRenderer handles it in the pane
  // But we keep this to store the comparison edge data for the pane
  const handleEdgeClick = (edge: any) => {
    // Find the comparison edge data (could be forward or reverse)
    const comparisonEdge = graphData.links.find(l => l.id === edge.id);
    if (comparisonEdge && comparisonEdge.type === 'differentiating') {
      setSelectedEdge(comparisonEdge);
    } else {
      setSelectedEdge(null);
    }
  };

  // Note: Edge details are now shown in GraphRenderer's side pane, not in a popup
  // This component is kept for potential future use but the popup is removed
  const EdgeDetailsPanel: React.FC<{ edge: ComparisonEdge }> = ({ edge }) => {
    if (edge.type !== 'differentiating') return null;

    const panelBackgroundColor = isDarkMode ? '#1a1a1a' : '#f9f9f9';
    const panelTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
    const panelBorderColor = isDarkMode ? '#444' : '#ddd';
    const sectionBgColor = isDarkMode ? '#2a2a2a' : '#ffffff';

    return (
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '400px',
        maxHeight: '80vh',
        backgroundColor: panelBackgroundColor,
        border: `2px solid ${panelBorderColor}`,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: isDarkMode 
          ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
          : '0 8px 24px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflowY: 'auto',
        color: panelTextColor,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: panelTextColor,
          }}>
            Comparison: {edge.source} vs {edge.target}
          </h3>
          <button
            onClick={() => setSelectedEdge(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: panelTextColor,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Use Cases */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: sectionBgColor,
          borderRadius: '6px',
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: panelTextColor,
          }}>
            Use Cases
          </h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>{edge.source}:</strong> {edge.sourceData?.main_use_case}
            </div>
            <div>
              <strong>{edge.target}:</strong> {edge.targetData?.main_use_case}
            </div>
          </div>
        </div>

        {/* Similarities */}
        {edge.similarities && edge.similarities.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: sectionBgColor,
            borderRadius: '6px',
          }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#60BE86',
            }}>
              Similarities
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}>
              {edge.similarities.map((similarity, idx) => (
                <li key={idx}>{similarity}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Differences */}
        {edge.differences && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: sectionBgColor,
            borderRadius: '6px',
          }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FF6B6B',
            }}>
              Differences
            </h4>
            
            {edge.differences.source.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '12px', color: panelTextColor }}>
                  {edge.source} only:
                </strong>
                <ul style={{
                  margin: '4px 0 0 0',
                  paddingLeft: '20px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                  {edge.differences.source.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}

            {edge.differences.target.length > 0 && (
              <div>
                <strong style={{ fontSize: '12px', color: panelTextColor }}>
                  {edge.target} only:
                </strong>
                <ul style={{
                  margin: '4px 0 0 0',
                  paddingLeft: '20px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                  {edge.differences.target.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Differentiators */}
        <div style={{
          padding: '12px',
          backgroundColor: sectionBgColor,
          borderRadius: '6px',
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: panelTextColor,
          }}>
            Key Differentiators
          </h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>{edge.source}:</strong> {edge.sourceData?.differentiators}
            </div>
            <div>
              <strong>{edge.target}:</strong> {edge.targetData?.differentiators}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <GraphRenderer
        data={graphData}
        width={800}
        height={600}
        graphId="ai-framework-graph"
        highlightEdgeId={selectedEdge?.id}
        onEdgeClick={handleEdgeClick}
        initialExpandedNodes={defaultExpandedNodes}
      />
      {/* Edge details are now shown in GraphRenderer's side pane, not in a popup */}
    </div>
  );
};

export default AIFrameworkGraph;

