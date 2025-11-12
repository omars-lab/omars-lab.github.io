---
slug: develop-a-task-management-cli
title: Develop a Task Management CLI
description: 'Building a personal CLI tool for task management, validation, and productivity analysis with role-based organization.'
authors: [oeid]
tags: [cli, task-management, validation, productivity, roles, automation, development]
date: 2022-04-12T10:00
draft: true
---

# Priorities
  - I need my own CLI

  
I need a personal cli to round up all the common operations I need to better document/manage me ...
- [ ] The reason I keep on comming back to my cli is it helps ...
	- establish my own personal structure ...
	- maintain the structure / quality of my tasks!
	- ensure I create high quality tasks ...
	- validate my own strucutre / links / etc ...


- [ ] when I list roles ... I should include callback for overview ...
- [ ] do I need to link personal book as a dependency ... of brew formula for cli ...
- [ ] when I check links ... I should check if symlinks are broken to ... if symlink not broken ... then check the content ...

# My CLI
- [ ] Setup my cli to 
- [ ] in anticipation of validation ... 
	- [ ] add a my roles command to list all my valid roles
		- [ ] can be used for auto complete later
		- [ ] make sure it supports a flag for json output ...
	- [ ] add a my checks --standards
		- [ ] to check my standards ...
	- [ ] add a my checks --link
		- [ ] to check my links ...
		- [ ] use the tree printer ... 

# valdating
* [ ] Is there a way to make a custom frontmatter schema validator to make sure I pick the right rolls, Or maybe a VSCOde plugin
* [ ] I need to parse through all the relative links / vscode links / html links / ia writer links and figure out what's broken and what's not ...


* [ ] Extend my cli to enumerate ... >today >2022-04-04 >2022-03-31 >2022-03-12 >2022-03-11
	- [ ] recurring actions
		- [ ] my daily actions
		- [ ] my weekly actions 
	- [ ] Needs / things to get prioritized ...
	- [ ] Priorites in jira ...

* [ ] Use the pptree ... when doing analysis on each dir.

* [ ] What are my own standards ...
	* [ ] Need to automate checking for my own standards in the hats repo ...
	* [ ] Need to analyze personal book files that are tiny / should be removed ...
	* [ ] Need to analyze personal book folders and ensure they have an overview file ...
	* [ ] `my standards are met` - command to check if my standards are met!

* [ ] Continue working on My CLI

# Tree View
- [ ] When validating, aggregate stuff at a tree view ..
* [ ] Look into: github.com/clemtoy/pptree  >2022-01-16 >2022-04-04 #2022-04-03

# Creating Initiatives
* [x] Create script to create an initiative in the blueprint dir .. >2021-10-25  @done(2021-10-25 10:54 PM)

# Managing Calendar 
* [ ] I need to extend my "cli" dashboard to see my calendar, todos ... weekly stuff ... and whether or not I've done them ... 

# Analyzing Productivity 
* [ ] for the cli .. it should consider my productivity

# Testing 
* [x] Get dev setup going for my cli ... @done(2022-04-12 10:28 PM)

# Front Matter Validation
* [ ] Add ability to validate front matter ...
	* [ ] Point to a dir ...
		* [ ] Recursively iterate through dir ... and mark which files are valiid and which ones aren't ...
- [ ] Need to figure out which initiatives are missing a front matter files ...

---

- [x] I need to figure out how to auto detect the right directory for personal books ...  @done(2022-04-12T22:39:38-05:00)
	* [-] Should I have a script that aitomatically does this / execute it ?
	- [x] For now, just have a resolution order ... @done(2022-04-12T22:39:37-05:00)

# Brew as Python 


brew forces us to recursive enlist all dependencies ... while we can automate this ... its another layer to worry about ... could possibly autogenerate a formual ...
or have a conda based formaul ... leaning in that direction

Check here to see where hats gets installed ... /usr/local/lib/python3.10/site-packages/


- [ ] Learn more about python installs
	- https://amir.rachum.com/blog/2017/07/28/python-entry-points/
	- https://stackoverflow.com/questions/35701131/why-does-setup-py-usually-not-have-a-shebang-line
	- https://docs.brew.sh/Python-for-Formula-Authors
	- https://docs.w3cub.com/homebrew/formula-cookbook
	- https://stackoverflow.com/questions/25333640/pip-python-differences-between-install-option-prefix-and-root-and
	- https://github.com/mourner/homebrew/blob/master/share/doc/homebrew/Python-for-Formula-Authors.md

- [ ] Figure out who to do multiple python packages with brew ...
	- [ ] have 1 with all python packages
	- [ ] or each package has its own virtual env

- [ ] does brew support local python install
* [ ] i should try using the pyddiller in the requirements folder instead of pypi

* [x] Separate brew envs / make sure each has its own virtual env
	- [ ] should each repo have its own virtual env? yes!

* [x] Can formula depends on casks? - no
	* [ ] https://docs.brew.sh/Acceptable-Formulae

- [ ] even if i make a seperate brew conda env - still finicky ... not true python dev - brew getting in way
	- Do normal conda stuff ...
	- Do practice of cresting stuff in brew folder ...

* [x] Don't use the brew virtual env's pip install
	- [x] try using the brew virtual env pip binary with stages instead ... (didn't work either)
	- [x] Call the pip executable in the virtual env brew creates manually ... 
		* [-] Is there a way to iterate through all brew resources and pip install them? 
			- easier to just pip install a requirements file ... don't need to expand each requirement recursivley as a brew formual resource

* [x] Add the git url to brew for pydriller

- [ ] Should I use more conda specific mechanics in my python brew formulas?
	* [ ] Should I try doing it in pure mini conda / do the install myself woth conda 
		- don't use brew virtual env ... use conda instead ...
	- [ ] brews virtual env is super finicky ... 
	* [ ] is there a way to get conda envs to inherit from each other?
	* [ ] https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html
		* [ ] be aware of this: https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#using-pip-in-an-environment
	* [ ] can I use this mechanic to replicate the workspace conda env?

------

# Workstreams / COWs as Cars ... or COWs that are stopped ..
- [ ] Can I 	add something with red light / green light / cars ... to cli?!
	- [ ] Can I use emojis in d3?
	- [ ] Excel?

* [ ] Make a fastapi script to help me derive the github link for a specific version of specific lines ...


-----------

# Classifying My Todos

- I need some sort of tool that will organize todos under the right action theme ...

- Can I auto categorize notes/tasks into the right activities under the different roles!? (This would be supper valuable!!!)
	- Maybe there is an easy way to do with tags, autocomplete, and suggested tags!