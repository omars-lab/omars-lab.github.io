---
slug: automate-tasbeeh-tracking
title: Automate Tasbeeh Tracking
description: 'Project to develop a smart clicker system for tracking tasbeeh using home automation and IoT devices.'
authors: [oeid]
tags: [home-automation, iot, tasbeeh, tracking, smart-clicker, home-assistant]
date: 2022-04-12T10:00
draft: true
---


Tasbeeh Tracker ...
# Priorities
  - I need a smart clicker

* [ ] Idea - for smart clicking - ml app that listens to when a pen is clicked - every day tools can become "smart"
	* [ ] https://towardsdatascience.com/detecting-sounds-with-deep-learning-ed9a41909da0

- [ ] Deciding on Smart Clicker to Track Tasbeeh >today
	- [ ] Arduino IOT Cloud Kit 
	- [ ] Normal Recharable Clicker (not smart)
	- [ ] Presentation Clicker
	- [ ] Apple Remote?
		- Can I setup a custom app?
		- https://eternalstorms.at/sirimote/
		- https://github.com/eternalstorms?tab=repositories
    - [ ] should i get the elago stream deck? need to tasbeeh more as i work ...
    - [ ] should i use this as an excuse to buy the lego automation stuff?
    - [ ] Should I get a raspberry pi ....
        - [ ] Should I get the keyboard one ?
    - [ ] Should I use Sara's Broken Apple Watch as a button ...
    - [ ] Should I use flics ...

# Flic Integration
* [x] Get flic keys setup again @done(2022-04-12 10:11 PM)
* [ ] Setup some custom flic plugins ... 

# Automation
- [x] install virtual box on imac / personal laptop @done(2022-04-12T22:42:21-05:00)

# Home Assistant Setup
- [x] Virtual box won't work on m1 Mac ... try setting up the hypervisor on the old mac
* [x] Get keyfob connected on old laptop woth virtualbox @done(2022-04-12 10:11 PM)
* [x] Setup basic keyfob automation rules to make sure it works @done(2022-04-12 10:11 PM)
* [x] Install ssh access for home assistant
* [-] Install vscode plugin to edit configuration.yaml ... (can use ssh plugin too ...)

* [ ] Make sure I can access home assistant from other laptops

# Setup Counter
- [ ] Install custom components / integrations for home assistant ...
    - https://community.home-assistant.io/t/missing-integrations/134800
    * [ ] Install rest calls for home assistant 
    - [ ] Install shell integration 
        - https://www.home-assistant.io/blog/2017/11/02/secure-shell-tunnel/
* [ ] Install custom components to run sh scripts / rest commands in home assistant …
	* [ ] https://codingcyclist.medium.com/how-to-install-any-custom-component-from-github-in-less-than-5-minutes-ad84e6dc56ff
	* [ ] https://www.home-assistant.io/integrations/shell_command/

- [ ] Figure out what I want homeassistant to do to keep track of counters/
    - Do I want data in home assistant? outside?
    - [ ] Edit the configuration accordingly ... with the shell commands needed to modify the counters ...
        - https://www.home-assistant.io/examples/#example-configurationyaml
        - https://www.home-assistant.io/docs/configuration/

# Keyfob Configuration
- [x] Figure out how to configure the keyfob ...
    * https://manuals.fibaro.com/content/manuals/en/FGKF-601/FGKF-601-EN-T-v1.1.pdf
	* Keyfob can react to config value changes / sync on device …
	* There are 12 main scenes that can be triggered … with different clicks - 6 single button clicks and 6 programmable sequences. ..

# Dashboard Setup
- [ ] Figure out if I want to use any of home assistants dashboarding functionality ....
    - [ ] Should I keep my old laptop always on ... hanging with a nice arm stand on the side ...