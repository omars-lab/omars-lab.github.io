
// https://docusaurus.io/docs/styling-layout#css-modules
// https://codepen.io/merkund/pen/EGpOEr

/*
 * AI AGENTS UPDATE INSTRUCTIONS:
 * 
 * This component is tightly coupled with the blog post:
 * /docs/5-skills/preparing-for-interviews/understanding-differences-in-skills.mdx
 * 
 * WHEN TO UPDATE THE BLOG POST:
 * - Adding new skill categories (new 3-letter codes like ALN, XYZ)
 * - Modifying existing skill descriptions or expectations
 * - Changing skill codes or names
 * - Adding/removing levels (4, 5, 6, 7)
 * - Updating highlighting keywords
 * 
 * REQUIRED BLOG POST UPDATES:
 * 1. Add new skills to the table in the "SDE Expectations" section
 * 2. Add corresponding skill section with interview questions
 * 3. Add link reference at bottom: [ALN]: #alignment-consensus:~:text=%3E%20Alignment%20%26%20Consensus
 * 4. Update AI metadata section to reflect new skill dependencies
 * 
 * SKILL TABLE FORMAT:
 * | **Theme** | **[Skill Name][CODE]** | <SdeSkill role="SDE" skill="CODE" l="4"/> | <SdeSkill role="SDE" skill="CODE" l="5"/> | <SdeSkill role="SDE" skill="CODE" l="6"/> | <SdeSkill role="SDE" skill="CODE" l="7"/> |
 * 
 * SKILL SECTION FORMAT:
 * ##### > Skill Name {#skill-anchor}
 * * Key questions about the skill
 * * *Interview Questions*
 *     - "Behavioral question 1"
 *     - "Behavioral question 2"
 * 
 * LINK REFERENCE FORMAT:
 * [CODE]: #skill-anchor:~:text=%3E%20Skill%20Name
 * 
 * VERIFICATION CHECKLIST:
 * - [ ] All skill codes in component exist in blog post table
 * - [ ] All skill codes in blog post table exist in component
 * - [ ] All skill links navigate correctly
 * - [ ] Interview questions are level-appropriate and behavioral
 * - [ ] AI metadata reflects current skill dependencies
 */

import React from 'react';
import styles from '../../css/MDXTable.module.css';
function HTMLList(l) {
    return <ul>
        {
            l.map((value, index) => {
                return <li key={index}>{value}</li>
            })
        }
    </ul>
}

function highlightKeyWords(text, level) {
    if (typeof text !== 'string') return text;
    
    // Level-specific key words to highlight progression
    const levelKeywords = {
        4: [
            // L4: Learning and following
            'needs', 'guidance', 'direction', 'learns', 'follows', 'implements',
            'assigned', 'features', 'components', 'fundamentals', 'basic',
            'aligns', 'team decisions', 'established direction'
        ],
        5: [
            // L5: Independent work and technical depth
            'independently', 'occasional', 'guidance', 'complex', 'technical',
            'designs', 'architectures', 'applications', 'services', 'mentors', 'peers',
            'builds consensus', 'technical approaches', 'within the team'
        ],
        6: [
            // L6: Leadership and system thinking
            'leads', 'projects', 'proposes', 'team-wide', 'initiatives',
            'architectural', 'system', 'cross-team', 'coordinates', 'multiple teams',
            'mentors', 'engineers', 'promotes', 'growth',
            'aligns multiple teams', 'technical vision', 'architectural decisions'
        ],
        7: [
            // L7: Strategic and organizational impact
            'operates', 'independently', 'drives', 'company-wide', 'orchestrates',
            'strategic', 'organizational', 'defines', 'establishes', 'standards',
            'excellence', 'exemplary', 'senior engineers', 'future leaders',
            'organizational alignment', 'strategic technical direction', 'company-wide initiatives'
        ]
    };
    
    const keyWords = levelKeywords[level] || [];
    let highlightedText = text;
    
    keyWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<mark style="background-color: #fff3cd; padding: 1px 3px; border-radius: 3px; font-weight: 600;">${word}</mark>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}

function getSDEExpectation(role, skill, level) {
    const expectations = {
        SDE: {
            // Problem Solving & Scope
            PBD: {
                4: "Solves coding problems within existing features.",
                5: "Solves complex technical problems across multiple components.",
                6: "Solves business problems by designing technical solutions.",
                7: "Solves organizational problems by defining business strategy.",
            },
            // What They Deliver
            PRD: {
                4: "Working code that implements features.",
                5: "Technical designs and system architectures.",
                6: "Team standards, best practices, and reusable patterns.",
                7: "Business problem definitions and strategic direction.",
            },
            // Dealing With Ambiguity
            DWA: {
                4: "Handles unclear requirements within assigned features.",
                5: "Resolves ambiguity in technical design and implementation.",
                6: "Clarifies ambiguous business requirements and technical approaches.",
                7: "Defines and resolves ambiguous business problems and strategic direction.",
            },
            // Problem Solving Complexity
            DWC: {
                4: "Solves straightforward coding and implementation problems.",
                5: "Solves complex technical problems across multiple systems.",
                6: "Solves complex architecture and business problems.",
                7: "Solves significantly complex organizational and strategic problems.",
            },
            // Independence Level
            ATN: {
                4: "Needs regular guidance and direction.",
                5: "Works independently with occasional guidance.",
                6: "Leads projects and proposes team-wide initiatives.",
                7: "Operates independently and drives company-wide initiatives.",
            },
            // Code Quality
            SLQ: {
                4: "Code works but may need improvement.",
                5: "Code is clean, tested, and maintainable.",
                6: "Code is modular, flexible, and well-architected.",
                7: "Code sets the standard for excellence across the company.",
            },
            // Technical Impact
            DLC: {
                4: "Adds features to existing systems.",
                5: "Builds major parts of products and services.",
                6: "Improves system architecture and removes technical debt.",
                7: "Leads complex projects that transform the organization.",
            },
            // Process & Operations
            PLC: {
                4: "Improves monitoring and operational metrics.",
                5: "Automates team processes and workflows.",
                6: "Streamlines processes across multiple teams.",
                7: "Establishes engineering standards for the entire company.",
            },
            // Customer Focus
            CNT: {
                4: "Learns from customer interactions and advocates for user needs.",
                5: "Works directly with customers to understand requirements.",
                6: "Designs customer experiences and product interactions.",
                7: "Owns customer success and business outcomes.",
            },
            // Impact & Scope
            IMP: {
                4: "Impacts individual features and components.",
                5: "Impacts applications and services within the team.",
                6: "Impacts team architecture and yields significant performance, availability, or business value.",
                7: "Impacts organizational systems and how the company operates.",
            },   
            // Influence & Leadership
            INF: {
                4: "Influences code and implementation decisions.",
                5: "Influences team and product decisions.",
                6: "Influences organizational and architectural decisions.",
                7: "Influences company strategy and technology direction.",
            },
            // Alignment & Consensus Building
            ALN: {
                4: "Aligns with team decisions and follows established direction.",
                5: "Builds consensus on technical approaches within the team.",
                6: "Aligns multiple teams around technical vision and architectural decisions.",
                7: "Builds organizational alignment around strategic technical direction and company-wide initiatives.",
            },
            // Mentoring & Development
            MEN: {
                4: "Mentors interns and junior developers.",
                5: "Mentors peers and helps with career development.",
                6: "Mentors SDE I and II engineers and promotes their growth.",
                7: "Mentors senior engineers and develops future leaders.",
            },
            // Technical Expertise
            SME: {
                4: "Has solid programming fundamentals.",
                5: "Understands team's systems and architecture.",
                6: "Has deep expertise in team's technology stack.",
                7: "Has broad expertise across multiple systems and technologies.",
            },
            // Decision Making
            DCS: {
                4: "Makes implementation decisions within assigned tasks.",
                5: "Makes technical trade-offs for applications and services.",
                6: "Makes trade-offs between short-term needs and long-term goals.",
                7: "Influences strategic priorities and company-wide decisions.",
            },
            // Scope of Work
            CDB: {
                4: "Works on small to medium features and components.",
                5: "Works on large components and entire applications.",
                6: "Works on team-wide architecture and system design.",
                7: "Works on company-wide architecture and strategic initiatives.",
            },
            // Collaboration
            CLB: {
                4: "Collaborates with teammates on daily tasks.",
                5: "Collaborates across teams on shared projects.",
                6: "Leads cross-team initiatives and coordinates multiple teams.",
                7: "Orchestrates company-wide initiatives requiring multiple teams.",
            },
             // Specialized Abilities
             ABL: {
                4: "Develops core programming and problem-solving skills.",
                5: "Builds expertise in specific technologies and domains.",
                6: "Masters complex system design and architecture patterns.",
                7: "Excels at building consensus and decomposing complex problems into straightforward solutions.",
             },
            // Professional Mindset
            MND: {
               4: "Focuses on learning and delivering quality code.",
               5: "Develops ownership mindset and technical leadership skills.",
               6: "Embraces complex challenges and drives technical excellence.",
               7: "Tackles intrinsically hard problems, probes assumptions, and fosters shared understanding across the organization.",
           },
           // Force Multiplier
           FMX: {
               4: "Contributes to team productivity through reliable code delivery.",
               5: "Multiplies team impact through technical leadership and knowledge sharing.",
               6: "Amplifies organizational impact through architectural leadership and mentoring.",
               7: "Multiplies company-wide impact through strategic leadership, design reviews, and engineering community engagement.",
           }
        }
    };
    return expectations[role][skill][level];
}
export const SdeSkill = ({children, role, skill, l}) => (
    <span 
        className={styles.MDXTableEntry}
    >
{highlightKeyWords(getSDEExpectation(role, skill, l), l)}
    </span>
);

