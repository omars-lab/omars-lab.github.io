---
category: automation
content:
  md5: be3060e776777c1f1caba040daeefd77
glue: https://glue/blueprints/#id.automate.home
priorities:
  - I need to automate aspects of our home.
summary: Automating Our Home
tag: '#id.automate.home'
trello:
  card: https://trello.com/c/Q83GmrRa
  done: false
  id: 63c8c8d7063fb302832974d6
  list: 63c43d5498733701c29d3a12
---

# Home Automation Hub

- [ ] Make scripts for each of the buttons ...
	- [ ] Play audio file ...

- [ ] Make a Flic Plugin
	- [Smart Control - One Button All Functions for Mac - Flic](https://flic.io/mac-app)
	- [GitHub - 50ButtonsEach/hax-with-flic-osx: Basic Flic application for Mac.](https://github.com/50ButtonsEach/hax-with-flic-osx)
	- http://macplugins.flic.io/

----------------

- [x] Move this over to my initiatives ...  @done(2022-04-14 09:09 AM)
* [x] make a seperate home-automation-hub ... initiative ... @done(2022-04-14 09:09 AM)

* [ ] Get homeassistnat config into git …

- [ ] Continue Programming the KeyFob Buttons >today >2022-04-14
	* [ ] Make the turn on button thing … but for all lights in room … maybe even fan …
	- [ ] All key fob presses should trigger a script on the local Mac over ssh 
		- [ ] Need to have at least 10 hooks on Mac - one per key fob + flics ...

- [ ] Get an arm so I can always display home assistant dashboard on side?
	- https://store.hermanmiller.com/gaming-accessories/ollin-gaming-monitor-arm/2517608.html?lang=en_US

# Scenes
- [ ] Figure out how to have an effect of turning my office "on"
	- Turns on lamp, noc laptop dashboard / brightness, welcomes me, the tile lights, printer, etc ...
	- [ ] Can I programmatically turndown the brightness? Should have a turn on an off button that lights everything in office up ... including the tiles ...

# Flic
- [ ] Make a flic plugin ... http://macplugins.flic.io/

# Mechanics

- [ ] Figure out how to set log levels of different components / see log traces ...
	- Logs can be see by tailing log files in /config or checking 
	- https://www.home-assistant.io/integrations/logger/
- [ ] https://www.home-assistant.io/docs/configuration/


* [ ] Figure out how to sync time with home assistant better … or get date calculation to happen on Mac! .. have home assistant just trigger a Mac app …

- [x] Figure out how to copy stuff in the hass web shell @done(2022-04-14 09:05 AM)
	- Also copying in ssh hass - contral a + [ , pasting with ]
	- http://tmuxcheatsheet.com/

- [x] Figure out how to get hass ssh onto my MacBook and run a command ... @done(2022-04-14 09:06 AM)
	- [x] Debug the weird directory access problems in hass …  @done(2022-04-14 09:06 AM)
		- https://community.home-assistant.io/t/cant-access-www-directory-with-hass-io/34312
		- Feels like things are running in a container …
		- Docker doesn’t show anything though …
		- But it feels like the /config folder is the only folder that's mounted / accessible by the shell_command component ...
		- https://www.shellhacks.com/disable-ssh-host-key-checking/

# Networking
* [x] Need a good way to get my laptops ip for home assistant to execute remote calls …… may be worth making it a static ip … @done(2022-04-14 12:51 PM)
	* [x] Make the static ip of the laptop … using dhcp … not manually set on laptop … @done(2022-04-14 12:51 PM)
		* Setting manually on laptop forces people to use my ip …
		* Using dhcp gives me a free dns entry in my local network …


# HUB
* [x] Get more Mac sounds for automation hub ... @done(2022-05-01 06:01 AM)
	- `find /System/Library/Sounds -type f -exec afplay {} \;`
	- https://discussions.apple.com/thread/2211774
	- https://support.apple.com/en-us/HT211996
	- https://support.apple.com/en-us/HT202768
	- https://apple.stackexchange.com/questions/295935/how-do-i-find-the-apple-startup-chime-sounds-on-my-computer
	- https://apple.stackexchange.com/questions/295935/how-do-i-find-the-apple-startup-chime-sounds-on-my-computer
	- https://apps.apple.com/us/app/mactracker/id430255202
	- /Applications/Mactracker.app/Contents/Resources/Chimes//T2-based_Mac_Startup.m4a
	- afplay /Applications/Flic.app/Contents/Resources/trigger_click.mp3 &

* [ ] scp the hass key ... enable github?

-----------------------------

- [x] Tinker with OpenHAB on mac
	- [macOS | openHAB](https://www.openhab.org/docs/installation/macos.html)
	- [JFrog](https://openhab.jfrog.io/ui/native/libs-release-local/org/openhab/distro/openhab/3.2.0/openhab-3.2.0.zip)
- [x] Try to get z wave working on iMac ... @done(2022-04-16 01:51 PM)
	- [Z-Wave JS - Home Assistant](https://www.home-assistant.io/integrations/zwave_js/)
- [x] Look at other automation stuff on mac  @done(2022-04-16 01:51 PM)
	- [Domoticz](https://www.domoticz.com/)
	- [Quick start Z-Stick Gen5 with Domoticz : Aeotec Help Desk](https://aeotec.freshdesk.com/support/solutions/articles/6000199837-quick-start-z-stick-gen5-with-domoticz)


# --------

# a8n: Home Assistant
* [ ] Make home assistant devices all static ip ... 
* [ ] make a table of all stativ ip things ...
* [ ] change the config / edit it ...


# Automations
- [ ] https://www.reddit.com/r/homeassistant/s/qx5Ih4JIlL
* [ ] Wrap up home assistant on Mac mini
	* [ ] get button to work
	* [ ] resetup nanoleaf




# Home Automation
- [ ] Make an automation hub / dashboard hub with my old laptop / possibly an iPad? >2022-05-11
* [ ] Look into: raspberrypihq.com/amp/how-to-create-a-z-wave-smart-home-hub-using-a-raspberry-pi/  >2022-01-16 #2022-04-08
* [ ] Look into: www.home-assistant.io/docs/z-wave/controllers/  >2022-01-16 #2022-04-08
* [ ] Look into: help.aeotec.com/support/solutions/articles/6000246297-setup-home-assistant-with-z-stick-gen5-  >2022-01-16 #2022-04-09
* [ ] Look into: www.domoticz.com/wiki/Mac_OSX  >2022-01-16 #2022-04-10
* [ ] Look into: www.openhab.org/docs/installation/macos.html  >2022-01-16 #2022-04-10
* [ ] Look into: community.home-assistant.io/t/guide-macos-m1-and-home-assistant-including-zwave/398183  >2022-01-16 #2022-04-10
* [ ] Look into: help.aeotec.com/support/solutions/articles/6000242202  >2022-01-16 #2022-04-10

-----------

- [x] Setup Automation for Brilliant Button @done(2022-08-05 01:19 AM)
	- [guinness ad](https://www.youtube.com/watch?v=3DPKf7y1F-Q)
	- [Brilliant! (Guinness) - Instant Sound Effect Button | Myinstants](https://www.myinstants.com/en/instant/brilliant-guinness/)
	- [Air Horn (club sample) - Instant Sound Effect Button | Myinstants](https://www.myinstants.com/en/instant/air-horn-club-sample/)
