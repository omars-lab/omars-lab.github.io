---
category: app
content:
  md5: 231a18ff0cf1834965657dee74569172
glue: https://glue/blueprints/#id.app.motivator
jira:
  epic: https://sacred-patterns.atlassian.net/browse/THREAD-19
  task: https://sacred-patterns.atlassian.net/browse/THREAD-20
priorities:
  - I need to customize my lametric
  - I need to motivate myself
summary: Developing My LaMetric Motivation App
tag: '#id.app.motivator'
trello:
  card: https://trello.com/c/g8wP96mE
  done: false
  id: 63c8c9045e3d5101bd833f10
  list: 63c43d5498733701c29d3a12
---

* [ ] Can the la metric do arabic?

# Enhance La Metric App ...

- [ ] Fix typos in the quotes ...
	- [ ] Think through the dynamo refresh proces ...

* [ ] Add more quotes to the la metric!

- [ ] Interleave more than just quotes ...
	- [ ] Figure out all the metrics I want to display!

* [ ] Can I make lemetric play audio??
	- [ ] Figure out how to get the la metric to play audio ...
	- [ ] Can I do bluetooth over command line ...?

* [ ] Need to turn the motivational bytes into a call of duty breaking news type thing ...

- [ ]  Tinker with CDK
	- [ ] Add monitoring/dashboard to cdk lametric app?

- [ ] Tinker more with OAuth / Cognito?
	* [ ] Make a token vending machine?

* [x] I need to finish the la metric app ... >2021-10-30  @done(2021-11-06 11:34 PM)
	* [x] Make the dropbox stack run a cron lambda and get secrets from secretmanager @done(2021-10-25 10:52 PM)
	* [x] Save quotes in dynamodb and have thingy update based on those quotes! >2021-10-25  @done(2021-10-26 01:00 PM)
	* [x] Organize my quotes @done(2021-10-30 12:39 PM)
	* [x] Update lamda to query dynamo ... @done(2021-11-06 11:34 PM)
	* [x] Write a script to save data to dynamo ... >2021-10-30  @done(2021-11-06 11:34 PM)

- [x] Tinker with Lametric polling ... @done(2021-11-03T00:35:49-05:00)

- [x] Install AWS CLI @done(2021-11-03T00:45:52-05:00)
	- https://aws.amazon.com/cli/
	- https://aws.amazon.com/blogs/developer/super-charge-your-aws-command-line-experience-with-aws-shell/

# Publish App

- [x] Make an la metric app @done(2021-11-03T00:46:29-05:00)
- [x] Creating a Privacy Policy  @done(2021-11-03T00:41:34-05:00)
	- https://www.websitepolicies.com/create/privacy-policy?gclid=Cj0KCQjwv5uKBhD6ARIsAGv9a-wHUSg3UUq8s2n4ZC3T37V7Q_DKu4iJ1YLWiZUilED-hOCQQDOKEGUaAqC4EALw_wcB

# Stack v2 - Using Dropbox

- [x] Get the la metric thingy to work! @done(2021-11-03T00:45:13-05:00)
	- [x] I need to make the LA Metric Clock display motivational quotes! @done(2021-11-03T00:46:37-05:00)
	- [-] Get the API working to power this ...
		- [-] use cdk to make a lambda with rate limiting for clock app!

- [x] Setup lambda with pip deps ... (docker based ...) @done(2021-11-03T00:35:15-05:00)

- [x] Setup secrets with the dropbox pusher ... so it can pull secrets from the secret manager ... @done(2021-11-03T00:45:01-05:00)

- [x] Create a quotes db in dynamo? ... or in dropbox? @done(2021-11-03T00:43:40-05:00)

- [x] Have two cdk stacks run simultaneously ... @done(2021-11-03T00:41:48-05:00)
	- One dropbox based pusher and another authenticated api! 
	- [x] Use dropbox instead and have the lambda update dropbox ... @done(2021-11-03T00:42:11-05:00)


# Leveraging Cognito for Auth
- [ ] How do I develop a La Metric App that Uses Cognito?
    - [ ] Link this to a local xcallback url to open questions file! #process

- [ ] Giving LaMetric an auth url ...
	- [ ] What's the domiain name of my endpoint
		- [ ] https://bytesofpurpose.auth.us-east-1.amazoncognito.com/oauth2/authorize
	- [ ] Can I set domain name in cognate?
		- [ ] https://console.aws.amazon.com/cognito/users/?region=us-east-1#/pool/us-east-1_LPe9YcWFf/app-integration-domain?_k=pkzud7
	- [ ] Whats my refresh url?
		- [ ] https://bytesofpurpose.auth.us-east-1.amazoncognito.com/oauth2/token
	- [ ] Had to create a privacy policy - https://www.websitepolicies.com/policies/view/ukZU3V8d

- [ ] Consolidate links needed by the oauth app ...
	- [ ] Whats my cognito's authorize endpoint?
		- https://bytesofpurpose.auth.us-east-1.amazoncognito.com/oauth2/authorize
		- https://bytesofpurpose.auth.us-east-1.amazoncognito.com/oauth2/token

- [ ] Ensure Cognito is setup via cdk
	- [ ] Enable client secret ... for cognito ...
	- [ ] https://awslabs.github.io/scale-out-computing-on-aws/security/integrate-cognito-sso/
	- [ ] https://github.com/aws-samples/aws-cdk-examples/tree/master/python
	- [ ] https://alexanderzeitler.com/articles/create-aws-cognito-userpool-with-oauth-flows-using-cdk/
	- [ ] https://stackoverflow.com/questions/59489587/aws-cdk-tie-cognito-user-pool-to-api-gateway
	- [ ] https://github.com/aws/aws-cdk/issues/10676

- [ ] Dig through lametric's docs regarding Integrate with La Metric Authorization ... 
	- [ ] https://lametric-documentation.readthedocs.io/en/latest/reference-docs/cloud-authorization.html
	- [ ] https://lametric-documentation.readthedocs.io/en/latest/reference-docs/cloud-authorization.html?highlight=client%20id#obtain-oauth-2-0-credentials-from-the-lametric-developer

- [ ] Debugging Cognito Issues ...
	- [ ] Add more logs to the API Gateway
		- https://seed.run/blog/whats-the-difference-between-access-logs-and-execution-logs-in-api-gateway.html
	* [ ] Use the pipe thingy to figure out what cognito is actually doing ...
		* [ ] Have the redirect URL also go through pipe dream ....

- [ ] Prepare general oauth example / blog ...
	* [ ] Put together an example of how the identity broker calls cognate on the users behalf ...

* [ ] Realized ... oauth is very much oriented to user logging in through apps ... backend (servic to service) flows not very friendly ... 
	* [ ] To get a code we can refresh ... 
	* [ ] We need to login through the browser ... and expose an API for dropbox to invoke ...
	* [ ] https://www.dropbox.com/developers/documentation/http/documentation#oauth2-authorize