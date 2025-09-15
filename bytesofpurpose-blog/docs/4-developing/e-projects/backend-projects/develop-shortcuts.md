---
slug: develop-shortcuts
title: Develop Shortcuts
description: 'Developing iPhone and macOS shortcuts for automation, note-taking, and productivity workflows.'
authors: [oeid]
tags: [shortcuts, iphone, macos, automation, noteplan, productivity, development]
date: 2021-08-29T10:00
draft: true
---

# Priorities
  - I need to develop my iphone shortcuts
  
# ---------------------------

# Iphone Shortcuts 
- [ ] I need to setup the proper shortcuts on my phone
	- [x] Setup shortcuts automation to append to a todo file! @done(2021-08-29 10:56 PM)
		* [x] Use xcallback to append to noteplan! @done(2021-08-29 10:22 AM)
		- noteplan://x-callback-url/addText?noteTitle=iPhone&openNote=no&text=*%20Hello%20World&mode=append
	- [ ] There are iOS shortcuts ssh ... use it
	- [x] Look into: https://noteplan.co/faq/General/X-Callback-Url%20Scheme/ >2021-08-29 @done(2021-08-29 12:07 AM)


- [x] Setup shortcut on iphone to capture todos ... @done(2022-04-04T17:02:59-05:00)
* [x] Look into: Get the shortcuts thing to work with get url ... >2022-01-30 @done(2022-01-31 12:57 AM)
	* [x] Look into:  https://www.reddit.com/r/shortcuts/comments/q6fcco/open_xcallback_url_doesnt_end_why/?utm_source=share&utm_medium=ios_app&utm_name=iossmf >2022-01-30 @done(2022-01-31 12:57 AM)

## Automation 
* [ ] https://www.reddit.com/r/shortcuts/comments/b7m6ti/append_to_notes_error_error_error/

# ---------------------------

# Shortcuts
* [ ] Investigate if a script can execute when a specific app is opened ...
* [x] Create a macOS shortcut to open a note by clicking a url... @done(2022-01-15 10:26 PM)
	* [ ] [shared apple note](shortcuts://x-callback-url/run-shortcut?name=Open%20Note&input=text&text=Furniture%20Options)
	* [ ] https://app-talk.com/#notes
	* [ ] https://hookproductivity.com/help/integration/using-hook-with-apple-notes/
	* [ ] https://twitter.com/artemchistyakov
	* [ ] https://github.com/temochka/Anykey
* [x] figure out automation to open notes groceries ... from noteplan @done(2022-07-23 11:20 AM)
	* [open grocery list](shortcuts://x-callback-url/run-shortcut?name=Groceries)





---
category: shortcut
content:
  md5: cc4d5b17aec276963ee0f0fac8df93ec
glue: https://glue/blueprints/#id.shortcut.keyboard
jira:
  task: https://sacred-patterns.atlassian.net/browse/THREAD-71
priorities:
  - I need to develop my Keyboard Shortcuts
summary: Developing Keyboard Shortcuts
tag: '#id.shortcut.keyboard'
trello:
  card: https://trello.com/c/Z83py45n
  done: false
  id: 63c8c8cca1dd6200b2539353
  list: 63c43d5498733701c29d3a12
---

# Keyboard Shortcuts
* [ ] Change the menu key ...
	* [ ] https://apple.stackexchange.com/questions/173898/repurposing-menu-button-on-windows-keyboards-used-in-os-x




---
slug: mechanics-terminal-shortcuts
title: 'Terminal Mechanics: Shortcuts'
authors: [oeid]
tags: []
draft: true
date: 2022-05-17T10:00
---


# Iterm Shortcuts
- [x] Setup iterm shortcut to invoke a snippet ... #done 
	- Setup a snippet, and a keyboard mapping to invoke snippet ... 
	- snippet autopopulates command ...

# aa-ZZ shortcuts
- [ ] Make an a – Z Shortcuts file with all of the qwerty shortcuts and also make a AA to zz shortcut file for git status
	- [ ] Need to map out what kinds of documents I can open with the different shortcuts / remind myself ...

* [ ] make single character fzf shortcuts ...
	* [ ] v for vscode
	* [ ] I for iswriter
	* [ ] c for chrome
	* [ ] n for noteplan
	* [ ] e for executables

-  [ ] Need to capture these in a diagram!