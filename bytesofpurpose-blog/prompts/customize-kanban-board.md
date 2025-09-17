# Customize Kanban Board SVG

## Overview
This prompt guides you through customizing the kanban board SVG template (`/static/img/kanban-structure.svg`) to create a personalized kanban board with your own content and formatting.

## SVG Structure Understanding

### Base Template
- **File**: `/static/img/kanban-structure.svg`
- **Dimensions**: 2781 × 1623 pixels
- **ViewBox**: 0 0 2781 1623
- **Columns**: 5 columns with distinct color themes

### Layer Structure (Critical for Visibility)
The SVG must be structured in this exact order for proper rendering:

1. **Back Layer**: Column backgrounds (light colors)
2. **Middle Layer**: Column headers (dark colors) and titles
3. **Front Layer**: Task cards with drop shadows

## Customization Steps

### 1. Column Configuration

#### Column Headers
Update the column titles in the middle layer section:
```xml
<!-- Column Titles (Middle Layer) -->
<text x="268" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">YOUR_COLUMN_1</text>
<text x="836" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">YOUR_COLUMN_2</text>
<text x="1404" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">YOUR_COLUMN_3</text>
<text x="1963" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">YOUR_COLUMN_4</text>
<text x="2522" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">YOUR_COLUMN_5</text>
```

#### Column Colors
Customize the color scheme by updating these sections:

**Column Backgrounds (Back Layer)**:
```xml
<rect y="118" width="536" height="1504" rx="6" fill="#E3F2FD"/>  <!-- Column 1 background -->
<rect x="568" y="118" width="536" height="1504" rx="6" fill="#FFF3E0"/>  <!-- Column 2 background -->
<rect x="1136" y="118" width="536" height="1504" rx="6" fill="#E8F5E8"/>  <!-- Column 3 background -->
<rect x="1695" y="118" width="536" height="1504" rx="6" fill="#FCE4EC"/>  <!-- Column 4 background -->
<rect x="2254" y="118" width="536" height="1504" rx="6" fill="#F3E5F5"/>  <!-- Column 5 background -->
```

**Column Headers (Middle Layer)**:
```xml
<rect width="536" height="228" rx="6" fill="#1976D2"/>  <!-- Column 1 header -->
<rect x="568" width="536" height="228" rx="6" fill="#F57C00"/>  <!-- Column 2 header -->
<rect x="1136" width="536" height="228" rx="6" fill="#388E3C"/>  <!-- Column 3 header -->
<rect x="1695" width="536" height="228" rx="6" fill="#C2185B"/>  <!-- Column 4 header -->
<rect x="2254" width="536" height="228" rx="6" fill="#7B1FA2"/>  <!-- Column 5 header -->
```

### 2. Task Card Configuration

#### Card Structure Template
Each task card follows this structure:
```xml
<g filter="url(#filter0_ddd_2013_253)">
<rect width="416" height="240" transform="translate(X Y)" fill="CARD_COLOR"/>
<text x="TITLE_X" y="TITLE_Y" fill="#333" font-family="Arial" font-size="16" font-weight="bold">TASK_TITLE</text>
<text x="DESC_X" y="DESC_Y" fill="#666" font-family="Arial" font-size="14">TASK_DESCRIPTION</text>
<text x="PRIORITY_X" y="PRIORITY_Y" fill="#999" font-family="Arial" font-size="12">PRIORITY_LABEL • ESTIMATE</text>
<circle cx="DOT_X" cy="DOT_Y" r="8" fill="PRIORITY_COLOR"/>
</g>
```

#### Card Positioning
- **Column 1**: X = 60, Title_X = 80
- **Column 2**: X = 614, Title_X = 634  
- **Column 3**: X = 1192, Title_X = 1212
- **Column 4**: X = 1751, Title_X = 1771
- **Column 5**: X = 2302, Title_X = 2322

#### Vertical Positioning
- **First card**: Y = 317, Title_Y = 350, Desc_Y = 375, Priority_Y = 520, Dot_Y = 340
- **Second card**: Y = 600, Title_Y = 633, Desc_Y = 658, Priority_Y = 803, Dot_Y = 623
- **Third card**: Y = 883, Title_Y = 916, Desc_Y = 941, Priority_Y = 1086, Dot_Y = 906

#### Card Colors (matching column themes)
- **Column 1**: `#A8DAFF` (light blue)
- **Column 2**: `#FFD3A8` (light orange)
- **Column 3**: `#B3EFBD` (light green)
- **Column 4**: `#FFAFA3` (light pink)
- **Column 5**: `#D3BDFF` (light purple)

### 3. Priority System

#### Priority Labels (Jira-style)
- **High Priority**: "High Priority • X days"
- **Medium Priority**: "Medium Priority • X days"
- **Low Priority**: "Low Priority • X days"

#### Priority Colors
- **High Priority**: Red (`#FF0000`)
- **Medium Priority**: Orange (`#FF9800`)
- **Low Priority**: Light Grey (`#CCCCCC`)

#### Priority Sorting
Cards within each column should be sorted by priority:
1. High Priority (top)
2. Medium Priority (middle)
3. Low Priority (bottom)

### 4. Text Guidelines

#### Title Guidelines
- Keep titles concise (2-4 words)
- Use title case
- Maximum ~25 characters to fit in card width

#### Description Guidelines
- Single line descriptions only
- Maximum ~45 characters to fit in card width
- Use clear, actionable language
- Avoid line breaks - combine into single text element

#### Priority/Estimate Guidelines
- Use Jira-style format: "Priority Level • X days"
- Place in bottom left corner of card
- Use bullet separator (•) between priority and estimate

### 5. Filter Configuration

#### Drop Shadow Filter
Ensure the filter covers the entire SVG area:
```xml
<filter id="filter0_ddd_2013_253" x="0" y="0" width="3000" height="2000" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
```

This prevents cards from being clipped or not rendering properly.

## Content Requirements

### Required Information for Each Card
1. **Task Title**: Brief, descriptive name
2. **Task Description**: Single-line explanation of what needs to be done
3. **Priority Level**: High, Medium, or Low
4. **Time Estimate**: Number of days (or hours/weeks as appropriate)

### Column Distribution
- Ensure each column has at least one card
- Distribute cards logically across workflow stages
- Consider realistic work progression

## Example Customization

### Sample Workflow: Software Development
- **Column 1**: BACKLOG
- **Column 2**: IN PROGRESS  
- **Column 3**: REVIEW
- **Column 4**: TESTING
- **Column 5**: DONE

### Sample Card Content
```xml
<g filter="url(#filter0_ddd_2013_253)">
<rect width="416" height="240" transform="translate(60 317)" fill="#A8DAFF"/>
<text x="80" y="350" fill="#333" font-family="Arial" font-size="16" font-weight="bold">User Authentication</text>
<text x="80" y="375" fill="#666" font-family="Arial" font-size="14">Implement OAuth2 login with Google and GitHub</text>
<text x="80" y="520" fill="#999" font-family="Arial" font-size="12">High Priority • 5 days</text>
<circle cx="450" cy="340" r="8" fill="#FF0000"/>
</g>
```

## Best Practices

### Design Principles
1. **Consistency**: Use the same color scheme throughout
2. **Clarity**: Keep text concise and readable
3. **Visual Hierarchy**: High priority items should stand out
4. **Realistic Estimates**: Use accurate time estimates
5. **Logical Flow**: Arrange cards to show realistic work progression

### Technical Considerations
1. **Layer Order**: Always maintain the correct layer structure
2. **Text Positioning**: Ensure all text fits within card boundaries
3. **Filter Coverage**: Use expanded filter region to prevent clipping
4. **Color Contrast**: Ensure text is readable against card backgrounds

### Content Guidelines
1. **Actionable Tasks**: Use clear, actionable language
2. **Appropriate Granularity**: Tasks should be specific but not overly detailed
3. **Realistic Scope**: Each card should represent a reasonable amount of work
4. **Clear Dependencies**: Arrange cards to show logical dependencies

## Troubleshooting

### Common Issues
1. **Cards Not Visible**: Check layer order and filter region
2. **Text Overflow**: Reduce text length or adjust positioning
3. **Color Issues**: Ensure proper hex color codes
4. **Alignment Problems**: Verify coordinate positioning

### Validation Checklist
- [ ] All columns have at least one card
- [ ] Cards are sorted by priority within each column
- [ ] Text fits within card boundaries
- [ ] Priority colors match the specified scheme
- [ ] Layer structure is correct (backgrounds → headers → cards)
- [ ] Filter region covers entire SVG area

## Output Requirements

When customizing the kanban board, provide:
1. **Complete SVG file** with all customizations applied
2. **Column configuration** (names and colors)
3. **Card content** for each task
4. **Priority distribution** across columns
5. **Color scheme** used for the board

This ensures the final kanban board is professional, readable, and follows the established formatting standards.
