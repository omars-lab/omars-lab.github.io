# Bytes of Purpose

> Purposeful code, one byte at a time.

[![Read the blog](https://img.shields.io/website?url=https%3A%2F%2Fblog.bytesofpurpose.com&up_message=online&down_message=offline&label=blog.bytesofpurpose.com)](https://blog.bytesofpurpose.com)
[![Built with Docusaurus](https://img.shields.io/badge/built%20with-Docusaurus%203-3ECC5F?logo=docusaurus&logoColor=white)](https://docusaurus.io)
[![Last commit](https://img.shields.io/github/last-commit/omars-lab/omars-lab.github.io)](https://github.com/omars-lab/omars-lab.github.io/commits/master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)

A developer blog and documentation site built with Docusaurus, focused on coding challenges, development tools, and technical insights. This repository contains the complete source code, content, and automation tools for the [Bytes of Purpose](https://blog.bytesofpurpose.com) website.

### 👉 [**Read the blog at blog.bytesofpurpose.com**](https://blog.bytesofpurpose.com)

## 🎯 What You'll Find Here

This repository serves as both a **developer blog** and a **comprehensive documentation site** covering:

- **Coding Challenges & Algorithms** - Problem-solving techniques and solutions
- **Development Tools & Mechanics** - Technical implementation guides
- **Learning Resources** - Deep dives into programming concepts
- **Project Documentation** - Real-world development experiences
- **Process & Workflow Insights** - Productivity and development practices

## 🏗️ Repository Structure

The docs are a **topic-based information architecture**: each top-level folder is a
reader-facing topic (kebab-case, no numeric name prefix — order is set by each
`_category_.json`'s `position`, and every doc carries an **absolute** `slug:` so a
folder move never changes a URL).

```
omars-lab.github.io/
├── bytesofpurpose-blog/          # Main Docusaurus site
│   ├── blog/                     # Blog posts (publication-ready content)
│   ├── designs/                  # System designs / architectural insights
│   ├── docs/                     # Topic-organized knowledge base (see below)
│   │   ├── welcome/             # Site introduction and how to browse
│   │   ├── generative-ai/       # GenAI fundamentals + building GenAI systems
│   │   ├── software-development/ # Dev process: experiments, projects, roadmaps
│   │   ├── product-management/  # Idea→ship lifecycle (ideas, research, POCs)
│   │   ├── productivity/        # Organizing/discovering/analyzing/automating
│   │   ├── blogging/            # Authoring + embedding content in the site
│   │   ├── interview-prep/      # DS&A, system design, behavioral prep
│   │   ├── companies/           # Roles, levels, skills, and company culture
│   │   ├── entrepreneurship/    # Engineer → founder notes
│   │   ├── personal-growth/     # Habits, reflection, health, finances
│   │   └── faith/               # Where faith meets craft (Islamic automations)
│   ├── ideas/                    # Post-idea seeds → generated /vote page data
│   ├── changelog/                # Changelog seeds → generated /changelog cards
│   ├── src/                      # Custom React components, theme swizzles, styles
│   ├── scripts/                  # Build/validation tooling (links, structure, data)
│   ├── static/                   # Static assets (images, icons, etc.)
│   └── build/                    # Generated static site (deployment ready)
├── .claude/                      # Claude Code skills, hooks, and plans
├── Makefile                      # Build, validation, and deployment automation
└── package.json                  # Root package configuration
```

## 📁 Key Directories

### `/bytesofpurpose-blog/` - Main Site
The core Docusaurus application containing all content and configuration.

### `/bytesofpurpose-blog/docs/` - Documentation Hub
A topic-organized knowledge base. Each top-level folder is a reader-facing topic:

- **`welcome/`** - Site introduction and how to browse by topic
- **`generative-ai/`** - GenAI fundamentals and designing/shipping GenAI systems
- **`software-development/`** - The dev process: experiments, projects, roadmaps
- **`product-management/`** - The idea→ship lifecycle (ideas, research, POCs, experiments)
- **`productivity/`** - Organizing, discovering, analyzing, and automating work
- **`blogging/`** - Authoring and embedding content (components, diagrams, code)
- **`interview-prep/`** - Data structures, algorithms, system design, behavioral prep
- **`companies/`** - The roles, levels, skills, and culture inside companies
- **`entrepreneurship/`** - Notes on going from engineer to founder
- **`personal-growth/`** - Habits, reflection, reading, mentorship, health, finances
- **`faith/`** - Where faith meets craft — Islamic automations and trackers

### `/bytesofpurpose-blog/blog/` - Blog Posts
Publication-ready articles covering experiences, insights, and lessons learned.

### `/bytesofpurpose-blog/designs/` - Design Content
Architectural decisions, design patterns, and system design insights.

### `/bytesofpurpose-blog/scripts/` - Build & Validation Tooling
Node scripts wired into the build and the `Makefile`:

- **`generate-changelog-data.js` / `generate-ideas-data.js`** - Turn `changelog/` and `ideas/` seeds into the JSON the `/changelog` and `/vote` pages render
- **`validate-links.js`** - Source-level link hygiene (bare/long/tracking URLs, broken-internal + link-to-draft)
- **`validate-docs-structure.js`** - Enforces the topic-folder contract (absolute slugs, naming, depth)

### `/.claude/` - Claude Code Automation
Skills (the SDLC playbooks), PostToolUse validation hooks, and planning docs.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Yarn package manager

### Quick Start
```bash
# Clone the repository
git clone https://github.com/omars-lab/omars-lab.github.io.git
cd omars-lab.github.io

# Install dependencies
make install

# Start development server
make start
```

### Building for Production
```bash
# Build the site
make build

# The built site will be in bytesofpurpose-blog/build/
```

> **📖 For detailed development instructions**, see [DEVELOPMENT.md](docs/DEVELOPMENT.md) which covers:
> - Component development
> - Storybook setup and usage
> - Testing
> - TypeScript & Babel configuration
> - Troubleshooting
> - Changelog generation system

## 🛠️ Key Features

### Content Management
- **Draft System** - Content can be marked as draft for work-in-progress
- **Frontmatter Standards** - Consistent metadata across all content
- **Tag System** - SEO-friendly tagging for content discovery
- **Sidebar Navigation** - Organized content hierarchy

### Technical Implementation
- **Docusaurus 3.x** - Modern static site generator
- **React Components** - Custom interactive elements
- **MDX Support** - Rich content with embedded components
- **Responsive Design** - Mobile-first approach

### Automation & Maintenance
- **Automated Builds** - Makefile-based build system
- **Link Validation** - Automated broken link detection and fixing
- **Content Standards** - Automated frontmatter validation
- **SEO Optimization** - Structured metadata and sitemap generation

## 📝 Content Philosophy

### Documentation vs Blog Posts
- **Documentation** (`/docs/`) - Durable, reference material for solving specific problems
- **Blog Posts** (`/blog/`) - Experiences, lessons learned, and evolving perspectives
- **Design Posts** (`/designs/`) - Architectural decisions and design insights

### Quality Standards
- All content is thoroughly reviewed for accuracy and clarity
- Code examples are tested and working
- Links are verified and maintained
- Content is regularly updated to reflect current best practices

## 🔧 Maintenance & Automation

### Validation (run from the repo root)
- **`make validate-links`** - Link hygiene + broken-internal / link-to-draft checks
- **`make validate-structure`** - Topic-folder contract (absolute slugs, naming, depth)
- **`make secret-scan`** - gitleaks scan (also runs as a pre-commit hook)
- **`make test-regression`** - Playwright e2e (a11y + SEO gates)

The same checks run automatically as warn-tier PostToolUse hooks while editing
(see `.claude/settings.json`).

## 🌐 Deployment

Deployment is run manually with **`make deploy`** (from the repo root): it secret-scans,
builds the Docusaurus site with the PostHog env, and pushes the static output to the
`gh-pages` branch, which serves [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com).

## 🤝 Contributing

This repository welcomes contributions in several areas:

- **Content Improvements** - Fix typos, improve clarity, add examples
- **Technical Enhancements** - Component improvements, performance optimizations
- **Documentation** - Additional guides, tutorials, or reference materials
- **Automation** - New maintenance scripts or build improvements

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially for link integrity)
5. Submit a pull request

> **💡 Developer Guide**: See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup, component development, testing, and build instructions. See [NAMING_CONVENTIONS.md](docs/NAMING_CONVENTIONS.md) for changelog entry naming conventions.

## 📊 Project Status

- **Live**: ✅ [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com)
- **Content Coverage**: Comprehensive across the topics above
- **Validation**: link hygiene + topic-structure checks run on every edit (warn-tier)

## 🔗 Links

- **Live Site**: [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com)
- **GitHub Repository**: [omars-lab/omars-lab.github.io](https://github.com/omars-lab/omars-lab.github.io)
- **Author**: [Omar Eid](https://www.linkedin.com/in/oeid/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Built with ❤️ using Docusaurus and deployed on GitHub Pages*
