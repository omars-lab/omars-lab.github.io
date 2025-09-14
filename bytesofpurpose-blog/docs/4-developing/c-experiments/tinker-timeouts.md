---
epic: https://sacred-patterns.atlassian.net/browse/THREAD-13
summary: 'Examples/Example: Sockets'
task: https://sacred-patterns.atlassian.net/browse/THREAD-14
xcallback: vscode://file/Users/omareid/Workspace/git/blueprints/initiatives/example-timeouts.md:1
---

* [x] Start the timeout example @done(2021-09-26 12:04 AM)
	* [x] Add a springboot app with mysql @done(2021-09-26 12:04 AM)

* [ ] make an example of timeouts with a background task that monitors os socket usage ...
* [ ] interlace logs of requests with socket metrics and graph important events ...

* [ ] Overlay events in a dashboard ...
	* [ ] if they are html .. serve static content over spring
	* [ ] figure out how to configure timeouts

* [ ] Need an example showcasing all the different kinds of timeouts
* [ ] What is a keep-alive timeout?
* [ ] What is a connection timeout ... What is a socket timeout? 
* [ ] What is involved in a tcp connection??
* [ ] Should I turn this into a blog post?

What are all the different timeout patterns ...?

- [ ] I need to tinker with a web socket example …
- [ ] I need to tinker with an HTTP example ...

# Make a Timeout Example

Run a Bobcat server

```
import org.apache.catalina.Service;
import org.apache.catalina.core.ContainerBase;
```

Have an endpoint for a 1 sec timeout ...
2 sec ... 3 sec ...

Configure socket timeout ...
Configure keep alive ...
Show sockets on machine ...
Show when a connection timeout gets fired ...
Show when a socket timeout gets fired ...