https://www.howtographql.com/graphql-python/0-introduction/
https://www.howtographql.com/basics/2-core-concepts/

https://www.moesif.com/blog/

https://www.howtographql.com/graphql-python/3-mutations/


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


https://docs.graphene-python.org/en/latest/types/mutations/


Graphene does not have any rest api basd stuff ...
Starlete .. takes a schema ... and exposes it as a rest api ...
https://www.starlette.io/graphql/


- [ ] Make an example ... without even rest APIs! ... 
    - https://docs.graphene-python.org/en/latest/quickstart/


https://hasura.io/docs/1.0/graphql/core/queries/multiple-queries.html


https://medium.com/paypal-engineering/graphql-resolvers-best-practices-cd36fdbcef55