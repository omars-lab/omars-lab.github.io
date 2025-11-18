---
title: 'Bundle Size Optimization'
description: 'Optimize bundle sizes and load times for Storybook and the blog to improve web performance'
status: 'in-progress'
inception_date: '2025-01-20'
execution_date: '2025-01-20'
type: 'optimization'
component: 'Storybook'
priority: 'high'
---

# Bundle Size Optimization

## Execution Plan

Optimize bundle sizes and load times for both Storybook and the main blog to improve web performance:

### Goals
1. **Reduce Storybook bundle sizes** - Currently seeing warnings for large bundles (1.41 MiB for force-graph libraries)
2. **Improve initial load time** - Reduce time to first paint and interactive
3. **Better code splitting** - Ensure heavy libraries load only when needed
4. **Optimize caching** - Separate chunks for better browser caching

### Areas to Optimize

1. **Storybook Build**
   - Large bundles: `70.fd609f3c.iframe.bundle.js` (1.41 MiB), `878.38cfd5e5.iframe.bundle.js` (983 KiB)
   - Main entrypoint: 1.43 MiB combined
   - Force-graph libraries (`react-force-graph-2d`, `d3-force`) are heavy and should be code-split

2. **Docusaurus Blog Build**
   - Optimize production bundle sizes
   - Ensure proper tree-shaking
   - Lazy load heavy components (Graph component)

3. **Webpack Configuration**
   - Configure code splitting for better chunk separation
   - Optimize chunk sizes and caching strategies
   - Enable tree-shaking and dead code elimination

## Execution Results / Attempts

### ✅ Initial Webpack Optimization (2025-01-20)

**What We Tried:**
1. **Added webpack code splitting configuration** in `.storybook/main.ts`:
   - Configured `splitChunks` to separate large libraries into their own chunks
   - Created separate chunks for `force-graph` libraries (`react-force-graph-2d`, `d3-force`)
   - Separated Storybook addons into their own chunks
   - Set `usedExports: true` to enable tree-shaking

2. **Chunk Separation Strategy:**
   ```typescript
   forceGraph: {
     name: 'force-graph',
     test: /[\\/]node_modules[\\/](react-force-graph|force-graph|d3-)[\\/]/,
     chunks: 'all',
     priority: 30,
     enforce: true,
   }
   ```

**Results:**
- ✅ Code splitting configuration added successfully
- ✅ Force-graph libraries are now in separate chunks
- ⚠️ Bundle size warnings still present (expected - these are large libraries)
- ⚠️ Main entrypoint still shows 1.43 MiB (includes runtime + main bundle)

**What Worked:**
- Webpack configuration successfully merged with Storybook's existing optimization settings
- Chunk separation is working - force-graph libraries are isolated
- Configuration is non-breaking and merges safely with Storybook defaults

**What Didn't Work / Limitations:**
- Bundle size warnings persist because:
  - `react-force-graph-2d` and `d3-force` are inherently large libraries (~1.4 MiB)
  - Storybook itself bundles many development dependencies
  - These are dev tools, so absolute bundle size is less critical than production
- The warnings are informational - Storybook is primarily a development tool

**Current Status:**
- Code splitting is configured and working
- Large libraries are properly isolated into separate chunks
- Bundle size warnings remain but are expected for heavy libraries
- Further optimization would require:
  - Lazy loading stories that use heavy components
  - Removing unused Storybook addons
  - Considering alternative lighter libraries (if available)

### Next Steps

1. **Lazy Load Heavy Stories**
   - Only load Graph stories when they're actually viewed
   - Use React.lazy() or dynamic imports for Graph component stories

2. **Review Storybook Addons**
   - Audit which addons are actually used
   - Remove unused addons (`@storybook/addon-interactions`, `@storybook/addon-links` if not needed)

3. **Docusaurus Production Optimization**
   - Apply similar code splitting strategies to Docusaurus build
   - Ensure Graph component is lazy-loaded in production
   - Optimize CSS bundle sizes

4. **Monitor and Measure**
   - Track bundle sizes over time
   - Measure actual load times (not just bundle sizes)
   - Use Lighthouse/WebPageTest for real-world performance metrics

## Related Links

- [Storybook Webpack Config](../../.storybook/main.ts)
- [Graph Component](../../src/components/Graph/GraphRenderer.tsx)
- [Performance Optimization Entry](../2025-XX-XX-infrastructure-improvement-performance.md)

