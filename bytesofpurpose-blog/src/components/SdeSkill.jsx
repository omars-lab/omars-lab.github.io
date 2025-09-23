
// https://docusaurus.io/docs/styling-layout#css-modules
// https://codepen.io/merkund/pen/EGpOEr
import React from 'react';
import styles from '../css/MDXTable.module.css';
function HTMLList(l) {
    return <ul>
        {
            l.map((value, index) => {
                return <li>{value}</li>
                // return <li key={index}>{value}</li>
            })
        }
    </ul>
}

function getSDEExpectation(role, skill, level) {
    const expectations = {
        SDE: {
            // Problem Breakdown
            PBD: {
                4: "Breaks down component modifications into code changes.",
                5: "++ Breaks down technical solutions into component modifications.",
                6: "++ Breaks down business problems into technical solutions.",
                7: "++ Breaks down business goals into business problems.",
            },
            // Produces
            PRD : {
                4: "Produces code.",
                5: "++ Produces technical solution designs & architectures.",
                6: HTMLList([
                    "++ Establishes team standards",
                    "++ Establishes best practices",
                    "++ Establishes patterns",
                ]),
                7: "++ Defines Business Problems, Problem Statements, etc.",
            },
            // Dealing With Ambiguity
            DWA: {
                4: "Deals with component level ambiguity.",
                5: "++ Deals with technical solution ambiguity.",
                6: "++ Deals with technical methodology ambiguity.",
                7: "++ Deals with business problem ambiguity.",
            },
            // Problem Solving (Complexity)
            DWC: {
                4: "Solves straightforward technical problems.",
                5: "++ Solves complex technical problems.",
                6: "++ Solves complex architecture and business problems.",
                7: "++ Solves significantly complex / organizational problems.",
            },
             // Guidance / Autonomy
             ATN: {
                4: "Regularly guided. Told what to do",
                5: "Occasionally guided. Figures out areas of improvement.",
                6: "Rarely guided. Propose team wide projects.",
                7: "Limited guidance. Operates indepedently. Figures out what needs to be done. Propose org wide projects.",
            },
            // Code Quality
            SLQ: {
                4: "Code typically needs refactoring.",
                5: "Code is testable, maintainable, and efficient.",
                6: "Codes are modular, flexible, and extensible.",
                7: HTMLList([
                    "Code is exemplary; organized, simple, easy to read/clear, concisely documented, elegantly handles errors, etc.",
                    "Solutions are exemplary; cost optimized, scalable, available, redundant, rohobust, etc.",
                ])
            },
            // Delivery Contributions
            DLC: {
                4: HTMLList([
                    "Adds specific features to existing systems.",
                ]),
                5: HTMLList([
                    "Develops major parts of products/services.",
                ]),
                6: HTMLList([
                    "Simplifies codebases and architectures.",
                    "Optimizes architectures for cost, availability, maintainability, and extensibility",
                    "Resolves architecture deficiencies across the team; identifies and removes bottlenecks, etc.",
                    "Drives the development of software from scratch; from idea to launch.",
                ]),
                7: HTMLList([
                    "Successfully launches complex projects.",
                    "Addresses architecture deficiencies across the organization."
                ]),
            },            
            // Process Contributions
            PLC: {
                4: "Improves operational metrics and monitors.",
                5: "Automates/simplifies various team processes.",
                6: "Simplifies processes across the organization",
                7: HTMLList([
                    "Establishes best practices across the organization.",
                    "Sets the engineering standard for the company.",
                ])
            },
            // Customer Interactions
            CNT: {
                4: HTMLList([
                    "Shadow customer meetings.",
                    "Advocates for the customer.",
                    "Supports the customer."
                ]),
                5: "Works with customers.",
                6: "Crafts customer interactions.",
                7: "Owns customer outcomes."
            },  
            // Impacts
            IMP: {
                4: "N/A",
                5: "N/A",
                6: "Design/code impacts dependencies, yields significant performance, availability, or business value.",
                7: "Uses broad expertise or unique knowledge to impact systems and how organization operates.",
            },   
            // Influence and Alignment
            INF: {
                4: "Influences code base decisions.",
                5: "Influences team and product decisions.",
                6: "Influences organizational decisions.",
                7: HTMLList([
                    "Influences the business' and technology direction and strategy.",
                    "Aligns teams toward simple, coherent designs.",
                ])
            },
            // Advises
            ADV: {
                4: "Peers",
                5: "++ Manager",
                6: "++ Other Internal Engineers",
                7: HTMLList([
                    "++ Executives",
                    "++ External Engineers / Engineering Community",
                ])
            },            
            // Mentors, Guides Career Growth, and Promotes
            MEN: {
                4: "Interns",
                5: "++ Peers",
                6: HTMLList([
                    "++ Mentors SDE I and IIs.",
                    "++ Promotes SDE I and IIs",
                ]),
                7: HTMLList([
                    "++ Mentors SDE IIIs.",
                    "++ Promotes SDE IIIs to PEs.",
                ])
            },
            // Deep Understanding
            SME: {
                4: "Soid Technical Foundation.",
                5: "Understands team software architecture.",
                6: "Has detailed knowledge of team software architecture.",
                7: "Understands organization architecture.",
            },            
            // Actively Learns About ...
            LRN: {
                4: HTMLList([
                    "Learning team software architecture. Actively seeks knowledge and applies to software solutions."
                ]),
                5: "N/A",
                6: "N/A",
                7: HTMLList([""])
            },
            // Decisions
            DCS: {
                4: "N/A",
                5: HTMLList([
                    "Makes technical trade-off decisions at application level. "
                ]),
                6: HTMLList([
                    "Makes technical trade-offs between short term team needs and long term business needs. "
                ]),
                7: HTMLList([
                    "Influences priorities/trade-offs. Applies knowledge to invent, evolve, improve, simplify, etc."
                ])
            },
            // Code Base
            CDB: {
                4: HTMLList([
                    "Works small/medium components.",
                    "Works small/medium features.",
                ]),
                5: HTMLList([
                    "Works on large components, applications, device software or services. "
                ]),
                6: HTMLList([
                    "Works on team architecture."
                ]),
                7: HTMLList([
                    "Works on large-scale architecture."
                ])
            },
            // Promotes
            PRM: {
                4: "N/A",
                5: "N/A",
                6: HTMLList([
                    "Performs SDE II/III promo assessments."
                ]),
                7: HTMLList([
                    "Performs PE promo assessments."
                ])
            },
            // Collaboration
            CLB: {
                4: HTMLList([
                    "Collaborates with peers."
                ]),
                5: "N/A",
                6: HTMLList([
                    "May require members of team to execute."
                ]),
                7: HTMLList([
                    "May require more than one team to execute design."
                ])
            },
             // Abilities
             ABL: {
                4: "N/A",
                5: "N/A",
                6: "N/A",
                7: HTMLList([
                    "You are adept at building consensus.",
                    "You decompose complex problems into straightforward solutions.",
                ])
            },
            // Mindset
            MND: {
               4: "N/A",
               5: "N/A",
               6: "N/A",
               7: HTMLList([
                    "Tackles intrinsically hard problems, acquiring expertise as needed.",
                    "Probes assumptions, illuminates pitfalls, and fosters shared understanding.",
                    "Flexible, adapting your approach to meet the needs of the team, project, or product.",
                    "Solicits differing views and are willing to change your mind as you learn more.",
               ])
           },
           // Force Multiplier
           FMX: {
               7: HTMLList([
                    "You amplify your impact by leading design reviews for complex software and/or critical features both within your organization or at your location. ",
                    "You divide responsibilities so that each team can work independently and have the system come together into an integrated whole. ",
                    "You educate, keeping the engineering community up to date on advanced technical issues, technologies, and trends.",
                    "You participate, sharing knowledge and collaborating with other Senior Engineers, specifically attending and/or presenting at internal conferences, Principal Engineer community events and making yourself available to global developer outreach efforts.",
               ])
           }
        }
    };
    return expectations[role][skill][level];
}
export const SdeSkill = ({children, role, skill, l}) => (
    <span 
        className={styles.MDXTableEntry}
    >
{getSDEExpectation(role, skill, l)}
    </span>
);