"use strict";(self.webpackChunkbytesofpurpose_blog=self.webpackChunkbytesofpurpose_blog||[]).push([[4583],{8370:(e,t,s)=>{s.r(t),s.d(t,{default:()=>f});s(6540);function n(e){var t,s,r="";if("string"==typeof e||"number"==typeof e)r+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(s=n(e[t]))&&(r&&(r+=" "),r+=s);else for(t in e)e[t]&&(r&&(r+=" "),r+=t);return r}const r=function(){for(var e,t,s=0,r="";s<arguments.length;)(e=arguments[s++])&&(t=n(e))&&(r&&(r+=" "),r+=t);return r};var i=s(4582),o=s(797);const a={heroBanner:"heroBanner_qdFl",buttons:"buttons_AeoN"};var c=s(6289);const l={features:"features_xdhU",featureSvg:"featureSvg__8YW"};var d=s(4848);const h=[{title:"Browse Engineering Docs",image:"/img/artifacts.svg",description:(0,d.jsx)(d.Fragment,{children:"Browse all sorts of engineering artifacts, from sequence diagrams, roadmaps, code snippets, app templates, shortcuts, scripts, etc."}),to:"/docs/intro",buttonText:"Docs"},{title:"Browse Blog Posts",image:"/img/posts.svg",description:(0,d.jsx)(d.Fragment,{children:"Browse through some entertaining blog posts, discover what you can do with technology, gain a few ideas, and provide feedback!"}),to:"/blog",buttonText:"Blog"},{title:"Peak Underneath the Hood",image:"/img/engine.svg",description:(0,d.jsx)(d.Fragment,{children:"This site was made leveraging a variety of tools. To learn more about all the gears that are chruning behind the sceens, see here."}),to:"/docs/designs/blog-design",buttonText:"Blueprint"}];function g(e){let{title:t,image:s,description:n,to:i,buttonText:o}=e;return(0,d.jsxs)("div",{className:r("col col--4"),children:[(0,d.jsx)("div",{className:"text--center",children:(0,d.jsx)("img",{className:l.featureSvg,alt:t,src:s})}),(0,d.jsxs)("div",{className:"text--center padding-horiz--md",children:[(0,d.jsx)("h3",{children:t}),(0,d.jsx)("p",{children:n}),(0,d.jsx)(c.A,{className:"button button--secondary button--lg",to:i,children:o})]})]})}function u(){return(0,d.jsx)("section",{className:l.features,children:(0,d.jsx)("div",{className:"container",children:(0,d.jsx)("div",{className:"row",children:h.map(((e,t)=>(0,d.jsx)(g,{...e},t)))})})})}function m(){const{siteConfig:e}=(0,o.A)();return(0,d.jsx)("header",{className:r("hero hero--primary",a.heroBanner),children:(0,d.jsxs)("div",{className:"container",children:[(0,d.jsx)("h1",{className:"hero__title",children:e.title}),(0,d.jsx)("p",{className:"hero__subtitle",children:e.tagline}),(0,d.jsx)("div",{className:a.buttons})]})})}function f(){const{siteConfig:e}=(0,o.A)();return(0,d.jsxs)(i.A,{title:`Hello from ${e.title}`,description:"Description will go into a meta tag in <head />",children:[(0,d.jsx)(m,{}),(0,d.jsx)("main",{children:(0,d.jsx)(u,{})})]})}}}]);