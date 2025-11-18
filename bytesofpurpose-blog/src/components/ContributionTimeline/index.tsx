import React, { useEffect } from 'react';

/**
 * ContributionTimeline Component
 * 
 * This component provides click functionality for the Contribution Timeline in:
 * Blog Post: /blog/2025-09-27-my-contributions
 * 
 * Short IDs to keep in sync with blog content:
 * - P1: Profile-of-One Platform
 * - B1: Barclays Wealth Management CEO Demos & Workshops
 * - R1: Radian ML Pipeline Optimization  
 * - F1: Farmers Insurance ML Models
 * - T1: TrustStar Platform Architecture
 * - U1: United Healthcare Social Media Lead Generation
 * - C1: Cicada Search & Discovery
 * - C2: Cicada Digital Fulfillment Service
 * - F2: F2-SCX Experimentation Framework
 * - C3: Customer Journey Analysis Framework
 * - O1: Org Wide Success Metric Framework
 * - E1: Experiment Bar Raiser Standards
 * - T2: Team Ideation Innovation Leadership
 * - D1: Driver Feedback AI System
 * - G1: GenAI Tools Adoption
 * - R2: Raising Experimentation Bar
 * 
 * When adding new projects to the blog, update the shortIdMap in this component.
 */
const ContributionTimeline: React.FC = () => {
  useEffect(() => {
    console.log('TimelineClickHandler useEffect running');
    
    function initTimeline() {
      console.log('In Init Timeline');
      const timelineContainer = document.getElementById('timeline-container');
      if (!timelineContainer) {
        console.log('Timeline Container not found');
        setTimeout(initTimeline, 100);
        return;
      }
      
      const svg = timelineContainer.querySelector('svg');
      if (!svg) {
        console.log('SVG not found');
        setTimeout(initTimeline, 100);
        return;
      }
      
      console.log('Found SVG, setting up click handler');
      
      const shortIdMap = {
        'P1': 'profile-of-one-platform',
        'B1': 'barclays-ceo-demos',
        'R1': 'radian-ml-pipeline-optimization', 
        'F1': 'farmers-insurance-ml-models',
        'T1': 'truststar-platform-architecture',
        'U1': 'united-healthcare-social-media-lead-generation',
        'C1': 'cicada-search-discovery',
        'C2': 'cicada-digital-fulfillment-service',
        'F2': 'f2-scx-experimentation-framework',
        'C3': 'customer-journey-analysis-framework',
        'O1': 'org-wide-success-metric-framework',
        'E1': 'experiment-bar-raiser-standards',
        'T2': 'team-ideation-innovation-leadership',
        'D1': 'driver-feedback-ai-system',
        'G1': 'genai-tools-adoption',
        'R2': 'raising-experimentation-bar'
      };

      svg.addEventListener('click', function(e) {
        console.log('SVG clicked:', e.target);
        let target = e.target as HTMLElement;
        
        while (target && target.tagName !== 'text' && target !== svg) {
          target = target.parentElement as HTMLElement;
        }
        
        if (target && target.tagName === 'text') {
          const textContent = target.textContent || '';
          console.log('Text content:', textContent);
          
          Object.keys(shortIdMap).forEach(function(shortId) {
            if (textContent.includes('[' + shortId + ']')) {
              console.log('Found short ID:', shortId);
              const targetSection = document.getElementById(shortIdMap[shortId as keyof typeof shortIdMap]);
              if (targetSection) {
                console.log('Scrolling to:', shortIdMap[shortId as keyof typeof shortIdMap]);
                targetSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                console.log('Target section not found:', shortIdMap[shortId as keyof typeof shortIdMap]);
              }
            }
          });
        }
      });
    }
    
    // Try multiple approaches
    initTimeline();
    
    const timeoutId = setTimeout(() => {
      console.log('Timeout initialization');
      initTimeline();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return null;
};

export default ContributionTimeline;

