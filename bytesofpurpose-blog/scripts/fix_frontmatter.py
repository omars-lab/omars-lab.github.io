import os
import re

def get_title_from_content(content):
    match = re.search(r'#\s+(.+)', content)
    if match:
        return match.group(1)
    return ''

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    frontmatter = {}
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if match:
        frontmatter_str = match.group(1)
        for line in frontmatter_str.splitlines():
            if ':' in line:
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip()
        content = content[match.end():]

    # Ensure all required keys are present
    if 'slug' not in frontmatter:
        frontmatter['slug'] = os.path.splitext(os.path.basename(filepath))[0].lower().replace('_', '-').replace(' ', '-')
    if 'title' not in frontmatter:
        frontmatter['title'] = get_title_from_content(content)
    if 'description' not in frontmatter:
        frontmatter['description'] = '' # Add a placeholder
    if 'authors' not in frontmatter:
        frontmatter['authors'] = '[oeid]'
    if 'tags' not in frontmatter:
        frontmatter['tags'] = '[]'
    if len(content.splitlines()) < 5: # rough content check
        frontmatter['draft'] = 'true'

    new_frontmatter_str = '---\n'
    for key, value in frontmatter.items():
        new_frontmatter_str += f'{key}: {value}\n'
    new_frontmatter_str += '---\n'

    with open(filepath, 'w') as f:
        f.write(new_frontmatter_str)
        f.write(content)

def process_docs(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".md", ".mdx")):
                filepath = os.path.join(root, file)
                process_file(filepath)

if __name__ == "__main__":
    # Get the script directory and resolve paths relative to it
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up from scripts/ to bytesofpurpose-blog/
    docs_dir = os.path.join(project_root, 'docs')
    process_docs(docs_dir)

