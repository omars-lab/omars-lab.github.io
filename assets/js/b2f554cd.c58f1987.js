"use strict";(self.webpackChunkbytesofpurpose_blog=self.webpackChunkbytesofpurpose_blog||[]).push([[477],{30010:function(e){e.exports=JSON.parse('{"blogPosts":[{"id":"mechanics-jq","metadata":{"permalink":"/blog/mechanics-jq","editUrl":"https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/blog/blog/scripting-mechanics/2025-01-17-jq-mechanics.md","source":"@site/blog/scripting-mechanics/2025-01-17-jq-mechanics.md","title":"JQ Mechanics","description":"What JQ mechanics do I commonly leverage?","date":"2025-01-17T00:00:00.000Z","formattedDate":"January 17, 2025","tags":[],"readingTime":0.345,"truncated":false,"authors":[{"name":"Omar Eid","title":"Senior Software Engineer & Entrepreneur","url":"https://github.com/omars-lab","imageURL":"https://github.com/omars-lab.png","key":"oeid"}],"frontMatter":{"title":"JQ Mechanics","description":"What JQ mechanics do I commonly leverage?","slug":"mechanics-jq","authors":["oeid"],"tags":[],"image":"https://i.imgur.com/mErPwqL.png"}},"content":"Bookmark of Instructions:\\n\\n`cortex_cli_command v3/agents/instances/5b7daaf1d042e3552a1b73f5/dataset/activations | jq -r \'[ .activations | .[] | .start] | sort | reverse | .[]\' | xargs -I {} bash -c \'date -r $(expr {} / 1000) 2>/dev/null || date -d @$(expr {} / 1000)  2>/dev/null\' | head -n 12`\\n\\n`cortex tasks list noop --json | jq \'.tasks|.[]|.createdAt\' | sort -r | xargs -n 1 bash -c \'date -d @$(expr ${0} / 1000) \'`"}]}')}}]);