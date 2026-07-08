---
slug: how-oauth-lets-an-app-act-on-your-behalf
title: "How OAuth Lets an App Act on Your Behalf"
description: "A plain-language walkthrough of the OAuth handshake: how a third-party app gets access to your data without ever seeing your password."
authors: [oeid]
tags: [backend, software-engineering, best-practices]
date: 2020-03-23
draft: true
---

The thing that finally made OAuth click for me was framing it around a single question: *how does an app get to act on my behalf without me ever handing it my password?* Once you trace the handshake from that angle, the moving parts (request tokens, access tokens, the redirect dance) stop being jargon and start being obvious.

Here's the walkthrough I wrote for myself, using Jira as the concrete example of the system that owns the data.

<!-- truncate -->

## The cast of characters

Say I have data in **Jira**: issues, projects, comments. I own these resources, which makes me the **resource owner**: I'm the one who decides whether that information is kept, shared, or deleted.

Now I start using **another app** that integrates with Jira. At some point I take an action in that app that requires data *from* Jira. The app needs access, but I do **not** want to give it my Jira username and password. That's the whole problem OAuth exists to solve.

## The handshake

Here's the sequence that lets the app reach my Jira data without ever learning my credentials:

1. The app requests a **request token** from Jira.
2. The app **redirects me to Jira** to authorize that request token. It also tells Jira where to send me back afterward.
3. On Jira's own site, I enter my username and password (**into Jira, never into the app**) and approve the request.
4. Jira sends me back to the app, now carrying an **authorized request token**.
5. The app exchanges that authorized request token for an **access token**, and uses the access token to call Jira's API for my data.

The key move is step 3: my credentials only ever touch Jira. The app walks away with tokens, not with my password, and I can revoke those tokens later without changing my password everywhere.

## Why two tokens instead of one

It's reasonable to ask why the flow bothers with a *request* token and *then* an *access* token, rather than just handing the app one credential. The separation is what makes the authorization step meaningful: the request token represents "an app is *asking*," and only after I approve it on the resource owner's site does it become something that can be exchanged for real access. The access token is then the thing that's scoped, refreshable, and revocable, independent of my login.

That word **scope** matters: an access token is granted for a limited set of permissions, not blanket access to everything I own. The app gets exactly what I approved and no more.

## Where to go deeper

When I wrote these notes I lined up the canonical references worth reading next:

- [Refreshing access tokens](https://www.oauth.com/oauth2-servers/access-tokens/refreshing-access-tokens/): how an access token is renewed without sending the user back through the flow.
- [Why OAuth has both a request token and an access token](https://stackoverflow.com/questions/3584718/why-is-oauth-designed-to-have-request-token-and-access-token): the design rationale for the two-token split.
- [OAuth scopes](https://oauth.net/2/scope/): the mechanism that limits what an access token is allowed to do.
- [Jira's REST API OAuth authentication](https://developer.atlassian.com/cloud/jira/platform/jira-rest-api-oauth-authentication/): the concrete provider flow this walkthrough is modeled on.

The mental model is the durable part: **an app acts on your behalf by holding a scoped, revocable token that it earned through your explicit approval, not by holding your password.** Everything else is detail.
