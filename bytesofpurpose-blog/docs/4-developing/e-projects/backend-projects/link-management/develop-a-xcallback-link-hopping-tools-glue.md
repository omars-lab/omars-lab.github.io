---
category: tool
content:
  md5: e50caf1ca0a8c4a9b5364fcc4fa1286a
glue: https://glue/blueprints/#id.glue
priorities:
  - I need a easy way to take make links that take me straight to apps in a loose
    way
summary: Glueing Links
tag: '#id.glue'
trello:
  card: https://trello.com/c/edm4fTFc
  done: false
  id: 63c8c8c94948ef01b780870f
  list: 63c43d5498733701c29d3a12
---

# Glue

# URL DNS

I need a tool to help me manage all my call backs / different urls across apps / notes ...

# Glue
- [x] Get glue apple script to work again @done(2021-01-26 15:30 PM) #usedShortcut 

* [ ] Continue working on glue app ...
	* [ ] make custom resolving functions!

- [ ] Can I have glue links with emojis?
    - [ ] Add a dictionary of personal Abbreviations for glue links!

- [ ] Glue CLI to help copy links as md ...

- [ ] Consolidate link creation ...
- [ ] Need shortcuts to edit glue files ...
- [ ] add a cli for glue to open initiatives ... habits ... validate them for broken links ... add to them ... autogenerate them ... etc ...

# Debugging 
- [x] Add url resolution log ... @done(2023-01-09 09:09 AM)
- [x] Add python logging  @done(2023-01-09 09:09 AM)
- [ ] Add log rotation?
- [ ] Add glue debug window ...
	- [ ] [Launch iTerm2 and Run Command — iTerm2 Python API 0.26 documentation](https://iterm2.com/python-api/examples/launch_and_run.html?highlight=run)

# Tags
- [x] I should make special annotations I add to files ... to determine app to open with + file Id ... @done(2023-01-09T09:12:59-06:00)

# HTTPS Integration
- [ ] I should make an easy way to open my blueprints / link them to google sheets priorities ...

# Documentation
- I Need to document glue usage guide ...# 
    - usage
        - glue:///<var>
            - looks up mappings in glue.json
        - glue://initiatives/<var>
            - looks up mappings in glue.initiatives.json
        - glue://habits/<var>
            - looks up mappings in glue.habits.json
            - Makefile autogenerates habbit mappings
        - glue://blueprints/#...
            - greps in blueprint folder for a file tagged with a particular id ...
            - emits warnings if duplicate ids ...
            - open up finder if file not found ...

# Commercialization
- I should turn this into a paid app w/ guide ...