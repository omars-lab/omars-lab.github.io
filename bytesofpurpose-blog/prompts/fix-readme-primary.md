# Fix Primary README

## Overview
This script provides a systematic approach to maintain and update the primary README.md file at the repository root. The README serves as the main entry point for the repository and should accurately reflect the current state of the project.

## Step 1: Analyze Current Repository State

### A. Check Repository Structure
```bash
# Navigate to repository root
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io

# Get current directory structure
tree -L 3 -I 'node_modules|.git|build|.docusaurus' .

# Check for new directories or major changes
find . -maxdepth 2 -type d -name "*" | grep -v node_modules | grep -v .git | sort
```

### B. Verify Key Files and Directories
```bash
# Check if main directories exist
ls -la bytesofpurpose-blog/
ls -la bytesofpurpose-blog/docs/
ls -la bytesofpurpose-blog/prompts/
ls -la bytesofpurpose-blog/src/
ls -la bytesofpurpose-blog/static/

# Check for new prompt files
ls -la bytesofpurpose-blog/prompts/
ls -la bytesofpurpose-blog/prompts/plans/
```

### C. Check Build Status
```bash
# Verify build works
make build

# Check if build directory exists and has content
ls -la bytesofpurpose-blog/build/
```

## Step 2: Update Repository Structure Section

### A. Current Structure Template
Update the repository structure section with the current directory tree:

```markdown
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
```

### B. Add New Directories
If new directories are found, add them to the structure with appropriate descriptions.

## Step 3: Update Key Directories Section

### A. Verify Documentation Sections
```bash
# Check all docs subdirectories
ls -la bytesofpurpose-blog/docs/
```

Update the key directories section to reflect any changes:

```markdown
### `/bytesofpurpose-blog/docs/` - Documentation Hub
Organized knowledge base with X main sections:

- **`1-welcome/`** - Site introduction, navigation, and getting started
- **`2-mechanics/`** - Technical implementation guides (Docusaurus, React, tools)
- **`3-learning/`** - Educational content (coding challenges, algorithms, tutorials)
- **`4-developing/`** - Development projects, experiments, and POCs
- **`5-interviewing/`** - Technical interview preparation and system design
- **`8-habits/`** - Development habits, productivity, and best practices
- **`9-definitions/`** - Terminology, acronyms, and reference materials
```

### B. Update Prompts Section
```bash
# Check current prompt files
ls -la bytesofpurpose-blog/prompts/
ls -la bytesofpurpose-blog/prompts/plans/
```

Update the prompts section with current automation tools:

```markdown
### `/bytesofpurpose-blog/prompts/` - Automation Tools
Maintenance scripts and strategic planning documents:

- **`plans/`** - Strategic planning and improvement roadmaps
- **`fix-*.md`** - Automated maintenance scripts for common tasks
```

## Step 4: Update Technical Information

### A. Check Package Versions
```bash
# Check Docusaurus version
cd bytesofpurpose-blog
grep -A 5 -B 5 "docusaurus" package.json

# Check Node.js requirements
grep -A 3 -B 3 "engines" package.json
```

### B. Update Prerequisites Section
```markdown
### Prerequisites
- Node.js (v16 or higher)  # Update based on package.json engines
- Yarn package manager
```

### C. Update Build Commands
```bash
# Test build commands
make build
cd bytesofpurpose-blog && yarn start
```

## Step 5: Update Project Status

### A. Check Build Health
```bash
# Run build and check for errors
make build
echo "Exit code: $?"
```

### B. Check Link Health
```bash
# Run build and check for broken links
make build 2>&1 | grep -i "broken links"
```

### C. Update Status Section
```markdown
## 📊 Project Status

- **Build Status**: ✅ Passing / ❌ Issues found
- **Link Health**: ✅ 95%+ resolved / ⚠️ Issues found
- **Content Coverage**: Comprehensive across development topics
- **Last Updated**: [Current Date]
```

## Step 6: Update Automation & Maintenance Section

### A. Check Current Prompt Files
```bash
# List all prompt files
find bytesofpurpose-blog/prompts/ -name "*.md" -type f | sort
```

### B. Update Automated Tasks List
```markdown
### Automated Tasks
- **Link Validation** - `prompts/fix-broken-docusaurus-links.md`
- **Frontmatter Fixing** - `prompts/fix-frontmatter.md`
- **README Maintenance** - `prompts/fix-primary-readme.md`
- **Content Standards** - Various maintenance scripts in `/prompts/`
```

## Step 7: Update Contributing Section

### A. Check for New Contribution Areas
Review the repository for new areas where contributions would be valuable:

```markdown
This repository welcomes contributions in several areas:

- **Content Improvements** - Fix typos, improve clarity, add examples
- **Technical Enhancements** - Component improvements, performance optimizations
- **Documentation** - Additional guides, tutorials, or reference materials
- **Automation** - New maintenance scripts or build improvements
- **New Features** - Additional functionality or content types
```

## Step 8: Update Links and References

### A. Verify External Links
Check that all external links in the README are still valid:

```markdown
## 🔗 Links

- **Live Site**: [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com)
- **GitHub Repository**: [omars-lab/omars-lab.github.io](https://github.com/omars-lab/omars-lab.github.io)
- **Author**: [Omar Eid](https://www.linkedin.com/in/oeid/)
```

### B. Update Internal References
Ensure all internal references to files and directories are accurate.

## Step 9: Content Quality Check

### A. Readability Review
- Check for typos and grammatical errors
- Ensure consistent formatting and style
- Verify all sections are relevant and up-to-date

### B. Completeness Check
- Ensure all major directories are documented
- Verify all key features are mentioned
- Check that setup instructions are complete

## Step 10: Version Control

### A. Update Last Modified Date
```markdown
**Last Updated**: [Current Date]
```

### B. Add Change Log Entry
Consider adding a brief change log section for significant updates:

```markdown
## 📝 Recent Updates

- **2025-01-31**: Enhanced broken links resolution system
- **2025-01-31**: Added comprehensive README maintenance automation
- **2025-01-31**: Improved repository documentation structure
```

## Step 11: Validation

### A. Test All Commands
Run all commands mentioned in the README to ensure they work:

```bash
# Test setup commands
yarn install
cd bytesofpurpose-blog && yarn start

# Test build commands
make build
```

### B. Verify Links
Check that all internal and external links work correctly.

### C. Review Structure
Ensure the README structure matches the actual repository structure.

## Step 12: Common Updates Needed

### A. New Prompt Files
When new prompt files are added, update the automation section:

```markdown
- **New Task** - `prompts/fix-new-task.md`
```

### B. New Documentation Sections
When new docs sections are added, update the key directories section.

### C. New Features
When new features are added, update the key features section.

### D. Build Issues
When build issues are resolved, update the project status section.

## Step 13: Maintenance Schedule

### A. Regular Updates (Monthly)
- Check build status
- Verify link health
- Update last modified date
- Review for new directories or files

### B. Major Updates (Quarterly)
- Complete structure review
- Update technical information
- Review and update all sections
- Check for outdated information

### C. Trigger Events
Update README when:
- New major directories are added
- Build process changes
- New automation scripts are created
- Major features are added
- Repository structure changes significantly

## Quick Reference Commands

```bash
# Check repository structure
tree -L 3 -I 'node_modules|.git|build|.docusaurus' .

# Test build
make build

# Check prompt files
ls -la bytesofpurpose-blog/prompts/

# Check docs structure
ls -la bytesofpurpose-blog/docs/

# Verify package.json
cat bytesofpurpose-blog/package.json | grep -A 5 -B 5 "docusaurus"
```

## Important Notes

- **Keep it current** - README should always reflect the current state
- **Test everything** - Verify all commands and links work
- **Be comprehensive** - Cover all major aspects of the repository
- **Stay organized** - Maintain clear structure and formatting
- **Update regularly** - Don't let the README become outdated

---

**Last Updated**: 2025-01-31  
**Purpose**: Maintain accurate and comprehensive repository documentation
