"use strict";(self.webpackChunkbytesofpurpose_blog=self.webpackChunkbytesofpurpose_blog||[]).push([[1455],{3283:(e,c,s)=>{s.r(c),s.d(c,{assets:()=>o,contentTitle:()=>r,default:()=>h,frontMatter:()=>a,metadata:()=>t,toc:()=>m});const t=JSON.parse('{"id":"mechanics/scripting-mechanics/jq-mechanics","title":"JQ Mechanics","description":"What JQ mechanics do I commonly leverage?","source":"@site/docs/2-mechanics/scripting-mechanics/jq-mechanics.md","sourceDirName":"2-mechanics/scripting-mechanics","slug":"/mechanics/scripting-mechanics/jq-mechanics","permalink":"/docs/mechanics/scripting-mechanics/jq-mechanics","draft":false,"unlisted":false,"editUrl":"https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/docs/2-mechanics/scripting-mechanics/jq-mechanics.md","tags":[],"version":"current","frontMatter":{"title":"JQ Mechanics","description":"What JQ mechanics do I commonly leverage?","slug":"jq-mechanics","authors":["oeid"],"tags":[],"image":"https://i.imgur.com/mErPwqL.png"},"sidebar":"tutorialSidebar","previous":{"title":"\ud83d\udc49\ud83c\udffb Start Here","permalink":"/docs/mechanics/scripting-mechanics/scripting-mechanics"},"next":{"title":"\ud83d\udc49\ud83c\udffb Start Here","permalink":"/docs/mechanics/docusaurus-mechanics/docusaurus-mechanics"}}');var n=s(4848),i=s(8453);const a={title:"JQ Mechanics",description:"What JQ mechanics do I commonly leverage?",slug:"jq-mechanics",authors:["oeid"],tags:[],image:"https://i.imgur.com/mErPwqL.png"},r=void 0,o={},m=[];function d(e){const c={code:"code",p:"p",...(0,i.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.p,{children:"Bookmark of Instructions:"}),"\n",(0,n.jsx)(c.p,{children:(0,n.jsx)(c.code,{children:"cortex_cli_command v3/agents/instances/5b7daaf1d042e3552a1b73f5/dataset/activations | jq -r '[ .activations | .[] | .start] | sort | reverse | .[]' | xargs -I {} bash -c 'date -r $(expr {} / 1000) 2>/dev/null || date -d @$(expr {} / 1000)  2>/dev/null' | head -n 12"})}),"\n",(0,n.jsx)(c.p,{children:(0,n.jsx)(c.code,{children:"cortex tasks list noop --json | jq '.tasks|.[]|.createdAt' | sort -r | xargs -n 1 bash -c 'date -d @$(expr ${0} / 1000) '"})})]})}function h(e={}){const{wrapper:c}={...(0,i.R)(),...e.components};return c?(0,n.jsx)(c,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},8453:(e,c,s)=>{s.d(c,{R:()=>a,x:()=>r});var t=s(6540);const n={},i=t.createContext(n);function a(e){const c=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(c):{...c,...e}}),[c,e])}function r(e){let c;return c=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:a(e.components),t.createElement(i.Provider,{value:c},e.children)}}}]);