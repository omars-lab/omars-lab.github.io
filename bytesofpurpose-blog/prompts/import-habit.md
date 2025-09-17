This prompt is for importing habit files from the `bytesofpurpose-blog/importing` directory into properly formatted habit files in the main `bytesofpurpose-blog/docs/3-habits` directory. The imported files should represent habits that I practice regularly.

# Step-by-Step Import Process

Follow these steps in order to ensure consistent, high-quality results:

1. **Check for Existing Imports**: Look for import tracking headers in the `bytesofpurpose-blog/importing` directory
2. **Read and Analyze**: Study the original file content thoroughly
3. **Determine Habit Name**: Extract the core behavior, removing "planning" words
4. **Consider Scope and Domain**: Determine if this is about a specific domain (e.g., "building habits") or general practice (e.g., "process engineering")
5. **Consider Merging**: Check if this habit should be merged with an existing habit file
6. **Add Import Tracking**: Add tracking header to original file
7. **Create New File OR Merge**: Either build new habit file or merge into existing one
8. **Handle Figma Links**: Check for Figma links and convert them properly (see Figma Section below)
9. **Extract Content**: Organize content into appropriate sections
10. **Capture References**: Extract links, resources, and external references into References section
11. **Create Abstract Categories**: Build "Kinds of Action Items" with hashtags
12. **Organize Specific Tasks**: Move concrete tasks to bottom with proper hashtag relationships
13. **Group and Sort Tasks**: Group action items by theme and sort by importance within each theme
14. **Add Emoji to Title**: Include a relevant emoji in the frontmatter title
15. **Move to Done Directory**: Move the original file to `bytesofpurpose-blog/importing/done` directory
16. **Validate**: Check that all content is preserved and properly categorized 

# Content

The structure of each file should adhere to the following rules and appear in this exact order:

1. Front Matter Section
2. Figma Diagram Section  
3. Questions Section
4. Decision Section
5. Strategy Section
6. References Section
7. The Kinds of Action Items Section
8. Specific Action Items Section

## Import Tracking
After importing a file, add a tracking header to the original file in the `bytesofpurpose-blog/importing` directory to mark it as imported:
```
---
**IMPORTED FROM**: `bytesofpurpose-blog/importing/<original-filename>`
**IMPORTED INTO**: `bytesofpurpose-blog/docs/3-habits/<new-filename>.mdx`
**IMPORT DATE**: <Today's date>
---
```
This is the ONLY edit that should be made to the original file.

## File Movement
After successfully importing and adding the tracking header, move the original file to the `bytesofpurpose-blog/importing/done` directory. This helps:
- Keep track of which files have been processed
- Prevent re-importing the same files
- Maintain a clean import directory with only unprocessed files

## Cleanup and File Management
- **Check for old files**: Look for any old habit files that may have been renamed or refactored
- **Delete outdated files**: Remove any files that are no longer accurate or have been superseded
- **Maintain consistency**: Ensure the file system reflects the current state of habits
- **Update references**: Make sure import tracking headers point to the correct final filenames

## Title 
The main title of the post should be "The Habit of <Habit>"
The habit itself should generally not be planning habits, we should study the file to determine the true essence of the habit and represent it with only essential terms, removing "planning" as needed.

**CRITICAL NAMING GUIDELINES**:
- Avoid generic terms like "developing" (too broad - could be code, habits, processes, etc.)
- Be specific about the actual behavior: "building habits", "process engineering", "consolidating tools"
- Consider the scope: is this about a specific domain or general practice?
- Use precise terminology that clearly indicates what the habit actually involves
- Examples of good names: "The Habit of Building Habits", "The Habit of Process Engineering", "The Habit of Consolidating"

**SCOPE AND DOMAIN CONSIDERATIONS**:
- **Specific Domain**: If the habit is about a particular area (e.g., "building habits"), make it clear in the name
- **General Practice**: If the habit applies broadly (e.g., "process engineering"), ensure the name reflects the general nature
- **Avoid Ambiguity**: Don't use terms that could apply to multiple domains without clarification
- **Consider Context**: Think about what the user would expect when they see this habit name

## Front Matter Section

Every new imported file should start with a front matter section with content similar to the following:
```
---
slug: habits-<habit>
title: '<emoji> The Habit of <Habit>'
description: '<Short Description of what this habit entails>'
authors: [oeid]
tags: [<tag1 relating to habit>, <tag 2 relating to habit>, ...]
draft: true
date: <Today's date in following format: 2025-02-15T10:00>
--- 
```

**Emoji Selection Guidelines**:
- Choose a relevant, professional emoji that clearly represents the habit's core concept
- Use consistent emoji styles and avoid duplicates across habit files
- Ensure the emoji is appropriate for both personal and professional contexts
- Examples: 🤖 for automation, ✍️ for blogging, 🏗️ for building, 🔍 for discovery, 💻 for development, 🚀 for entrepreneurship, 🌱 for personal growth, 📈 for professional growth, 🕌 for spiritual growth, 💡 for ideation, 💪 for health, 💰 for finances, ⏰ for time management, 👥 for mentorship, 🗂️ for organizing, 📋 for planning, 🎯 for prioritizing, ⚙️ for processes, 🎨 for interests, 📚 for reading, 🤔 for reflecting, 📊 for reviewing, 🔧 for tinkering, 📈 for tracking

## Figma Diagram Section

**CRITICAL**: Always check the original file for Figma links and handle them properly.

### If the original file contains a Figma link:
1. **Convert the link** by replacing `www.figma.com` with `embed.figma.com`
2. **Add embed parameter** by appending `&embed-host=share` to the URL
3. **Create iframe embedding** using this exact format:
```jsx
<iframe 
  style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }} 
  width="100%" 
  height="600" 
  src="<converted-figma-url>" 
  allowFullScreen
/>
```

### If the original file has NO Figma link:
Add a markdown todo with today's date:
```markdown
- [ ] Add Figma diagram link >2025-01-31
```

**Example conversion**:
- Original: `https://www.figma.com/board/reFUj3lFudhquKldnUw9dL/The-Habit-Board?node-id=32-507&t=ow2NqS1i4s7oQA7p-4`
- Converted: `https://embed.figma.com/board/reFUj3lFudhquKldnUw9dL/The-Habit-Board?node-id=32-507&t=ow2NqS1i4s7oQA7p-4&embed-host=share`


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

## References Section
Capture any standalone links, references, or external resources that are not actionable todos but provide valuable context or resources for the habit.

**Content Extraction Guidelines**:
- Include standalone URLs, web links, and external references that are not part of specific todos
- Capture book titles, article references, or resource mentions that stand alone
- Include tool references, software mentions, or platform links that are not actionable tasks
- Preserve any research links or educational resources that are not specific action items
- Format as a bulleted list with descriptive text when possible
- **DO NOT** include references that are sub-bullets of specific todos (these should stay with their parent todo)
- **DO NOT** include these in the Specific Action Items section unless they are actionable todos
- **DO** preserve the original links and references exactly as written
- **DO** separate standalone references from todo-related references

**Example Structure**:
```markdown
## References

- [SEO Trends in 2024: The Ones You Need to Know About](https://www.semrush.com/blog/seo-trends/)
- [Health Implications of CNC Cutters](https://www.twi-global.com/technical-knowledge/faqs/faq-are-there-any-health-and-safety-implications-of-cutting-and-welding-plastics)
- [ChatGPT Chat: Opening My Own Business](https://chatgpt.com/c/67763087-2374-8007-82a0-53bfcbade98e)
- Book: "Connecting the Dots" by Bob
- Tool: Redash for data visualization

**Note**: References that are sub-bullets of specific todos (like URLs under action items) should remain with their parent todo in the Specific Action Items section, not moved to this References section.
```

### Handling Minimal Content Files
Some imported files may have minimal content beyond Figma links or basic structure. In these cases:
- **Still create all required sections** (Questions, Decision, Strategy, References, Kinds of Action Items, Specific Action Items)
- **Extract what you can** from the available content
- **Add a note** in the Specific Action Items section explaining that strategic questions were incorporated into abstract categories
- **Don't skip sections** - maintain the complete structure even with minimal content
- **Focus on the essence** - what can you infer about the habit from the available information?
- **Include References section** even if empty, to maintain consistent structure

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

Files in the `bytesofpurpose-blog/importing` directory might contain a mix of "abstract, habit level" categorization of the kind of tasks I would bucket under this habit along with granular, personal backlog of action items I plan on doing. You are responsible for the following:
    * Ensure the habit document has a section for the abstract, generalized action items that I perform. The section should be titled "# Kinds of Action Items". It should contain abstract activities I would generally do / repeat and not a specific task.
    * Each of these themes should have its own unique hashtag that is nested under a shared hashtag for the parent habit: `#<habit>/<theme>`
    * **CRITICAL**: Each "Kind of Action Item" must explicitly list any essential activities I stated I should/must/need to do, using my exact language without modification. This preserves the concrete requirements within the abstract categories.
    * **STRATEGIC QUESTIONS INTEGRATION**: Within each category, include a "Strategic Questions / Ask Yourself:" bullet point with strategic questions as sub-bullets. These questions should be kept in their natural question format and organized under the relevant abstract category.
    * If a plan only has granular/personal backlog todos, try to generalize the abstract action item that one could generally suggest to others to do and ensure to add examples in the "Kinds of Action Items" section.

## Specific Action Items
* Granular/specific personal todos should be moved to this section at the bottom of the document without editing their content.
* **PRESERVE ALL CONTEXT AND REFERENCES**: When moving todos, preserve all sub-bullets, references, links, and context exactly as they appear in the original file, maintaining the original indentation structure.
* **FORMAT SUB-BULLETS CORRECTLY**: 
  - **Actionable items** (todos, tasks) should use markdown todo format: `- [ ] Item`
  - **Non-actionable items** (references, links, context, notes) should use regular bullet points: `- Item`
  - **Preserve the original intent** - if it was a todo in the original, keep it as a todo; if it was a reference/note, use a regular bullet
* **GROUP BY THEME AND SORT BY IMPORTANCE**:
  - **Group action items by their hashtag themes** (e.g., all `#organizing/file-organization` items together)
  - **Sort within each theme by importance** with most important items at the top
  - **Treat parent tasks with subtasks as single units** - move the entire parent task and all its subtasks together when sorting
  - **Use theme headers** to clearly separate different groups: `### #habit/theme-name`
  - **Consider importance factors**: urgency, impact, dependencies, completion status, strategic value
* **HASHTAG RULES - CRITICAL FOR CORRECT IMPLEMENTATION**:
  - **ONLY root-level (un-indented) action items should have hashtags appended** that relate them back to the appropriate "Kind of Action Item" theme: `#<habit>/<theme>`
  - **Sub-tasks (indented items) should NEVER have hashtags** - they inherit the categorization from their parent task
  - **Example of CORRECT hashtag usage with preserved context and grouping**:
    ```
    ### #mastering/technical-topics
    - [ ] Learn more about react #mastering/technical-topics
    - [ ] System Cache and Buffers #mastering/technical-topics
      - Does the system actually always utilize 100% of mem?
    - [ ] Garbage Collection / Heap #mastering/technical-topics
      - How can I tap into taking measurements of heap space after the gc runs

    ### #managing-finances/hsa-optimization
    - [ ] HSA Transfer / Mail in #managing-finances/hsa-optimization
      - https://ttp.cbp.dhs.gov/getstarted;stepDone=3
      - https://www.fidelity.com/go/hsa/transfer
      - FAQ

    ### #growing/business-expertise
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
* **DO NOT separate references from their parent todos** - keep all context, links, and sub-bullets together with their parent task 

# Naming

Each imported file should be named after the habit itself and saved in the main `bytesofpurpose-blog/docs/3-habits` directory. The name of the file should match the name of the slug from the frontmatter but also have a `.mdx` suffix.

## Determining the Habit Name
- Study the existing content to identify the core activity or practice being described
- Remove words like "planning", "managing", or "organizing" if they obscure the true habit
- Focus on the essential action or behavior that is being repeated regularly
- Use clear, concise terms that capture the essence of the habit

# Import Process Rules
* **DO NOT modify the original files in the `bytesofpurpose-blog/importing` directory EXCEPT to add the import tracking header**
* Create new files in the main `bytesofpurpose-blog/docs/3-habits` directory based on the content from `bytesofpurpose-blog/importing`
* Only import habits that haven't been imported before (check existing files in `bytesofpurpose-blog/docs/3-habits` directory)
* Do not remove any content from the original! Only re-organize the existing content into the new structure! 
* Only add new content / sections if really needed. When adding a new section, unspecified in this prompt, suggest why you are adding it and how this prompt can be updated.
* **After successful import**: Move the original file to `bytesofpurpose-blog/importing/done` directory

## Checking for Existing Imports
Before importing a habit, check if it already exists in the main `bytesofpurpose-blog/docs/3-habits` directory by:
1. Looking for files with similar habit names
2. Checking the import tracking headers in the `bytesofpurpose-blog/importing` directory to see what was previously imported
3. Checking the `bytesofpurpose-blog/importing/done` directory to see what has already been processed
4. If a habit already exists, skip importing it and note that it was already processed

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

# Key Improvements and Learnings

Based on extensive experience with habit file imports, the following improvements have been integrated into this prompt:

## Enhanced Content Organization
- **Strategic Questions Integration**: Strategic questions are now properly identified and integrated into "Kinds of Action Items" sections as "Strategic Questions / Ask Yourself:" sub-bullets, keeping them in their natural question format
- **Reference Extraction**: Standalone links and resources are now captured in a dedicated References section, separate from actionable todos
- **Context Preservation**: All sub-bullets, references, and context are preserved exactly as they appear in the original file when moving todos
- **Proper Sub-bullet Formatting**: Non-actionable items use regular bullet points (`- Item`) while actionable items retain markdown todo format (`- [ ] Item`)

## Improved Task Organization
- **Theme-based Grouping**: Specific action items are now grouped by hashtag themes with clear headers (`### #habit/theme-name`)
- **Importance-based Sorting**: Within each theme, tasks are sorted by importance (urgency, impact, dependencies, strategic value)
- **Parent Task Preservation**: Parent tasks with subtasks are treated as single units when sorting to maintain context integrity

## Better Figma Handling
- **Comprehensive Figma Detection**: The prompt now includes detailed instructions for detecting and properly converting Figma links
- **Consistent Embedding Format**: Standardized iframe embedding format with proper styling and parameters
- **Fallback Handling**: Clear instructions for when no Figma links are present

## Enhanced Merging Logic
- **Clear Merging Criteria**: Specific guidelines for when to merge habits vs. create new files
- **Content Integration Process**: Step-by-step process for merging content while preserving all original information
- **Uncertainty Handling**: Instructions to ask for confirmation when merging decisions are unclear

## Improved Naming and Scope
- **Specific Naming Guidelines**: Clear rules for avoiding generic terms and ensuring specificity
- **Scope Considerations**: Guidelines for distinguishing between specific domain habits and general practices
- **Context-aware Naming**: Instructions to consider what users would expect when seeing the habit name

## Visual Enhancement
- **Emoji Integration**: All habit titles now include relevant emojis for better visual identification
- **Consistent Emoji Usage**: Guidelines for selecting appropriate, professional emojis that clearly represent each habit

## Advanced Task Organization Example
The organizing habit file demonstrates the advanced task organization principles:
- **Theme Headers**: Clear separation with `### #organizing/file-organization`, `### #organizing/work-streams`, etc.
- **Importance Sorting**: Most critical tasks (like "I need to distinguish knowledge files from Action Files") appear first within each theme
- **Context Preservation**: All sub-bullets and references are maintained exactly as they appeared in the original
- **Parent Task Integrity**: Complex tasks with multiple sub-bullets are moved as complete units
- **Proper Formatting**: Actionable sub-tasks use `- [ ]` format while references use `-` format

## Habit Refactoring and Merging Examples
Successful habit refactoring and merging examples:
- **Spiritual Growth Merger**: `habits-studying-islam.mdx` was successfully merged into `habits-growing-spiritually.mdx` because they shared similar objectives (spiritual development) and complementary content (Islamic studies + spiritual practices)
- **Professional vs Personal Growth**: `habits-growing-professionally.mdx` was refactored to focus on personal growth, while `habits-mastering.mdx` was repurposed for professional growth, with content migrated appropriately
- **Content Integration**: When merging, all content from both files was preserved, including questions, decisions, strategies, references, and action items
- **Hashtag Consistency**: Merged content maintained consistent hashtag patterns across all integrated material

# Quality Validation Checklist

Before considering the import complete, verify the following:

## ✅ Content Preservation
- [ ] All original content has been preserved (no content lost)
- [ ] All original tasks and todos are included in the new file
- [ ] Original language and phrasing maintained where possible

## ✅ Structure Compliance
- [ ] File starts with front matter (no import header in new file)
- [ ] All required sections are present in correct order (Front Matter, Figma, Questions, Decision, Strategy, References, Kinds of Action Items, Specific Action Items)
- [ ] Title follows "<emoji> The Habit of <Habit>" format with relevant emoji
- [ ] File is saved with `.mdx` extension in main `bytesofpurpose-blog/docs/3-habits` directory
- [ ] **Figma links properly converted to iframe embeddings** (if original file had Figma links)
- [ ] **Figma section has proper todo with date** (if original file had no Figma links)
- [ ] **References section captures all links and external resources** (if original file had references)

## ✅ Naming and Scope
- [ ] **Habit name is specific and not generic** (avoid "developing", "building", etc. without context)
- [ ] **Scope is clearly defined** (specific domain vs general practice)
- [ ] **Name accurately reflects the actual behavior** described in the content
- [ ] **No ambiguity** about what the habit involves

## ✅ Hashtag Implementation
- [ ] Only parent (un-indented) tasks have hashtags
- [ ] No sub-tasks have hashtags
- [ ] All hashtags follow `#<habit>/<theme>` format
- [ ] Each specific task is linked to an abstract category

## ✅ Task Organization
- [ ] **Action items are grouped by theme** using `### #habit/theme-name` headers
- [ ] **Tasks are sorted by importance** within each theme (most important first)
- [ ] **Parent tasks with subtasks are treated as single units** when sorting
- [ ] **All tasks within a theme are together** (no mixing of themes)
- [ ] **Importance factors considered**: urgency, impact, dependencies, completion status, strategic value

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
- [ ] Original file has been moved to `bytesofpurpose-blog/importing/done` directory

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
- [ ] References section captures all links, resources, and external references
- [ ] Specific action items are at the bottom with proper hashtag relationships