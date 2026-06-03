---
slug: /productivity/dashboards/dashboard
title: Dashboard
description: 'Developing a comprehensive personal dashboard for tracking finances, productivity, habits, and business metrics with monitoring and alerting.'
authors: [oeid]
tags: [dashboard, metrics, monitoring, finances, productivity, habits, cloudwatch, prometheus, development]
date: 2023-01-03T10:00
draft: true
---


# Priorities
  - I need to track finances / monthly expenses in a dashboard ...  
  - I need to track my productivity in a dashboard ...  
  - I need to monitor my asset allocation ...
  - I need to track my habits ...
    - I need a tool that shows how productive i've been across work days ... almost like a calendar like dashboard ...
  - I need to track progress towards starting my own business
  - I need to merge my credit card info and track expenses...

# Dashboard
	
* [ ] Add the following to my dashboard ...
	* [ ] Add my monthly costs ...
		* [ ] How much do I spend at each store ...
			* [ ] Don't want individual events leaked ...
		* [ ] Catalog my monthly costs ...
		* [ ] How much money do I spend at each store?
		* [ ] What are my expenses?
	* [ ] Add my time utilization to the dashbord ...
		* [ ] most active time ...
	* [ ] My link utilization / history ...

# Inegrating with Jira
- [ ] Does Jira give you any productivity metrics built in for free?
- [ ] When it comes to dashboarding categories of work - how much of this is relying on jira dashboards?

# Tinker with Redash
- [ ] with jira redash integration ... can jira's dashboards be used in redash?
	- [ ] or is it just jira's data?
	- [ ] What expectation does reddish have on how jira issues are modeled?
* [ ] What data sources does Redash accept 
* [ ] Tinker with Redash's Jira integration ...
* [ ] Tinker with Redash >2022-01-16 >2022-01-16 >2022-03-12 >2022-03-11 >2022-01-20

# Analyzing COPs
* [ ] Continue dashboarding my COPs >today >2022-04-04 
	* [ ] import data from rest of credit cards ...
	* [ ] figure out what I want to analyze ..

## Analyzing Finances
- [ ] Add monthly subscriptions to dashboard ...
* [ ] Continue trying to train spacy model ...
	* [ ] Broker ... and Company ... and Company Identifier ... and zip code ...
	* [ ] [towardsdatascience.com](https://towardsdatascience.com/named-entity-recognition-ner-using-spacy-nlp-part-4-28da2ece57c6)

# Metrics / Dashboard
- [ ] Start off by making excel metrics ...
- [ ] Eventually, get dashboard into notebooks!

# Business Metrics
- Brainstorm metrics to track progress towards starting my own business ...

# Vision Metrics / Vision Board
## Integrating with Vision Board ...
- [ ] Is my dashboard my vision board?
	- [ ] Should I add visions to my dashboard / metrics that indicate realizing visions?

# Time Metrics
- [ ] Brainstorm metrics to monitor "My Time Allocation".
- [ ] Brainstorm metrics to monitor "My Productivity".
* [ ] time metrics
		* [ ] where do I want to soend my time
		* [ ] where am I actually spending my time

# Habit Metrics 
- [ ] Brainstorm metrics to track how I want to shape each of my metrics 

# -------

# Physical Metrics	
* [ ] what calories do I want to eat?
* [ ] Shat cals do I actually eat
* [ ] am I tracking my cals 
* [ ] how often do I want to do exercise ..


# Action Metrics

# ------------

# Planning
* [ ] Organize my dashbboard todos ... add links from board to git ...

# Theming
* [ ] add noun project files to cdn ...
* [ ] setup s3 cdn ...
- [x] Add icons to each of the metric categories  @done(2023-01-03 10:33 PM)
	- [x] Get proper images from noun project @done(2023-01-03 10:33 PM)
		- [Free Icons for Everything - Noun Project](https://thenounproject.com/browse/icons/similar/purpose-5174541/?p=1)
	- [x] Upload to CDN @done(2023-01-03 10:33 PM)

# Dashboard
* [ ] Add an intent column to each metric-why am I tracking this metric
* [ ] metrics - how often do I work towards my purpose
* [ ] how many of my priorities are in pursuit of my purpose? is the whole crafts as tech in pursuit of this??


# Google Sheets Integration
* [docs.retool.com: Google Sheets Integration](https://docs.retool.com/docs/google-sheets-integration)
* [Google Cloud Platform](https://console.cloud.google.com/iam-admin/serviceaccounts/details/112572266864531726362/permissions?project=project-79121-borrowed)
- Share [spreadsheet]([Google Sheets: Sign-in](https://docs.google.com/spreadsheets/d/1-85tLI5ifm6vljBuOuyTLov5J1awxIiqzcF1WRGopYw/edit#gid=1919395593)) with service account ... 
	- retool@project-79121-borrowed.iam.gserviceaccount.com

- [ ] Retool google sheets integ listed - good for outputting content ... bad for querying ..





# Initiative: Personal Metrics / Monitoring
* [AWS Docs: Cdk Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
* Monitoring with CloudWatch
	* [AWS Docs: Aws Cdk Lib.Aws Cloudwatch.Alarm](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Alarm.html)
* Alarms with cloud watch ...
* Auto Rollback? ...
* [AWS: Features](https://aws.amazon.com/codepipeline/features/)
- [ ] Add metrics to the cronjob ...
- [ ] Add monitoring stack ...

# Monitoring
- [ ] Setup a monitoring stack first to monitor daily cron runs 
- [ ] Setup a pipeline to auto deploy alarms? 
	- [ ] See what pipelines are about ...
	- [ ] Work on Cdk Pipeline [AWS Docs: Cdk Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
- [ ] Porting CDK to v2 ...
* [ ] Just have a single custom cloudwatch metric
	* [ ] Emits once per minute
	* [ ] Integrate alarms with slack ...
	* [ ] [AWS Docs: PublishingMetrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)
* [ ] metric I can track is how many jobs ran in past minute ...
* [ ] how can I store metrics in an easy way where they can be published to cloud watch or prometheus


# Alerting 
- [ ] Swappa alarming mechanism through cloud watch? 
	- [ ] Different metric dimensions? 
	- [ ] Or do it through prometheus ?
* use prometheus for alerting ...
	* [prometheus.io](https://prometheus.io/)
- [ ] Extract AWS cost and add it to alerting ...
	- [ ] Using AWS CLI ...
- [GitHub: prometheus/client_python](https://github.com/prometheus/client_python)
- [GitHub: vegasbrianc/prometheus](https://github.com/vegasbrianc/prometheus)
- [hub.docker.com: Prometheus](https://hub.docker.com/r/prom/prometheus)
- [GitHub: prometheus/client_python](https://github.com/prometheus/client_python)
- [pagerduty.com: Incident Response](https://www.pagerduty.com/pricing/incident-response/)
- [prometheus.io: Overview](https://prometheus.io/docs/introduction/overview/)
- [GitHub: prometheus/client_python](https://github.com/prometheus/client_python#exporting-to-a-pushgateway)


# CDK
* [AWS Docs: Aws Construct Library](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
* Pipelines
	* [AWS Docs: Cdk Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
	* [AWS Docs: Use Cfn Template](https://docs.aws.amazon.com/cdk/v2/guide/use_cfn_template.html)
- [ ] Migrating from 1 to 2 
	- [AWS Docs: Migrating V2](https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html)
* [AWS: Pricing](https://aws.amazon.com/cloudwatch/pricing/)
* Incoming alert webhook
	* [bytesofpurposegroup.slack.com: B05N7SDTMU7](https://bytesofpurposegroup.slack.com/services/B05N7SDTMU7?added=1)
	* [hooks.slack.com: URL](https://hooks.slack.com/services/YOUR/WEBHOOK/URL)

# Metrics
- [ ] Setup slack messages for prometheus
	- [app.slack.com: C05NKFA1005](https://app.slack.com/client/T05NNC30ZHQ/C05NKFA1005)
	- [bytesofpurposegroup.slack.com: B05N7SDTMU7](https://bytesofpurposegroup.slack.com/services/B05N7SDTMU7?added=1)
	- [GitHub: omars-lab/prometheus](https://github.com/omars-lab/prometheus)
	- [docs.docker.com: Swarm Tutorial](https://docs.docker.com/engine/swarm/swarm-tutorial/)
	- [docs.docker.com: Gettingstarted](https://docs.docker.com/compose/gettingstarted/)
	- [GitHub: vegasbrianc/prometheus](https://github.com/vegasbrianc/prometheus/blob/master/prometheus/prometheus.yml)
	- [prometheus.io: Overview](https://prometheus.io/docs/introduction/overview/)
	- [AWS Docs: Cloudwatch Metrics Basic Detailed](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-metrics-basic-detailed.html)
