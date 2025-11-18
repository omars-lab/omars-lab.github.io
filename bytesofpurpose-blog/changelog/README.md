---
title: 'Changelog'
description: 'Track all changes, plans, and improvements to the blog'
---

# Changelog

This directory tracks all changes, plans, and improvements made to the blog. Each entry is a markdown file with frontmatter metadata.

## File Naming Convention

Files are named using the format: `YYYY-MM-DD-description.md`

- **YYYY-MM-DD**: Date of inception (for plans) or execution (for completed work)
- **description**: Brief description of the change

## Frontmatter Fields

Each changelog entry includes the following frontmatter fields:

- `title`: Human-readable title
- `description`: Brief description
- `status`: Current status (`planned`, `in-progress`, `completed`, `cancelled`)
- `inception_date`: Date when the plan/change was first conceived
- `execution_date`: Date when the change was executed (use `TBD` for plans)
- `type`: Type of change (`refactoring`, `feature`, `bugfix`, `documentation`, `infrastructure`)
- `component`: Affected component or area (optional)
- `priority`: Priority level (`low`, `medium`, `high`, `critical`)

## Status Values

- **planned**: Change is planned but not yet started
- **in-progress**: Change is currently being worked on
- **completed**: Change has been completed
- **cancelled**: Change was cancelled or abandoned

## Type Values

- **refactoring**: Code refactoring or restructuring
- **feature**: New feature addition
- **bugfix**: Bug fix
- **documentation**: Documentation updates
- **infrastructure**: Infrastructure or tooling changes

## Viewing Changelog

The changelog is accessible via the "Changelog" tab in the Docusaurus navbar.

## Entry Structure

Each changelog entry must have two main sections:

### 1. Execution Plan
This section describes what was planned to be done. It should include:
- Goals and objectives
- Planned approach or strategy
- Expected outcomes
- Any prerequisites or dependencies

### 2. Execution Results / Attempts
This section documents what was actually done or attempted. It should include:
- What was completed
- What was attempted but didn't work
- Challenges encountered
- Deviations from the plan
- Lessons learned
- Current status

For entries with status `planned`, the "Execution Results / Attempts" section should indicate that execution has not yet begun.

## Adding New Entries

1. Create a new markdown file in this directory
2. Use the naming convention: `YYYY-MM-DD-description.md`
3. Add appropriate frontmatter
4. Include both "Execution Plan" and "Execution Results / Attempts" sections
5. Update this README if needed

