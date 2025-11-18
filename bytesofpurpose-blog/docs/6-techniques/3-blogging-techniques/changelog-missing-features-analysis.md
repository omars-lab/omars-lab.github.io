# Major Features Found in Git History Missing from Changelog

This document identifies major features and mechanics found in git commit history that should be added to the changelog.

## 1. Storybook Integration ⭐ HIGH PRIORITY

**Status:** Major infrastructure/mechanic feature - NEEDS ENTRY

**Git Evidence:**
- `7634d68b` (2025-11-16): "Revamping graph component, modularizing it, etc. Also added storybook tab to document components"
- `6ec4aaac` (2025-11-17): "Revamp component setup, story book stories, graph render on mobile, etc"

**What it is:**
- Storybook was integrated as a component development and documentation tool
- Added as a tab in the blog navigation
- Used for documenting Graph components and other React components
- Integrated into build process (static site generation)

**Suggested Entry:**
- **Type:** `mechanic-establishment-storybook` or `infrastructure-improvement-storybook`
- **Title:** "Blogging Mechanism - Storybook Component Documentation"
- **Inception Date:** 2025-11-16 (based on commits)
- **Execution Date:** 2025-11-17
- **Status:** `completed` or `in-progress`

**Why it matters:**
- Major development tool addition
- Significant infrastructure change
- Enables component documentation and development workflow

---

## 2. SEO Improvements ⭐ HIGH PRIORITY

**Status:** Entry exists but empty - NEEDS UPDATE

**Git Evidence:**
- `fb310e2f` (2025-09-10): "Cleaning up blog post frontmatter + mechanisms to keep frontmatter up to date + plan for SEO"
- `e3cacacea` (2025-09-10): "SEO improvements, retheme, etc"
- `103e8f1d` (2025-09-10): "Adding SEO poc"

**Existing Entry:**
- `2025-XX-XX-mechanic-establishment-seo.md` exists but is empty/planned

**Suggested Update:**
- **Inception Date:** 2025-09-10
- **Execution Date:** 2025-09-10 (or later if work continued)
- **Status:** `in-progress` or `completed`
- **Add execution details** with the 3 commits above

**Why it matters:**
- SEO is a critical blogging mechanic
- Work was actually done (not just planned)
- Should reflect actual implementation timeline

---

## 3. Card and Timeline Components ⭐ MEDIUM PRIORITY

**Status:** Component creation - NEEDS ENTRY

**Git Evidence:**
- `86ed353b` (2025-09-23): "Adding Card and Timeline Components"

**Suggested Entry:**
- **Type:** `component-creation-card-timeline`
- **Title:** "Card and Timeline Components Creation"
- **Inception Date:** 2025-09-23
- **Execution Date:** 2025-09-23
- **Status:** `completed`

**Why it matters:**
- New reusable components added to the blog
- Part of component library expansion
- Used in blog posts (e.g., professional contributions timeline)

---

## 4. Changelog System ⭐ MEDIUM PRIORITY

**Status:** Infrastructure feature - NEEDS ENTRY

**Git Evidence:**
- Changelog system was created (this system itself!)
- `generate-changelog-data.js` script exists
- Changelog component exists in `src/components/Changelog/`
- Heatmap visualization was implemented

**Suggested Entry:**
- **Type:** `mechanic-establishment-changelog` or `infrastructure-improvement-changelog`
- **Title:** "Blogging Mechanism - Changelog System"
- **Inception Date:** Check when changelog files/scripts were first added
- **Execution Date:** When heatmap/visualization was completed
- **Status:** `completed`

**Why it matters:**
- Major infrastructure addition
- Enables tracking of blog evolution
- Significant feature for blog transparency

---

## 5. Frontmatter Management Mechanism ⭐ LOW PRIORITY

**Status:** Mechanic - MAY NEED ENTRY

**Git Evidence:**
- `fb310e2f` (2025-09-10): "Cleaning up blog post frontmatter + mechanisms to keep frontmatter up to date + plan for SEO"
- `fix_frontmatter.py` script exists

**Suggested Entry:**
- **Type:** `mechanic-establishment-frontmatter-management`
- **Title:** "Blogging Mechanism - Frontmatter Management"
- **Inception Date:** 2025-09-10
- **Status:** `completed` or `in-progress`

**Why it matters:**
- Automation for maintaining blog post metadata
- Supports SEO and content organization

---

## 6. Automated Deployment ⭐ LOW PRIORITY

**Status:** Infrastructure - MAY NEED ENTRY

**Git Evidence:**
- Many "Deploy website" commits suggest automated deployment
- CDK infrastructure exists (mentioned in existing changelog entry)

**Existing Entry:**
- `2025-XX-XX-infrastructure-improvement-cdk-configuration.md` exists

**Suggested:**
- Check if deployment automation should be documented separately
- Or update existing CDK entry with deployment details

---

## Priority Recommendations

### Immediate (Create New Entries):
1. **Storybook Integration** - Major feature, no entry exists
2. **Card and Timeline Components** - Component creation, should be tracked

### High Priority (Update Existing):
3. **SEO Improvements** - Entry exists but empty, work was done
4. **Changelog System** - Meta entry for the system itself

### Medium Priority (Consider):
5. **Frontmatter Management** - If it's a significant mechanic
6. **Deployment Automation** - If separate from CDK config

---

## Next Steps

1. Create new changelog entries for Storybook and Card/Timeline components
2. Update SEO entry with actual execution details
3. Create changelog system entry (meta entry)
4. Run `extract-changelog-commits.js` on new entries to get commit details
5. Update changelog data generation

