---
category: plugin
content:
  md5: c2bbcf05eaf4feb1463eb563c6aa1d30
glue: https://glue/blueprints/#id.plugin.brew
jira:
  task: https://sacred-patterns.atlassian.net/browse/THREAD-69
priorities:
  - I need to develop my brew plugins
summary: Developing Brew Plugins
tag: '#id.plugin.brew'
trello:
  card: https://trello.com/c/b6RuaDnR
  done: false
  id: 63c8c8ee09a989005eb94b0e
  list: 63c43d5498733701c29d3a12
---

* [ ] Make a brew package with all my vim plugins!!
* [ ] Make another brew package with my brew setup!

- [ ] Enhancing Brew Setup
	- [ ] How do I use brew package in cloud desktop ..?
	- [ ] make a seperate brew formula for work scripts ...
	- [ ] Add mechanic to install work workspace ...
	- [ ] setup a brew formula for the vscode plugin!

# Testing
* [ ] Testing brew in a docker container?

* [ ] Move more setup stuff to brew formula ... 
	* [ ] symlinking profiles ...

# Scripts
* [ ] Publish my scripts as a brew package ... want to pip install my stuff ...
* [x] Make the python scripts brew aware ... @done(2022-04-04 12:08 AM)
	* [x] Look into: docs.brew.sh/Formula-Cookbook  >2022-01-16 #2022-04-01 @done(2022-04-04 12:08 AM)
	* [x] Look into: rubydoc.brew.sh/Utils/Shebang.html  >2022-01-16 #2022-04-02 @done(2022-04-04 12:08 AM)

# Using Git
- [ ] Do I need to enhance my brew package so things don't need to be git installed?
* [x] Add brew git url ... @done(2022-04-04 12:07 AM)
	* [x] Ignore python deps for now ... and that as a standalone dep ... @done(2022-04-04 12:07 AM)
	* [x] Should have a sh-scripts and python-scripts formula @done(2022-04-04 12:07 AM)
	* [x] All-script can depend on both ... @done(2022-04-04 12:07 AM)

# My CLI
* [ ] Install my cli with brew ...
	* [ ] Add a good reads tree command with summaries .... 
		* [ ] configure how many roots deep to go ...
		* [ ] and xcallbacl urls to it ...

# Cron
* [ ] Brew can do cron ...
	* [x] Start moving cron stuff for brew formula ... @done(2022-04-04 04:35 PM)
	* [ ] Test it ...
	* Limitation for cron running fever */#
* [ ] https://www.google.com/search?q=com.apple.launchd.calendarinterval&pws=0
* [ ] Update cron to use brew ... / have brew install in cron ...
