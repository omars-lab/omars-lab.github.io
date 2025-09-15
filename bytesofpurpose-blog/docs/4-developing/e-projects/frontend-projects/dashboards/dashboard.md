---
tag: '#id.dashboard'
summary: Developing My Dashboard
category: tools
priorities:
  - I need to track finances / monthly expenses in a dashboard ...
  - I need to track my productivity in a dashboard ...
  - I need to monitor my asset allocation ...
  - I need to track my habits ...
  - I need a tool that shows how productive i've been across work days ... almost
    like a calendar like dashboard ...
  - I need to track progress towards starting my own business
  - I need to merge my credit card info and track expenses...
content:
  md5: e1611ae2be2d6ae8f6b8eaca1aa6d983
trello:
  card: https://trello.com/c/5c7pmhLs
  done: false
  id: 63c81c1fcd04cf03f9db0d64
  list: 63c43d5498733701c29d3a12
jira:
  task: https://sacred-patterns.atlassian.net/browse/THREAD-74
xcallback: vscode://file/Users/omareid/Workspace/git/blueprints/initiatives/tool-dashboard.md:1
glue: https://glue/blueprints/#id.dashboard
---

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
	* [ ] https://towardsdatascience.com/named-entity-recognition-ner-using-spacy-nlp-part-4-28da2ece57c6

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
* https://docs.retool.com/docs/google-sheets-integration
* [Google Cloud Platform](https://console.cloud.google.com/iam-admin/serviceaccounts/details/112572266864531726362/permissions?project=project-79121-borrowed)
- Share [spreadsheet]([Google Sheets: Sign-in](https://docs.google.com/spreadsheets/d/1-85tLI5ifm6vljBuOuyTLov5J1awxIiqzcF1WRGopYw/edit#gid=1919395593)) with service account ... 
	- retool@project-79121-borrowed.iam.gserviceaccount.com

- [ ] Retool google sheets integ listed - good for outputting content ... bad for querying ..





# Initiative: Personal Metrics / Monitoring
* https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
* Monitoring with CloudWatch
	* https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Alarm.html
* Alarms with cloud watch ...
* Auto Rollback? ...
* https://aws.amazon.com/codepipeline/features/
- [ ] Add metrics to the cronjob ...
- [ ] Add monitoring stack ...

# Monitoring
- [ ] Setup a monitoring stack first to monitor daily cron runs 
- [ ] Setup a pipeline to auto deploy alarms? 
	- [ ] See what pipelines are about ...
	- [ ] Work on Cdk Pipeline https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
- [ ] Porting CDK to v2 ...
* [ ] Just have a single custom cloudwatch metric
	* [ ] Emits once per minute
	* [ ] Integrate alarms with slack ...
	* [ ] https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html
* [ ] metric I can track is how many jobs ran in past minute ...
* [ ] how can I store metrics in an easy way where they can be published to cloud watch or prometheus


# Alerting 
- [ ] Swappa alarming mechanism through cloud watch? 
	- [ ] Different metric dimensions? 
	- [ ] Or do it through prometheus ?
* use prometheus for alerting ...
	* https://prometheus.io/
- [ ] Extract AWS cost and add it to alerting ...
	- [ ] Using AWS CLI ...
- https://github.com/prometheus/client_python
- https://github.com/vegasbrianc/prometheus
- https://hub.docker.com/r/prom/prometheus
- https://github.com/prometheus/client_python
- https://www.pagerduty.com/pricing/incident-response/
- https://prometheus.io/docs/introduction/overview/
- https://github.com/prometheus/client_python#exporting-to-a-pushgateway


# CDK
* https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
* Pipelines
	* https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
	* https://docs.aws.amazon.com/cdk/v2/guide/use_cfn_template.html
- [ ] Migrating from 1 to 2 
	- https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html
* https://aws.amazon.com/cloudwatch/pricing/
* Incoming alert webhook
	* https://bytesofpurposegroup.slack.com/services/B05N7SDTMU7?added=1
	* https://hooks.slack.com/services/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

# Metrics
- [ ] Setup slack messages for prometheus
	- https://app.slack.com/client/T05NNC30ZHQ/C05NKFA1005
	- https://bytesofpurposegroup.slack.com/services/B05N7SDTMU7?added=1
	- https://github.com/omars-lab/prometheus
	- https://docs.docker.com/engine/swarm/swarm-tutorial/
	- https://docs.docker.com/compose/gettingstarted/
	- https://github.com/vegasbrianc/prometheus/blob/master/prometheus/prometheus.yml
	- https://prometheus.io/docs/introduction/overview/
	- https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-metrics-basic-detailed.html
