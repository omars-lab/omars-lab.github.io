# Bytes of Purpose

> Purposeful code, one byte at a time.

A developer blog and documentation site built with Docusaurus, focused on coding challenges, development tools, and technical insights. This repository contains the complete source code, content, and automation tools for the [Bytes of Purpose](https://blog.bytesofpurpose.com) website.

## 🎯 What You'll Find Here

This repository serves as both a **developer blog** and a **comprehensive documentation site** covering:

- **Coding Challenges & Algorithms** - Problem-solving techniques and solutions
- **Development Tools & Mechanics** - Technical implementation guides
- **Learning Resources** - Deep dives into programming concepts
- **Project Documentation** - Real-world development experiences
- **Process & Workflow Insights** - Productivity and development practices

## 🏗️ Repository Structure

```
omars-lab.github.io/
├── bytesofpurpose-blog/          # Main Docusaurus site
│   ├── blog/                     # Blog posts (publication-ready content)
│   ├── designs/                  # Design decisions and architectural insights
│   ├── docs/                     # Comprehensive documentation
│   │   ├── 1-welcome/           # Site introduction and navigation
│   │   ├── 2-mechanics/         # Technical implementation guides
│   │   ├── 3-learning/          # Educational content and coding challenges
│   │   ├── 4-developing/        # Development projects and experiments
│   │   ├── 5-interviewing/      # Technical interview preparation
│   │   ├── 8-habits/            # Development habits and practices
│   │   └── 9-definitions/       # Terminology and reference materials
│   ├── src/                      # Custom React components and styling
│   ├── static/                   # Static assets (images, icons, etc.)
│   ├── prompts/                  # Automation and maintenance tools
│   │   ├── plans/               # Strategic planning documents
│   │   └── fix-*.md             # Maintenance automation scripts
│   └── build/                    # Generated static site (deployment ready)
├── Makefile                      # Build and deployment automation
└── package.json                  # Root package configuration
```

## 📁 Key Directories

### `/bytesofpurpose-blog/` - Main Site
The core Docusaurus application containing all content and configuration.

### `/bytesofpurpose-blog/docs/` - Documentation Hub
Organized knowledge base with 9 main sections:

- **`1-welcome/`** - Site introduction, navigation, and getting started
- **`2-mechanics/`** - Technical implementation guides (Docusaurus, React, tools)
- **`3-learning/`** - Educational content (coding challenges, algorithms, tutorials)
- **`4-developing/`** - Development projects, experiments, and POCs
- **`5-interviewing/`** - Technical interview preparation and system design
- **`8-habits/`** - Development habits, productivity, and best practices
- **`9-definitions/`** - Terminology, acronyms, and reference materials

### `/bytesofpurpose-blog/blog/` - Blog Posts
Publication-ready articles covering experiences, insights, and lessons learned.

### `/bytesofpurpose-blog/designs/` - Design Content
Architectural decisions, design patterns, and system design insights.

### `/bytesofpurpose-blog/prompts/` - Automation Tools
Maintenance scripts and strategic planning documents:

- **`plans/`** - Strategic planning and improvement roadmaps
- **`fix-*.md`** - Automated maintenance scripts for common tasks

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Yarn package manager

### Development Setup
```bash
# Clone the repository
git clone https://github.com/omars-lab/omars-lab.github.io.git
cd omars-lab.github.io

# Install dependencies
yarn install

# Start development server
cd bytesofpurpose-blog
yarn start
```

### Building for Production
```bash
# Build the site
make build

# The built site will be in bytesofpurpose-blog/build/
```

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

### Automated Tasks
- **Link Validation** - `prompts/fix-broken-docusaurus-links.md`
- **Frontmatter Fixing** - `prompts/fix-frontmatter.md`
- **Content Standards** - Various maintenance scripts in `/prompts/`

### Manual Maintenance
- Regular content updates and improvements
- Link health monitoring
- Performance optimization
- SEO enhancement

## 🌐 Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `master` branch. The build process generates static files in `/bytesofpurpose-blog/build/` which are served at [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com).

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

## 📊 Project Status

- **Build Status**: ✅ Passing
- **Link Health**: ✅ 95%+ resolved (6 edge cases remain)
- **Content Coverage**: Comprehensive across development topics
- **Last Updated**: 2025-01-31

## 🔗 Links

- **Live Site**: [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com)
- **GitHub Repository**: [omars-lab/omars-lab.github.io](https://github.com/omars-lab/omars-lab.github.io)
- **Author**: [Omar Eid](https://www.linkedin.com/in/oeid/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Built with ❤️ using Docusaurus and deployed on GitHub Pages*
