import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  // Ensure Storybook uses babel.config.js for all files including TypeScript
  babel: async (options) => {
    // Storybook will automatically use babel.config.js, but we ensure TypeScript is included
    return {
      ...options,
      // babel.config.js already has @babel/preset-typescript configured
    };
  },
  webpackFinal: async (config, { configDir }) => {
    // Handle canvas for force-graph
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Resolve @site alias to the root directory (same as Docusaurus)
    // configDir is .storybook, so we go up one level to get the project root
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    const rootDir = path.resolve(configDir, '..');
    config.resolve.alias!['@site'] = rootDir;
    
    // Optimize bundle sizes - merge with existing optimization settings
    config.optimization = config.optimization || {};
    
    // Enable tree shaking (usedExports is already enabled by Storybook, but ensure it's on)
    config.optimization.usedExports = true;
    
    // Split chunks for better caching and smaller initial bundles
    // Merge with existing splitChunks config if present
    const existingSplitChunks = config.optimization.splitChunks || {};
    config.optimization.splitChunks = {
      ...existingSplitChunks,
      chunks: existingSplitChunks.chunks || 'all',
      maxInitialRequests: existingSplitChunks.maxInitialRequests || 25,
      minSize: existingSplitChunks.minSize || 20000,
      cacheGroups: {
        ...existingSplitChunks.cacheGroups,
        // Separate large libraries into their own chunks for better caching
        forceGraph: {
          name: 'force-graph',
          test: /[\\/]node_modules[\\/](react-force-graph|force-graph|d3-)[\\/]/,
          chunks: 'all',
          priority: 30,
          enforce: true,
        },
        // Separate Storybook addons (they're already split, but ensure they stay separate)
        storybookAddons: {
          name: 'storybook-addons',
          test: /[\\/]node_modules[\\/]@storybook[\\/]addon-[\\/]/,
          chunks: 'all',
          priority: 25,
          enforce: true,
        },
      },
    };
    
    // Mock Docusaurus-specific modules for Storybook
    // These mocks are located in src/stories/mocks/ and documented in src/stories/mocks/README.md
    // BrowserOnly is used to prevent SSR, but Storybook always runs in browser
    config.resolve.alias!['@docusaurus/BrowserOnly'] = path.resolve(
      rootDir,
      'src/stories/mocks/BrowserOnlyMock.tsx'
    );
    
    // Mock useColorMode hook from Docusaurus theme
    // Returns 'light' by default (can be enhanced to detect Storybook theme)
    config.resolve.alias!['@docusaurus/theme-common'] = path.resolve(
      rootDir,
      'src/stories/mocks/theme-common-mock.ts'
    );
    
    // Mock Link component from Docusaurus for navigation
    // Renders as a simple anchor tag in Storybook
    config.resolve.alias!['@docusaurus/Link'] = path.resolve(
      rootDir,
      'src/stories/mocks/LinkMock.tsx'
    );
    
    // Mock useBaseUrl hook from Docusaurus for URL resolution
    // Returns paths as-is or with simple prefix in Storybook
    config.resolve.alias!['@docusaurus/useBaseUrl'] = path.resolve(
      rootDir,
      'src/stories/mocks/useBaseUrlMock.ts'
    );
    
    // Configure publicPath for serving from /storybook/ in Docusaurus
    // Use relative paths so assets load correctly when served from /storybook/
    // Only set this when building (not in dev mode)
    if (process.env.NODE_ENV === 'production' || process.env.STORYBOOK_BUILD) {
      config.output = config.output || {};
      // Use relative paths (empty string) so assets resolve relative to the HTML file
      // This allows Storybook to work when served from /storybook/index.html
      config.output.publicPath = '';
    }
    
    // Ensure babel-loader processes TypeScript files FIRST (uses babel.config.js)
    // This must run before Storybook's CSF plugin processes the files
    if (config.module?.rules) {
      // Insert at the beginning so it runs before other rules
      config.module.rules.unshift({
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            // babel-loader automatically uses babel.config.js from project root
          },
        ],
      });
      
      // Ensure MDX files are processed correctly
      // Find the MDX rule and ensure it handles TypeScript properly
      const mdxRuleIndex = config.module.rules.findIndex(
        (rule: any) => rule && typeof rule === 'object' && rule.test && rule.test.toString().includes('mdx')
      );
      
      if (mdxRuleIndex !== -1) {
        const mdxRule = config.module.rules[mdxRuleIndex];
        // Ensure MDX loader processes files correctly
        if (mdxRule && typeof mdxRule === 'object' && Array.isArray(mdxRule.use)) {
          // MDX rule should already be configured by @storybook/addon-essentials
          // Just ensure it's not conflicting
        }
      }
    }
    
    return config;
  },
};

export default config;
