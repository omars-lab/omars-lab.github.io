---
slug: develop-a-vscode-plugin-for-todos
title: Develop a VSCode Plugin for Todos
description: 'Building a VSCode extension called Flavorful Tasks for managing todos with keyboard shortcuts and automation features.'
authors: [oeid]
tags: [vscode, plugin, extension, todos, tasks, automation, productivity, development]
date: 2021-09-07T10:00
draft: true
---

# Priorities
  - I need to develop my vscode plugins
  
# Flavorful Tasks

- [ ] Make it such that tasks in comments `# - [ ]` are properly delt with too!
	- [ ] Make sure to consider ### - [ ] when marking done ...

* [ ] I need to continue to advance my vscode plugin
	* [ ] I need the future schedule ... to actually move tasks to the next day ...
	* [ ] Automate the build around this ...
	* [ ] Publish plugin to viscose marketplace ...
		* [ ] Figure out why my extension wasnt published ...
	* [ ] Add functionality / docs to plugin ..
		* [ ] Add docs as to state change of each toggle -
		* [ ] command d
			* [ ] empty line - to todo - to done task - back to todo ...
		* [ ] command > - schedule 1 day forward with every click 
		* [ ] command < - 1 day backward
		* [ ] command c to cancel a task ...
		* [ ] Make command d recursively mark any subtasks as done ...
		* [ ] command s to generate a statistics line at the top of the file!
		* [ ] Make script to help move around undone todos to the right files 


- [ ] Look into: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher >2021-09-05
	- [ ] Publish personal extension updates and install through app store - can automate updates through code cli
	- [ ] Can build CI/CD around things ...

- [x] Commit and download latest vsix ... auto update plugin! @done(2021-09-07T15:52:47-05:00)

- [ ] Setup the github action to build vscode plugin … no need to publish …

- [ ] Setup vscode shortcut ... to mark stuff as done ...

- [ ] Can I make my own custome compiler to add `@done` tags ever time i recompile? 
    - https://code.visualstudio.com/docs/languages/markdown

- [ ] Add ability on files ... to copy xcallback link ...

# Priority
* [ ] Continue working on Flavorful tasks ... (vscode plugin)

# VSCode
- [ ] Enhance the vscode plugin!
	- [ ] Make it so that the vscode plugin considers comments!
	- [ ] Make l do stuff ... I was expecting l to work ...

# Resources
- https://code.visualstudio.com/api/references/vscode-api#TextEditor
- https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix
- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix
- https://github.com/microsoft/vscode-extension-samples/tree/main/document-editing-sample