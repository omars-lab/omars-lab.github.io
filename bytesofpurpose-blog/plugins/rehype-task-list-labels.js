const {visit} = require('unist-util-visit');

/**
 * Rehype plugin: give GFM task-list checkboxes an accessible name.
 *
 * remark-gfm renders `- [ ] text` as a label-less `<input type="checkbox">`
 * inside a `<li class="task-list-item">`, which fails the axe/WCAG "label" rule
 * (screen readers announce "checkbox, unchecked" with no context). This walks
 * each checkbox's containing list item, collects its text, and sets `aria-label`
 * to that text so the control has a name. The inputs are already `disabled`
 * (GFM renders them read-only), so this is purely a labelling fix.
 */
function collectText(node, out) {
  if (node.type === 'text' && node.value) {
    out.push(node.value);
  }
  if (node.children) {
    for (const child of node.children) collectText(child, out);
  }
}

function findCheckbox(node) {
  if (
    node.type === 'element' &&
    node.tagName === 'input' &&
    node.properties &&
    node.properties.type === 'checkbox'
  ) {
    return node;
  }
  for (const child of node.children || []) {
    const found = findCheckbox(child);
    if (found) return found;
  }
  return null;
}

module.exports = function rehypeTaskListLabels() {
  return (tree) => {
    // Walk task-list items; the checkbox may be nested (e.g. li > p > input), so
    // search descendants, not just direct children. Label it from the item text.
    visit(tree, 'element', (node) => {
      const cls = node.properties && node.properties.className;
      const classes = Array.isArray(cls) ? cls : cls ? [cls] : [];
      if (node.tagName !== 'li' || !classes.includes('task-list-item')) return;

      const checkbox = findCheckbox(node);
      if (!checkbox) return;
      if (checkbox.properties.ariaLabel || checkbox.properties['aria-label']) return;

      const parts = [];
      collectText(node, parts);
      const label = parts.join('').replace(/\s+/g, ' ').trim();
      checkbox.properties.ariaLabel = label || 'Task list item';
    });
  };
};