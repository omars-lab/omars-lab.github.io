"use strict";(self.webpackChunkbytesofpurpose_blog=self.webpackChunkbytesofpurpose_blog||[]).push([[752],{3905:function(e,t,r){r.d(t,{Zo:function(){return l},kt:function(){return f}});var n=r(67294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function c(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var s=n.createContext({}),u=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):c(c({},t),e)),r},l=function(e){var t=u(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,s=e.parentName,l=i(e,["components","mdxType","originalType","parentName"]),m=u(r),f=o,d=m["".concat(s,".").concat(f)]||m[f]||p[f]||a;return r?n.createElement(d,c(c({ref:t},l),{},{components:r})):n.createElement(d,c({ref:t},l))}));function f(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,c=new Array(a);c[0]=m;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:o,c[1]=i;for(var u=2;u<a;u++)c[u]=r[u];return n.createElement.apply(null,c)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},40428:function(e,t,r){r.r(t),r.d(t,{assets:function(){return l},contentTitle:function(){return s},default:function(){return f},frontMatter:function(){return i},metadata:function(){return u},toc:function(){return p}});var n=r(87462),o=r(63366),a=(r(67294),r(3905)),c=["components"],i={title:"JQ Mechanics",description:"What JQ mechanics do I commonly leverage?",slug:"mechanics-jq",authors:["oeid"],tags:[],image:"https://i.imgur.com/mErPwqL.png"},s=void 0,u={permalink:"/blog/mechanics-jq",editUrl:"https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/blog/blog/scripting-mechanics/2025-01-17-jq-mechanics.md",source:"@site/blog/scripting-mechanics/2025-01-17-jq-mechanics.md",title:"JQ Mechanics",description:"What JQ mechanics do I commonly leverage?",date:"2025-01-17T00:00:00.000Z",formattedDate:"January 17, 2025",tags:[],readingTime:.345,truncated:!1,authors:[{name:"Omar Eid",title:"Senior Software Engineer & Entrepreneur",url:"https://github.com/omars-lab",imageURL:"https://github.com/omars-lab.png",key:"oeid"}],frontMatter:{title:"JQ Mechanics",description:"What JQ mechanics do I commonly leverage?",slug:"mechanics-jq",authors:["oeid"],tags:[],image:"https://i.imgur.com/mErPwqL.png"}},l={authorsImageUrls:[void 0]},p=[],m={toc:p};function f(e){var t=e.components,r=(0,o.Z)(e,c);return(0,a.kt)("wrapper",(0,n.Z)({},m,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"Bookmark of Instructions:"),(0,a.kt)("p",null,(0,a.kt)("inlineCode",{parentName:"p"},"cortex_cli_command v3/agents/instances/5b7daaf1d042e3552a1b73f5/dataset/activations | jq -r '[ .activations | .[] | .start] | sort | reverse | .[]' | xargs -I {} bash -c 'date -r $(expr {} / 1000) 2>/dev/null || date -d @$(expr {} / 1000)  2>/dev/null' | head -n 12")),(0,a.kt)("p",null,(0,a.kt)("inlineCode",{parentName:"p"},"cortex tasks list noop --json | jq '.tasks|.[]|.createdAt' | sort -r | xargs -n 1 bash -c 'date -d @$(expr ${0} / 1000) '")))}f.isMDXComponent=!0}}]);