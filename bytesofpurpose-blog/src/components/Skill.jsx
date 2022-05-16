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
            // Dealing With Ambiguity
            DWA: {
                4: HTMLList([
                    `Business problem defiend.`,
                    `Team technical patterns & practices defined.`,
                    `Technical solution (design & architecture) defined.`,
                    `Engineer only responsible for implmentation; problem already broken down.`
                ]),
                5: HTMLList([
                    `Business problem defiend.`,
                    `Team technical patterns & practices defined.`,
                    `Technical solution (design & architecture) is unclear.`,
                    `Engineer responsible for architecting & implmentation.`,
                ]),
                6: HTMLList([
                    `Business problem defiend.`,
                    `Team technical patterns & practices are unclear.`,
                    `Engineer responsible for establishing team patterns & practices, solution architecture, & implmentation.`,
                ]),
                7: HTMLList([
                    `Business problem is not clear.`,
                    `Team technical patterns & practices are unclear.`,
                    `Engineer responsible for assisting with business problem definition, team strategies, solution architecture, & implmentation.`,
                ]),
            },
            // Problem Solving (Complexity)
            DWC: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },
             // Guidance / Autonomy
             ATN: {
                4: `
                    Regularly guided by peers & manager.
                `,
                5: `
                    Occasionally guided by peers & manager.
                `,
                6: `
                    Rarely guided by peers & manager.
                `,
                7: `
                    Operates indepedently with limited guidance. 
                    Figures out what needs to be done vs being told what to do.
                `
            },
            // Solution Quality
            SLQ: {
                4: `
                    Solutions need refactoring.
                `,
                5: `
                `,
                6: `
                `,
                7: `
                `
            },
            // Delivery Contributions
            DLC: {
                4: `
                    Produces Code
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },            
            // Process Contributions
            PLC: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },
            // Customer Interactions
            CNT: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },  
            // Internal Interactions
            INT: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },
            // Impacts
            IMP: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },   
            // Influences
            INF: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },
            // Advises
            ADV: {
                4: `
                    Peers
                `,
                5: `
                    Peers & Manager
                `,
                6: `
                    Peers, Manager(s) & Other Internal Engineers
                `,
                7: `
                    Peers, Manager(s), Other Internal Engineers, Executives, & External Engineers
                `
            },            
            // Mentors
            MEN: {
                4: `
                    Interns
                `,
                5: `
                    Peers
                `,
                6: `

                `,
                7: `
                    
                `
            },
            // Deep Understanding
            SME: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },            
            // Actively Learns
            LRN: {
                4: `
                    
                `,
                5: `
                    
                `,
                6: `

                `,
                7: `
                    
                `
            },
        }
    };
    return expectations[role][skill][level];
}

export const Skill = ({children, role, skill, l}) => (
    <span 
        className={styles.MDXTableEntry}
    >

{getSDEExpectation(role, skill, l)}

    </span>
);