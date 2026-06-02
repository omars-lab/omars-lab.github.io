---
slug: /software-development/backend-development/tinkering/tinker-graphql
title: 'Tinkering with GraphQL'
description: 'Experiments and learning notes for GraphQL implementation using Python and Graphene'
authors: [oeid]
tags: [graphql, python, graphene, mutations, resolvers, experiments, tinkering]
date: 2025-01-31T10:00
draft: true
---

[howtographql.com — 0 Introduction](https://www.howtographql.com/graphql-python/0-introduction/)
[howtographql.com — 2 Core Concepts](https://www.howtographql.com/basics/2-core-concepts/)

[moesif.com — Blog](https://www.moesif.com/blog/)

[howtographql.com — 3 Mutations](https://www.howtographql.com/graphql-python/3-mutations/)


# Mutations ...
class CreateLink(graphene.Mutation):
    
    # Return Types ...
    id = graphene.Int()
    url = graphene.String()
    description = graphene.String()
    posted_by = graphene.Field(UserType)
    
    # Argument Types ...
    class Arguments:
        url = graphene.String()
        description = graphene.String()

    # Actual Method ... 
    def mutate(self, info, url, description):
        user = info.context.user or None

        link = Link(
            url=url,
            description=description,
            posted_by=user,
        )
        link.save()

        return CreateLink(
            id=link.id,
            url=link.url,
            description=link.description,
            posted_by=link.posted_by,
        )

    We can piggy back on resolvers for the return types! ... 

# Not that complicated ....


- [ ] Make an example that clearly shows the power of graphql / recursive lookups ...
    Still same amount of db calls ... unless there is an optimizer ...


[docs.graphene-python.org — Mutations](https://docs.graphene-python.org/en/latest/types/mutations/)


Graphene does not have any rest api basd stuff ...
Starlete .. takes a schema ... and exposes it as a rest api ...
[starlette.io — Graphql](https://www.starlette.io/graphql/)


- [ ] Make an example ... without even rest APIs! ... 
    - [docs.graphene-python.org — Quickstart](https://docs.graphene-python.org/en/latest/quickstart/)


[hasura.io — Multiple Queries](https://hasura.io/docs/1.0/graphql/core/queries/multiple-queries.html)


[Medium — Graphql Resolvers Best Practices Cd36fdbcef55](https://medium.com/paypal-engineering/graphql-resolvers-best-practices-cd36fdbcef55)