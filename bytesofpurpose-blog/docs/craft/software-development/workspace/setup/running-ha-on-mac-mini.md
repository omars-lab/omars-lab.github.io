---
slug: /software-development/workspace/setup/running-ha-on-mac-mini
title: 'Running Home Assistant on Mac Mini'
sidebar_label: 'Home Assistant on Mac Mini'
description: 'Experiment with installing and configuring Home Assistant container on Mac mini including Docker management, audio support, and automation setup'
authors: [oeid]
tags: [home-assistant, mac-mini, docker, portainer, automation, zwave, hue-lights, flask-api, workspace]
date: 2022-01-16T12:03
draft: false
---

# Running Home Assistant on Mac Mini

Experiment with installing and configuring Home Assistant container on Mac mini including Docker management, audio support, and automation setup.

## Overview

* [x] Tinker with Home Assistant ... >2022-01-16 >2022-03-11 >2022-01-20 >2022-01-16 >2021-12-07  @done(2022-03-11 11:58 PM)
	* [x] Investigate if I can run a home assistant container ... @done(2022-01-16 12:03 AM)
		* home-assistant docker only works on linux ...
		* [GitHub: docker/for-mac](https://github.com/docker/for-mac/issues/2716)
		* [docs.docker.com: Networking](https://docs.docker.com/desktop/mac/networking/)
		* [docs.docker.com: Network Tutorial Host](https://docs.docker.com/network/network-tutorial-host/)
		* [community.home-assistant.io: Question Running Homeassistant Using Docker On Macos](https://community.home-assistant.io/t/question-running-homeassistant-using-docker-on-macos/274048/4)
	* [x] Install home assistant  @done(2022-01-20 09:43 PM)
		* `pip install sqlalchemy aiohttp_cors`
	* [x] Create a script to boot up homeassistant on Mac mini ... if its not already running ...   @done(2022-01-20 10:58 PM)

# Installation & Setup

## Home Assistant OS (HAOS) on M1 Mac Mini

* Was able to get HAOS installed on Mac mini with m1 per these:
	* [GitHub: home-assistant/operating-system](https://github.com/home-assistant/operating-system/releases)
		* Was able to download vmdk on this page 
		* Was able to determine linux 6 was being used
	* Helpful 
		* [GitHub: home-assistant/operating-system](https://github.com/home-assistant/operating-system?tab=readme-ov-file)
		* [community.home-assistant.io: How Can I Download Directly The Haos Image](https://community.home-assistant.io/t/how-can-i-download-directly-the-haos-image/340430)
	* Inspiration to use VMware fusion player: [reddit.com: Home Assistant On A Mac Mini M1](https://www.reddit.com/r/homeassistant/comments/15lvymm/home_assistant_on_a_mac_mini_m1/)
	* Guide I followed on instructions on how to install the vmdk: [home-assistant.io: Windows](https://www.home-assistant.io/installation/windows/)
	* Disabling secure boot: [communities.vmware.com: How To Specify That UEFI Secure Boot Is Enabled Disabled](https://communities.vmware.com/t5/VMware-Workstation-Player/How-to-specify-that-UEFI-Secure-Boot-is-enabled-disabled/td-p/2833618)
	* kinda helpful guides
		* [simplysmart.house: Install Home Assistant On Windows Vmware](https://www.simplysmart.house/blog/install-home-assistant-on-windows-vmware)
		* [community.home-assistant.io: Installing Home Assistant On Vmware Player 17](https://community.home-assistant.io/t/installing-home-assistant-on-vmware-player-17/570428)
	* ignored these guides
		* [home-assistant.io: Generic X86 64](https://www.home-assistant.io/installation/generic-x86-64/)
	* General settings
		* [google.com: Search](https://www.google.com/search?q=nvme+vs+sata&pws=0)
	* Alternatives considered
		* [fedora-asahi-remix.org](https://fedora-asahi-remix.org/)
		* [fedoramagazine.org: Coming Soon Fedora For Apple Silicon Macs](https://fedoramagazine.org/coming-soon-fedora-for-apple-silicon-macs/)

* I can get a shell into haos ... but it doesn't have ... 
	* Need to make a shared folder ...
	* [community.home-assistant.io: Home Assistant Blue How To Get A Shell](https://community.home-assistant.io/t/home-assistant-blue-how-to-get-a-shell/500050/3)

* Home assistant os is using docker for everything [community.home-assistant.io: How To Install Vmware Tools](https://community.home-assistant.io/t/how-to-install-vmware-tools/516367/9)

* /mnt/data/supervisor/homeassistant is mounted to /config in containers ..

## Docker Container Installation

* Install docker on Mac mini 
  * [influxdata.com: Getting Started Home Assistant Docker](https://www.influxdata.com/blog/getting-started-home-assistant-docker/)
  * `docker run -d --name homeassistant -v '/Users/omareid/Workspace/git/automation-hub/hass-config:/config' --network host -p 8123:8123 homeassistant/home-assistant`
  * `docker run -d --name homeassistant -v '/Users/omareid/Workspace/git/automation-hub/hass-config:/config' -p 8123:8123 homeassistant/home-assistant`
  * [docs.docker.com: Network Tutorial Host](https://docs.docker.com/network/network-tutorial-host/)
  *  docker run --rm -d --network host --name my_nginx nginx


# Configuration & Integration

## Completed Integrations

* [x] Confirmed ha can see buttons @done(2024-02-26 09:30 PM)
* [x] Confirmed ha/macmini can see lights  @done(2024-02-26 09:30 PM)
	* [x] Moved lights over to Mac mini @done(2024-02-26 09:30 PM)
* [x] Make sure HA can access lights @done(2024-02-26 09:30 PM)
	* [-] there may no longer be a need to ssh if sound cards are accessible in container
* [x] hook hue back up @done(2024-02-26 09:30 PM)
- [x] Address issues  @done(2024-02-26 09:32 PM)
	* [community.home-assistant.io: Home Assistant Network Unreachable](https://community.home-assistant.io/t/home-assistant-network-unreachable/474772/4)
	* rebooting machine [community.home-assistant.io: Solved Restarting Home Assistant From The Command Line Witho](https://community.home-assistant.io/t/solved-restarting-home-assistant-from-the-command-line-without-restarting-container-other-cmds-works-with-docker/122246/13)
	* Had to reboot home assistant to get all buttons registered ...
- [x] Build basic flask app to turn lights off/on @done(2024-02-26 09:32 PM)
	- [auth0.com: Developing Restful Apis With Python And Flask](https://auth0.com/blog/developing-restful-apis-with-python-and-flask/)
- [x] Make sure home assistant can call API @done(2024-02-26 09:31 PM)
	* [home-assistant.io: Rest Command](https://www.home-assistant.io/integrations/rest_command/)

## Pending Integrations

* [ ] hook nanoleaf back up
* [ ] Resetting up the zwave stick 
	* [bright-softwares.com: Docker Tip Inspect And Jq](https://bright-softwares.com/blog/en/docker/docker-tip-inspect-and-jq)

# Docker & Container Management

## Docker Networking

* Understand internal docker mechanics ...
	* [forums.docker.com: Understanding The Docker For Mac Localhost Behavior](https://forums.docker.com/t/understanding-the-docker-for-mac-localhost-behavior/41921/2)
	* ~~docker.for.mac.host.internal~~
	* host.docker.internal
* [Medium: How To Connect To The Docker Host From Inside A Docker Container 112b4c71bc66](https://medium.com/@TimvanBaarsen/how-to-connect-to-the-docker-host-from-inside-a-docker-container-112b4c71bc66)

## Audio Support in Docker

- [ ] Play sound within docker container ... 
	- [ ] [forums.docker.com: Docker For Mac Audio Support](https://forums.docker.com/t/docker-for-mac-audio-support/16098/6)
	- [ ] [devops.datenkollektiv.de: Running A Docker Soundbox On Mac](https://devops.datenkollektiv.de/running-a-docker-soundbox-on-mac.html)
	- [ ] Login as root [Stack Overflow: Root Password Inside A Docker Container](https://stackoverflow.com/questions/28721699/root-password-inside-a-docker-container)
	- [ ] Addressing platform issue [Stack Overflow: M1 Docker Preview And Keycloak Images Platform Linux Amd64 Does Not Match Th](https://stackoverflow.com/questions/66662820/m1-docker-preview-and-keycloak-images-platform-linux-amd64-does-not-match-th)
	- [ ] [GitHub: jessfraz/dockerfiles](https://github.com/jessfraz/dockerfiles)
	- [ ] `docker run -it -e PULSE_SERVER=docker.for.mac.localhost -v ~/.config/pulse:/home/pulseaudio/.config/pulse --platform linux/amd64 --entrypoint bash -u 0 --rm jess/pulseaudio`
* [GitHub: TheBiggerGuy/docker-pulseaudio-example](https://github.com/TheBiggerGuy/docker-pulseaudio-example/issues/1)
* Might be easier to ssh onto host from container and run command ....

## Docker Utilities

* install ping in a container
	* apt-get install -y iputils-ping
	* [Stack Overflow: Docker Ubuntu Bash Ping Command Not Found](https://stackoverflow.com/questions/39901311/docker-ubuntu-bash-ping-command-not-found)

## Docker Issues

* Issue with passing tty ... [GitHub: docker/for-mac](https://github.com/docker/for-mac/issues/900)
* [GitHub: docker/for-mac](https://github.com/docker/for-mac/issues/900)

# Development & Customization

## Flask API Integration

- [x] Build basic flask app to turn lights off/on @done(2024-02-26 09:32 PM)
	- [auth0.com: Developing Restful Apis With Python And Flask](https://auth0.com/blog/developing-restful-apis-with-python-and-flask/)
- [x] Make sure home assistant can call API @done(2024-02-26 09:31 PM)
	* [home-assistant.io: Rest Command](https://www.home-assistant.io/integrations/rest_command/)

## Custom Integrations & Add-ons

- [ ] Making a home assistant plugin 
	- [ ] [developers.home-assistant.io: Tutorial](https://developers.home-assistant.io/docs/add-ons/tutorial/)
- [ ] Building custom integration 
	* [developers.home-assistant.io: Integration Listen Events](https://developers.home-assistant.io/docs/integration_listen_events/)

## Service Management

* [ ] Turn server into service
	* [support.apple.com: Mac](https://support.apple.com/guide/terminal/script-management-with-launchd-apdc6c1077b-5d5d-4d35-9c19-60f2397b2369/mac)
	* [reddit.com: Ifconfig On Alpinelinux On Ipad In Ish App](https://www.reddit.com/r/AlpineLinux/comments/t612mi/ifconfig_on_alpinelinux_on_ipad_in_ish_app/)
	* [somesh-rokz.medium.com](https://somesh-rokz.medium.com/how-to-create-services-in-macos-using-bash-launchctl-and-plutil-commands-step-by-step-guide-d736d25cdeeb)


# Troubleshooting

## Installation Issues

* Issues I was experiencing
	* [community.home-assistant.io: No Bootable Medium Found System Halted](https://community.home-assistant.io/t/no-bootable-medium-found-system-halted/60783)
	* [kb.vmware.com: 2151780](https://kb.vmware.com/s/article/2151780)
	* [communities.vmware.com: VMware Fusion Discussions](https://communities.vmware.com/t5/VMware-Fusion-Discussions/No-Operating-System-found/td-p/1828789)
	* [kb.vmware.com: 80415](https://kb.vmware.com/s/article/80415)

## Network Issues

* [community.home-assistant.io: Home Assistant Network Unreachable](https://community.home-assistant.io/t/home-assistant-network-unreachable/474772/4)
* rebooting machine [community.home-assistant.io: Solved Restarting Home Assistant From The Command Line Witho](https://community.home-assistant.io/t/solved-restarting-home-assistant-from-the-command-line-without-restarting-container-other-cmds-works-with-docker/122246/13)


# Future Work

## Immediate Tasks

* [ ] Wrapup home assistant on Mac mini
	* [ ] get button to work
	* [ ] resetup nanoleaf

## External Access

* [ ] Setup external access
	* [homeassistant.local: Info](http://homeassistant.local:8123/hassio/addon/core_duckdns/info)
		* [duckdns.org: Domains](https://www.duckdns.org/domains)
		* bytesofpurpose.duckdns.org
		* [home-assistant.io: Http](https://www.home-assistant.io/integrations/http/#server_port)

## Alternative Setups
* [ ] Container mode for home assistant - 
	* [ ] Homeassistant os just spins up containers / is a facade to containerized services
	* [ ] Can do zwave with a wave js container ...
	* [ ] [GitHub: zwave-js/zwave-js-ui](https://github.com/zwave-js/zwave-js-ui/blob/master/docker/docker-compose.yml)


# Portainer

## Installation

* Install portainer 
	* [reddit.com: Any Recommendations For An Web Based Docker](https://www.reddit.com/r/selfhosted/comments/xuv0hq/any_recommendations_for_an_web_based_docker/)
	* [academy.portainer.io: Install](https://academy.portainer.io/install/#/lessons/O_jpOK1OjVo2_9305Wu1F6a26PpHugh3)
	* Has oauth ... 
	* [docs.portainer.io: Docker](https://docs.portainer.io/start/install/server/docker)
	* docker volume create portainer_data
	* docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ee:latest

## Resources

* [portainer.io](https://www.portainer.io/)
* [portainer.io: Take 3](https://www.portainer.io/take-3)
* [academy.portainer.io: Install](https://academy.portainer.io/install/#/lessons/KFFbWJs2VcFzs4aKHf0sE-lIT2AGWYsp)


# Proxmox

## Setup & Integration

* [ ] Proxmox 
	* [ ] [home-assistant.io: Proxmoxve](https://www.home-assistant.io/integrations/proxmoxve/)
	* [ ] [pve.proxmox.com: Linux Container](https://pve.proxmox.com/wiki/Linux_Container)

# Hardware & Devices

## USB Devices

* /dev/tty.usbmodem2101


# References & Resources

## Configuration Examples

* [home-assistant.io: Examples](https://www.home-assistant.io/examples/#example-configurationyaml)
* [iotechonline.com: Home Assistant Install With Docker Compose](https://iotechonline.com/home-assistant-install-with-docker-compose/)

## Docker Resources

* [docs.docker.com: Networking](https://docs.docker.com/desktop/mac/networking/)
* [docs.docker.com: Network Tutorial Host](https://docs.docker.com/network/network-tutorial-host/)

## Community Resources

* [reddit.com: Qx5Ih4JIlL](https://www.reddit.com/r/homeassistant/s/qx5Ih4JIlL)
