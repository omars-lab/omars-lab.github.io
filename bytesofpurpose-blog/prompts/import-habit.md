Markdown Files in the omars-lab.github.io/bytesofpurpose-blog/docs/8-habits directory should all represent habits .. 

# Content

The structure of each file should adhere to the following rules:

## Title 
The main title of the post should be "The Habit of <Habit>"
The habit itself should generally not be planning habits, we should study the file to determine the true essence of the habit and represent it with only essential terms, removing "planning" as needed.

## Front Matter Section

Every file in the same directory as this prompt shoudld start with a front matter section with content similar to the following:
```
---
slug: habits-<habbit>
title: '<Tile of Habit>'
description: '<Short Description of what this habit entials>'
authors: [oeid]
tags: [<tag1 relating to habit>, <tag 2 relating to habit>, ...]
draft: true
date: <Todays date in followign format: 2025-02-15T10:00>
--- 
```

## Figma Diagram Section

Every figma link should be replaced with a figma diagram embedding (note www.figma.com needs to be replaced with embed.figma.com and a query paramater of embed-host=share needs to be added to the end of the URL)
```
<iframe 
  style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }} 
  width="100%" 
  height="600" 
  src="<your-figma-url>" 
  allowFullScreen
/>
```

## Questions Section

If relevant, the questions I ask myself on a regular basis in context of the habit should be captured as a list of bullet points.


## Decsision Section
Any rational as to why the habit is important / why I want to do it on a regular basis should be consolidated.

## Strategy Section
Any information regarindg how I strategically approach perfomring the habit should be aggregated into its own section - things like holding sepecific events, their frequency, and more.

## Hashtags Section

There should be a section of high level themes amoungst tasks related to this habit ... 
Each tag should be formated in the following pattern: #<habit>/<theme>

## The Kinds of Action Items Section

Files in this directory might contain a mix of "abstract, habit level" categorization of the kind of tasks I would bucket under this habit along with grainular, personal backlog of action items I plan on doing. You are responsible for the following:
    * Ensure the habit document has a section for the abstract, generalized action items that I perform. The section should be titled "# Suggested Action Items". It should contain abstract activities I would generally do / repeat and not a specific task.
    * Each of these themes should have its own unique hashtag that is nested under a shared hastag for the parent habit: `#<habit>/<theme>`
    * if a plan only has grainular/personal backlog todos, try to generalize the abstract action item that one could generally suggest to others to do and ensure to add examples in the "Suggested Action Items" section.

## Specific Action Items
* Grainular/specific personal todos should be cleaned up removed. For any action item, its essence should have been represented in "Teh Kinds of Action Items Section" 

# Naming

Each file in this directory should be named after the habit itself ...
The name of the file should match the name of the slug from the frontmatter but also have a `.mdx` suffix

# Editing Rules
* Do not remove any content! Only re-orgranize the existing content! 
* Only add new content / sections if really needed. When adding a new section, unspecified in this prompt, suggest why you are adding it and how this prompt can be updated.