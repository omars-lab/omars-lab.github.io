---
slug: /software-development/frontend-development/projects/link-explorer
title: Link Explorer
description: 'Developing a tool to analyze and visualize links using Neo4j graph database and network analysis techniques.'
authors: [oeid]
tags: [links, neo4j, graph-database, network-analysis, visualization, development]
date: 2023-07-11T10:00
draft: true
---

# Priorities

  - I need to track the development of each of my habits!

  
# [#Analyzing] Links

- [ ] Autogenerating mindnode file ...
	- [ ] Complex ... need coordiantes ...
	- [ ] mindnode files are zips with files in the `Apple binary property list` format
		- [ ] ➜  testexports file /Users/omareid/Desktop/testexports/contents.xml
		- [ ] /Users/omareid/Desktop/testexports/contents.xml: Apple binary property list
		- [ ] [Medium: Understanding Apples Binary Property List Format 281e6da00dbd](https://medium.com/@karaiskc/understanding-apples-binary-property-list-format-281e6da00dbd)
	- [ ] With mind node ... we can't run interesting queries on the links ...

# Idea: Links in Neo4j

* Using raw networks?
	* [ericmjl.github.io: 02 Networkx Intro](https://ericmjl.github.io/Network-Analysis-Made-Simple/01-introduction/02-networkx-intro/)

* Analyzing with neo4j?
	* [neo4j.com: Desktop Csv Import](https://neo4j.com/developer/desktop-csv-import/)
	* [neo4j.com: Docs](https://neo4j.com/docs/)
	* [neo4j.com: Auradb Enterprise](https://neo4j.com/docs/cypher-cheat-sheet/5/auradb-enterprise/)
	* [neo4j.com: Match](https://neo4j.com/docs/cypher-manual/5/clauses/match/)


- [x] Setup nodes in neo4j ... @done(2023-07-11 10:35 PM)
	- [neo4j.com: Guide Create Neo4j Browser Guide](https://neo4j.com/developer/guide-create-neo4j-browser-guide/)

- [ ] Continue [[[#Analyzing] Links]]
	- [ ] Turn links into cypher ...
	- [ ] Have cypher queries to analyze links!
	- [ ] figure queries ..
		- [ ] which files are not linked to ...
		- [ ] circular refs?
		- [ ] can I mark a file as an initiative file and do special analysis on them?
		- [ ] Top 10 files with outgoing links
		- [ ] top 10 with incomming links ...
