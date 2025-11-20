---
slug: website-portfolio
title: My Portfolio
description: 'Developing a comprehensive portfolio website with React, AWS deployment, and automated CI/CD pipeline.'
authors: [oeid]
tags: [portfolio, website, react, aws, deployment, ci-cd, development]
date: 2021-04-06T10:00
draft: false
---

# My Portfolio

I need a portfolio website ... this document serves as my initial plan to put one together.

*See [Portfolio Roadmap](/docs/development/7-roadmaps/portfolio-roadmap) for future enhancements and strategic planning.*

# Completed Work

## Infrastructure & Deployment
- [x] Routing apex to subdomain @done(2021-04-12 21:45 PM) #usedShortcut 
- [x] Make XMLHttpRequest async @done(2021-04-12 21:45 PM) #usedShortcut 
	- https://thisinterestsme.com/synchronous-xmlhttprequest/
- [x] Make automate build for my portfolio using codedeploy @done(2021-04-12 21:58 PM) #usedShortcut 
	- https://www.codelocker.net/p/1912/aws-codebuild-buildspecyml-to-push-files-to-s3/
- [x] Setup a code pipeline... @done(2021-04-12 21:58 PM) #usedShortcut 
	- A code build is just a build stage ...
	- A pipeline ... is what triggers the build ...

## Portfolio Content
- [x] Add code deploy to my portfolio .. @done(2021-04-06 17:20 PM) #usedShortcut 
- [x] Add resume pdf to s3 ... @done(2021-04-06 17:20 PM) #usedShortcut 
	- [x] Add a download button to download the resume / @done(2021-04-06 17:20 PM) #usedShortcut 

# Implementation Notes

## Architecture
- A code build is just a build stage ...
- A pipeline ... is what triggers the build ...

## Resources
- https://mui.com/pricing/
- https://thisinterestsme.com/synchronous-xmlhttprequest/
- https://www.codelocker.net/p/1912/aws-codebuild-buildspecyml-to-push-files-to-s3/