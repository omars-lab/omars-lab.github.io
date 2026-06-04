const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Local Docusaurus plugin: exposes the N most recent *published* blog posts as
 * global data so the homepage can render a "Latest from the blog" strip without
 * swizzling the blog theme. Reads frontmatter from ./blog at build time.
 *
 * Consumed on the homepage via:
 *   useGlobalData()['recent-posts-plugin'].default.posts
 */
module.exports = function recentPostsPlugin(context, options) {
  const count = (options && options.count) || 3;
  const blogDir = path.join(context.siteDir, 'blog');

  return {
    name: 'recent-posts-plugin',

    async loadContent() {
      if (!fs.existsSync(blogDir)) {
        return {posts: []};
      }

      const files = fs
        .readdirSync(blogDir)
        .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

      const posts = [];
      for (const file of files) {
        const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
        const {data} = matter(raw);

        // Skip drafts and anything without a usable date/title.
        if (data.draft === true) continue;
        if (!data.title || !data.date) continue;

        // Permalink: explicit slug wins, else derive from filename
        // (strip a leading YYYY-MM-DD- date prefix, like Docusaurus does).
        const slug =
          data.slug ||
          file.replace(/\.(md|mdx)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');

        posts.push({
          title: String(data.title),
          description: data.description ? String(data.description) : '',
          date: new Date(data.date).toISOString(),
          permalink: `/thoughts/${slug.replace(/^\//, '')}`,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        });
      }

      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return {posts: posts.slice(0, count)};
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};
