---
tag: '#id.app.calendar'
summary: Developing My Calendar
category: app
priorities:
  - I need to make sure I am using my different apps ... glue
---

# Calendar
- [ ] Make calendar (web) app to organize my initiatives ... 
	- [ ] NotePlan too limiting!
- [ ] https://github.com/serhii-londar/open-source-mac-os-apps
	- [ ] https://github.com/ekreutz/CornerCal


# [#Developing] Calendar App



---
category: tool
content:
  md5: 4667914e5f8e36ee5cbe0635c7ffef3d
glue: https://glue/blueprints/#id.tool.terminal-cal
jira:
  epic: https://sacred-patterns.atlassian.net/browse/THREAD-36
  task: https://sacred-patterns.atlassian.net/browse/THREAD-54
priorities:
  - I need a smart calendar over terminal
summary: Terminal Calendar
tag: '#id.tool.terminal-cal'
trello:
  card: https://trello.com/c/hgu7he3t
  done: false
  id: 63c8c880bddd340098cf2f6b
  list: 63c43d5498733701c29d3a12
---

- Blog: Make a command line tool to add links to calendar view/command line clickable calendar!
	- With clickable/color coded days…


- [ ] Make a dashboard of the different days ... can I use the cal method to do this???
	- `cal -h | sed -E -e 's/([0-9]+)/\t\1./g' -e 's/ ?([A-Za-z]+)/\t\1/g' | GREP_COLOR='1;34'  grep --color '\b3.'`
	- can I use vim for special date links to open particular date files ...
	- can I make a shortcut to open today??
