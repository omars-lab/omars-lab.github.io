import React from 'react';
import ForceGraph2D from 'react-force-graph';

export interface GraphData {
  nodes: Array<{ id: string; label?: string; [key: string]: any } >;
  links: Array<{ source: string; target: string; [key: string]: any } >;
}

const GraphRenderer: React.FC<{ data: GraphData }> = ({ data }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { nodes, links } = data;

  // Build child map for quick lookup
  const childMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    links.forEach((l) => {
      const arr = map[l.source] ?? [];
      arr.push(l.target);
      map[l.source] = arr;
    });
    return map;
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter((l) => expanded.has(l.source));
  }, [links, expanded]);

  const filteredNodes = useMemo(() => {
    const parents = new Set<string>(links.map((l) => l.target));
    return nodes.filter((n) => !parents.has(n.id) || expanded.has(n.id));
  }, [nodes, links, expanded]);

  const onNodeClick = (node: any) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  };

  const graphData = { nodes: filteredNodes, links: filteredLinks };

  return (
    <ForceGraph2D
      graphData={graphData}
      nodeLabel="label"
      linkDirectionalArrowLength={6}
      linkDirectionalArrowRelPos={1}
      onNodeClick={onNodeClick}
    />
  );
};

export default GraphRenderer;
