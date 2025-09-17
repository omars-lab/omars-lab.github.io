---
slug: build-a-kanban-board
title: Build a Kanban Board
description: 'Building and automating a Kanban board for organizing initiatives and managing project cards with Jira integration.'
authors: [oeid]
tags: [kanban, jira, trello, automation, project-management, productivity, development]
date: 2022-04-05T10:00
draft: true
---

# Priorities
*   - I need to automate my kanban board population / syncing
*   - I need to organize my initiatives and manage them as cards!


* Should I automate this? 
Kanban is about manually and visually reviewing progress and initiatives ...
Should I just make it in figma??


# Automate: Jira

* [ ] I also need to link each initiative to roles
Another input for jira-create: jira-create habit vs jira create task ... vs jira create epic ...

- [ ] Auto assign things to me in jira ...

- [ ] Should I tinker with Jira automation?

- [ ] Migrate to v3 jira api  ...?
    - Smartlinks work in both versions, emojis have better support in v3 ...    

- [ ] Make the frontmatter script a re-usable script ...

* [ ] Start tracking dependencies in front matter yaml headers but use local file references instead of the jira urls
* [ ] Figure out how to include other files in the jira initiatives, Make sure all those files get pieced together for uploading to Jira, Also make sure any high-level task counts are updated accordingly
* [ ] Make a high-level checklist of the jira sink features something like, smart links: checkmark


## Dependencies
- [ ] What happens if I break deps ...?

## Front Matter
* [ ] To the frontmatter... need to add status and map that to my custom jira workflow ... frist iteration ... pause ... nth iteration
- [ ] I SHOULD DECLARE DEPS IN FRONTMATTER METADATA ... and push deps as needed!
- [ ] Enable two way sync for summary ...
- [ ] Love the idea of pushing content from local files to jira ... and only keeping high level things / buckets in Jira to organize / determine priority ...!
    - [ ] Need to sync status in jira into front matter!

- [x] Automate the Jira pull ... of metadata ... and updating frontmatter ... @done(2022-04-05T21:50:32-05:00)
- [x] Need to add links to epic in the meta frontmatter  @done(2022-04-05T21:46:25-05:00)
- [x] Need to sync front matter from Jira ... add xcallback if its missing ... etc ... @done(2022-04-05T21:46:37-05:00)
	- [x] Need to be able to strip off existing front matter  @done(2022-04-05T21:46:46-05:00)
	- [x] Need to be able to regenerate front matter from jira json response ... @done(2022-04-05T21:46:47-05:00)

# Front Matter
* [ ] Look into: github.com/redhat-developer/vscode-yaml/issues/207  >today #2022-04-07
* [ ] Look into: dev.to/ceceliacreates/use-vs-code-snippets-to-generate-markdown-front-matter-fpc  >today #2022-04-07


# Ticket Creation
- [ ] Add to jira tools ability to pick an epic when creating a ticket ...
* [ ] Would be nice to also be able to programmatically create "an example ticket", "a blog ticket" ... a "tinkering ticket" (i.e have things auto added to the right epic ...)
    - [ ] Add a flag to the jira-create script to pick an epic ..

# Pushing Details to Jira
- [ ] Need to also add these as points on the ticket when pushing ...

# Jira Details 
- [ ] Add more info in the info panel ...
    - [ ] Add xcallback urls so I can edit it locally by clicking a link in jira
    - [ ] Add disclaimer not to edit ...
- [x] Map task state to emojis ... @done(2022-04-05T21:36:27-05:00)
    - https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=miscellaneous&_ga=2.254738445.480292093.1649212489-754877465.1649212489
* [x] Checkin Jira scripts ... @done(2021-10-03 11:59 AM)

## Jira Info Panel
- [ ] Need to add counter of open tasks within issue to pannel ... 
- [x] Add panel back to jira tickets from frontmatter @done(2022-04-06T08:41:23-05:00)
    - [x] Turn links into jira links @done(2022-04-06T08:41:24-05:00)
        - [x] Do smart links for tasks and epics ...... @done(2022-04-06T08:41:19-05:00)
            - https://community.atlassian.com/t5/Jira-Software-questions/Create-smart-links-via-Jira-API/qaq-p/1655133 
    - [x] Rewrite xcallback urls sh that they are redirected ... @done(2022-04-06T08:41:25-05:00)

# Automate Pushing Ticket Content
- [x] Sync content ... form laptop to jira ... @done(2022-04-05T21:49:24-05:00)
- [x] Make this scan all the initiatives / files that are linked and push! @done(2022-04-05T21:49:20-05:00)

# Automate Syncing Ticket Prioritization
- [x] Should have a jira pull too .. @done(2022-04-05T21:49:37-05:00)
    - [x] Sync state in jira back to laptop ... @done(2022-04-05T21:49:37-05:00)

# Automate Backups
- [ ] https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-issue-get
- [ ] https://community.atlassian.com/t5/Jira-Software-questions/Performing-a-data-only-backup-via-REST-API/qaq-p/1196475

# Other
- [ ] Cache ... syncs ...? make a hash ... and don't push content ...

# Considering Alternatives
* [ ] Look into: apps.apple.com/us/app/taskheat-visual-to-do-list/id1431995750  #2022-03-01

# ----------------------------------

# Trello

- [ ] Figure out trello key order
- [ ] Only keep priority sections in trello - link to file to open ...
- [ ] Add a front matter / initiative validator ...
- [ ] Trello append link to frontmatter ...

https://trello.com/1/search?query=id.dashboard&partial=true&modelTypes=cards%2Cboards%2Cmembers%2Corganizations&card_fields=id%2CidBoard%2Cname%2Cclosed%2CdateLastActivity%2CshortLink%2Curl%2Cdesc&cards_limit=11&cards_page=0&card_board=true&board_fields=id%2Cname%2Cid%2CidOrganization%2CdateLastView%2CdateLastActivity%2Cname%2CshortLink%2Cclosed%2Cprefs&card_list=true&board_organization=true&board_organization_fields=displayName%2Cid&member_fields=id%2CfullName%2Cusername%2CavatarUrl%2CavatarSource%2Cinitials%2Cproducts%2CnonPublic&organization_fields=id%2CdisplayName%2Cname%2ClogoHash


- [ ] Figure out how to do the jira thing with trello ...
- [x] Does trello have an API? @done(2023-01-15 01:09 PM)
- [x] Make a trello api token:  @done(2023-01-15 11:55 AM)
	- https://id.atlassian.com/manage-profile/security/api-tokens
- [x] Make a board @done(2023-01-15 11:59 AM)
	- https://trello.com/b/FD06G5em/kanban-board
	- https://trello.com/1/boards/63c43d5498733701c29d3a0b
- [x] Using API token @done(2023-01-20 08:14 AM)
	- [-] https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
	- https://trello.com/power-ups/admin/
- [x] Figure out how to use api key with trello call @done(2023-01-15 07:53 PM)
	- [-] curl -v https://mysite.atlassian.net --user omar_eid21@yahoo.com:S9gSrDozo13qK9RxzeyhB92E \
		- This method does not work with trello .. only Atlassian ...
- [x] Get the board @done(2023-01-15 07:53 PM)
	- https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-get
	* curl --request GET --url 'https://api.trello.com/1/boards/63c43d5498733701c29d3a0b?key=50042d80b513d91fede9b4a0cc0e3618&token=ATTA11c391fddb4ce6fb62c7d7478849cb18afedfdf78069aec975efc5e97a4b8b1722B4627E' --header 'Accept: application/json' | jq 
- [x] Get lists of board ... @done(2023-01-20 08:15 AM)
	- curl --request GET --url 'https://api.trello.com/1/boards/63c43d5498733701c29d3a0b/lists?key=50042d80b513d91fede9b4a0cc0e3618&token=ATTA11c391fddb4ce6fb62c7d7478849cb18afedfdf78069aec975efc5e97a4b8b1722B4627E'  --header 'Accept: application/json' | jq 

* [ ] add quotes around problematic tags that are commented out in yaml

# ---------
- [ ] Kanban - add a paused column
- [ ] Sync priority state from trello in front matter
- [ ] Add link to trello in frontmatter
- [ ] Add link for vscode in desc too ...