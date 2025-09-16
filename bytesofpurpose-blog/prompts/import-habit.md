This prompt is for importing habit files from the `still-importing` directory into properly formatted habit files in the main `8-habits` directory. The imported files should represent habits that I practice regularly.

# Step-by-Step Import Process

Follow these steps in order to ensure consistent, high-quality results:

1. **Check for Existing Imports**: Look for import tracking headers in the `still-importing` directory
2. **Read and Analyze**: Study the original file content thoroughly
3. **Determine Habit Name**: Extract the core behavior, removing "planning" words
4. **Consider Merging**: Check if this habit should be merged with an existing habit file
5. **Add Import Tracking**: Add tracking header to original file
6. **Create New File OR Merge**: Either build new habit file or merge into existing one
7. **Extract Content**: Organize content into appropriate sections
8. **Create Abstract Categories**: Build "Kinds of Action Items" with hashtags
9. **Organize Specific Tasks**: Move concrete tasks to bottom with proper hashtag relationships
10. **Validate**: Check that all content is preserved and properly categorized 

# Content

The structure of each file should adhere to the following rules and appear in this exact order:

## Import Tracking
After importing a file, add a tracking header to the original file in the `still-importing` directory to mark it as imported:
```
---
**IMPORTED FROM**: `still-importing/<original-filename>`
**IMPORTED INTO**: `8-habits/<new-filename>.mdx`
**IMPORT DATE**: <Today's date>
---
```
This is the ONLY edit that should be made to the original file.

## Title 
The main title of the post should be "The Habit of <Habit>"
The habit itself should generally not be planning habits, we should study the file to determine the true essence of the habit and represent it with only essential terms, removing "planning" as needed.

## Front Matter Section

Every new imported file should start with a front matter section with content similar to the following:
```
---
slug: habits-<habit>
title: 'The Habit of <Habit>'
description: '<Short Description of what this habit entails>'
authors: [oeid]
tags: [<tag1 relating to habit>, <tag 2 relating to habit>, ...]
draft: true
date: <Today's date in following format: 2025-02-15T10:00>
--- 
```

## Figma Diagram Section

Follow instructions in this file to fix figma links: bytesofpurpose-blog/prompts/fix-figma-link.md



## Questions Section

If relevant, the questions I ask myself on a regular basis in context of the habit should be captured as a list of bullet points.

**Content Extraction Guidelines**:
- Look for sentences ending with "?" 
- Include "How will I...", "What should I...", "Why do I..." type questions
- Extract questions from anywhere in the original content

## Decision Section
Any rationale as to why the habit is important / why I want to do it on a regular basis should be consolidated.

**Content Extraction Guidelines**:
- Look for statements about importance, necessity, or motivation
- Include quotes or insights that explain the "why"
- Extract phrases like "I need to...", "It's important to...", "This helps me..."

## Strategy Section
Any information regarding how I strategically approach performing the habit should be aggregated into its own section - things like holding specific events, their frequency, and more.

**Content Extraction Guidelines**:
- Look for process descriptions, methodologies, or approaches
- Include frequency mentions (daily, weekly, monthly, etc.)
- Extract phrases about "how I do this" or "my approach to..."

## Strategic Questions Identification

When processing content, identify strategic questions that should be integrated into the "Kinds of Action Items" section:

**What to Look For**:
- Questions ending with "?" that represent strategic thinking
- Questions that help determine approach or direction
- Questions that guide decision-making within a category
- Questions that are repeated or represent ongoing considerations

**How to Handle Strategic Questions**:
- **DO NOT** convert questions to statements
- **DO** keep them in their natural question format
- **DO** organize them under the relevant abstract category
- **DO** include them as sub-bullets under "Strategic Questions / Ask Yourself:"
- **DO NOT** put them in the Specific Action Items section

**Example Structure**:
```
### #habit/category
- Abstract activity 1
- Abstract activity 2
- Strategic Questions / Ask Yourself:
  - What should I consider when doing this?
  - How do I determine the best approach?
  - What criteria should guide my decisions?
```

## The Kinds of Action Items Section

**Note**: The hashtags from this section will be used to categorize specific action items later in the document.

Files in the `still-importing` directory might contain a mix of "abstract, habit level" categorization of the kind of tasks I would bucket under this habit along with granular, personal backlog of action items I plan on doing. You are responsible for the following:
    * Ensure the habit document has a section for the abstract, generalized action items that I perform. The section should be titled "# Kinds of Action Items". It should contain abstract activities I would generally do / repeat and not a specific task.
    * Each of these themes should have its own unique hashtag that is nested under a shared hashtag for the parent habit: `#<habit>/<theme>`
    * **CRITICAL**: Each "Kind of Action Item" must explicitly list any essential activities I stated I should/must/need to do, using my exact language without modification. This preserves the concrete requirements within the abstract categories.
    * **STRATEGIC QUESTIONS INTEGRATION**: Within each category, include a "Strategic Questions / Ask Yourself:" bullet point with strategic questions as sub-bullets. These questions should be kept in their natural question format and organized under the relevant abstract category.
    * If a plan only has granular/personal backlog todos, try to generalize the abstract action item that one could generally suggest to others to do and ensure to add examples in the "Kinds of Action Items" section.

## Specific Action Items
* Granular/specific personal todos should be moved to this section at the bottom of the document without editing their content.
* **HASHTAG RULES - CRITICAL FOR CORRECT IMPLEMENTATION**:
  - **ONLY root-level (un-indented) action items should have hashtags appended** that relate them back to the appropriate "Kind of Action Item" theme: `#<habit>/<theme>`
  - **Sub-tasks (indented items) should NEVER have hashtags** - they inherit the categorization from their parent task
  - **Example of CORRECT hashtag usage**:
    ```
    - [ ] Read books Bob Mentioned #growing/business-expertise
      - [ ] Connecting the Dots
      - [ ] Crossing the Chasm
    ```
  - **Example of INCORRECT hashtag usage**:
    ```
    - [ ] Read books Bob Mentioned #growing/business-expertise
      - [ ] Connecting the Dots #growing/business-expertise  ❌ WRONG
      - [ ] Crossing the Chasm #growing/business-expertise  ❌ WRONG
    ```
* If an indented task doesn't have a sensible parent task, un-indent it to make it a parent task and add the appropriate hashtag
* For any action item, its essence should have been represented in "The Kinds of Action Items Section" 

# Naming

Each imported file should be named after the habit itself and saved in the main `8-habits` directory. The name of the file should match the name of the slug from the frontmatter but also have a `.mdx` suffix.

## Determining the Habit Name
- Study the existing content to identify the core activity or practice being described
- Remove words like "planning", "managing", or "organizing" if they obscure the true habit
- Focus on the essential action or behavior that is being repeated regularly
- Use clear, concise terms that capture the essence of the habit

# Import Process Rules
* **DO NOT modify the original files in the `still-importing` directory EXCEPT to add the import tracking header**
* Create new files in the main `8-habits` directory based on the content from `still-importing`
* Only import habits that haven't been imported before (check existing files in `8-habits` directory)
* Do not remove any content from the original! Only re-organize the existing content into the new structure! 
* Only add new content / sections if really needed. When adding a new section, unspecified in this prompt, suggest why you are adding it and how this prompt can be updated.

## Checking for Existing Imports
Before importing a habit, check if it already exists in the main `8-habits` directory by:
1. Looking for files with similar habit names
2. Checking the import tracking headers in the `still-importing` directory to see what was previously imported
3. If a habit already exists, skip importing it and note that it was already processed

## Considering Habit Merging

**CRITICAL**: Before creating a new habit file, evaluate if the content should be merged with an existing habit instead.

### When to Consider Merging
- The habits have **very similar end objectives** (e.g., "growing" and "learning")
- They involve **the same kinds of action items** and abstract categories
- They have **very similar concrete action items** and tasks
- The content is **complementary** rather than distinct
- One habit has **minimal content** that would benefit from being combined

### When NOT to Merge
- Habits have **distinct, separate objectives**
- They involve **different types of activities** or approaches
- The content is **substantial enough** to warrant its own file
- They serve **different purposes** in your workflow

### Merging Process
If merging is appropriate:
1. **Add import tracking header** to the original file being merged
2. **Merge content** into the existing habit file by:
   - Adding new questions to the Questions section
   - Enhancing the Decision section if new rationale is provided
   - Expanding the Strategy section with additional approaches
   - **Merging abstract categories** in "Kinds of Action Items" (combine similar themes)
   - **Adding new specific tasks** to the existing Specific Action Items section
3. **Update hashtags** to ensure consistency across merged content
4. **Preserve all original content** from both files

### When Unsure
If you're uncertain whether to merge or create a new file, **ask for confirmation** before proceeding. It's better to check than to make the wrong decision.

### Example Merging Scenario
- **Original**: "Planning To Learn" (minimal content about learning strategies)
- **Existing**: "The Habit of Growing" (comprehensive growth and development)
- **Decision**: Merge learning content into growing habit since they share similar objectives and learning is a key component of growing

# Edge Cases and Special Situations

## Files with No Action Items
- If a file contains no specific action items, focus on creating comprehensive "Kinds of Action Items" based on the content
- Ensure the abstract categories capture the essential activities described in the text

## Files with Only Abstract Content
- If a file only contains abstract/general content, create "Kinds of Action Items" that represent the themes
- Add a note in the "Specific Action Items" section indicating that no specific tasks were found

## Files with Mixed Content
- Separate abstract categories from specific tasks as described in the main instructions
- Ensure each specific task is linked to an appropriate abstract category via hashtags

## Ambiguous Habit Names
- If the habit name is unclear, choose the most specific, actionable term that represents the core behavior
- Avoid generic terms like "productivity" or "organization" unless they truly represent the habit

# Quality Validation Checklist

Before considering the import complete, verify the following:

## ✅ Content Preservation
- [ ] All original content has been preserved (no content lost)
- [ ] All original tasks and todos are included in the new file
- [ ] Original language and phrasing maintained where possible

## ✅ Structure Compliance
- [ ] File starts with front matter (no import header in new file)
- [ ] All required sections are present in correct order
- [ ] Title follows "The Habit of <Habit>" format
- [ ] File is saved with `.mdx` extension in main `8-habits` directory

## ✅ Hashtag Implementation
- [ ] Only parent (un-indented) tasks have hashtags
- [ ] No sub-tasks have hashtags
- [ ] All hashtags follow `#<habit>/<theme>` format
- [ ] Each specific task is linked to an abstract category

## ✅ Abstract Categories
- [ ] "Kinds of Action Items" section contains abstract, generalizable activities
- [ ] Each category includes essential "I need to..." statements using exact language
- [ ] Categories are distinct and non-overlapping
- [ ] All specific tasks can be mapped to at least one abstract category
- [ ] Strategic questions are integrated into relevant categories as "Strategic Questions / Ask Yourself:" sub-bullets
- [ ] Strategic questions are kept in their natural question format (not converted to statements)
- [ ] Strategic questions are organized under appropriate abstract categories

## ✅ Import Tracking
- [ ] Original file has import tracking header added
- [ ] Tracking header includes source, destination, and date
- [ ] No other modifications made to original file

## ✅ Merging Decision (if applicable)
- [ ] Considered whether content should be merged with existing habit
- [ ] If merged, all content from both files is preserved
- [ ] If merged, abstract categories are properly combined
- [ ] If merged, hashtags are consistent across merged content
- [ ] If uncertain about merging, asked for confirmation

## ✅ Content Organization
- [ ] Questions section contains relevant questions from original
- [ ] Decision section explains why the habit is important
- [ ] Strategy section describes how the habit is approached
- [ ] Specific action items are at the bottom with proper hashtag relationships