const {visit} = require('unist-util-visit');

/**
 * Remark plugin: make the authored `<TaskList>` wrapper actually work.
 *
 * In MDX, a markdown task list inside `<TaskList>...</TaskList>` is parsed into a `list` node
 * (with `listItem`s carrying GFM `checked: true|false`) BEFORE the React component runs. The
 * component cannot reliably re-derive task structure from its rendered children, so instead we
 * lift the list into an `items` PROP on the `<TaskList>` JSX element here, at the MDAST stage,
 * and drop the list. The component's `items` path (pure, unit-tested) then renders the styled
 * chips. Source stays a real, diffable markdown task list; the prop is generated.
 *
 * Runs as a REMARK plugin (operates on MDAST, before the JSX element is turned into a React
 * element). Wire it into remarkPlugins for the blog + docs instances.
 */

// Flatten a listItem's text content (its paragraph/children) to a single string. We keep inline
// code text (so `>2022-04-18` survives) by reading text + inlineCode node values.
function itemText(node) {
  let out = '';
  visit(node, (n) => {
    if (n.type === 'text' || n.type === 'inlineCode') out += n.value;
  });
  return out.replace(/\s+/g, ' ').trim();
}

module.exports = function remarkTaskList() {
  return (tree) => {
    visit(tree, 'mdxJsxFlowElement', (node) => {
      if (node.name !== 'TaskList') return;

      // Find the first task list among the element's children.
      const list = (node.children || []).find((c) => c.type === 'list');
      if (!list || !Array.isArray(list.children)) return;

      const items = list.children
        .filter((li) => li.type === 'listItem')
        .map((li) => {
          // GFM task items carry `checked: true|false`; non-task items are `null`.
          const prefix = li.checked === true ? '[x] ' : li.checked === false ? '[ ] ' : '';
          return prefix + itemText(li);
        });

      if (!items.length) return;

      // Set/replace the `items` attribute (an mdxJsxAttribute holding an array expression).
      const attrs = (node.attributes || []).filter(
        (a) => !(a.type === 'mdxJsxAttribute' && a.name === 'items'),
      );
      attrs.push({
        type: 'mdxJsxAttribute',
        name: 'items',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(items),
          data: {
            estree: {
              type: 'Program',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'ArrayExpression',
                    elements: items.map((s) => ({type: 'Literal', value: s, raw: JSON.stringify(s)})),
                  },
                },
              ],
              sourceType: 'module',
            },
          },
        },
      });
      node.attributes = attrs;
      // Drop the raw list child (the prop is now the source the component renders from).
      node.children = (node.children || []).filter((c) => c !== list);
    });
  };
};
