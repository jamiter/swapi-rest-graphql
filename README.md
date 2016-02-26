Query the Star Wars API via GraphQL, simplest version.

Install with:

```
npm install
```

Run with:

```
npm start
```

Go to the following URL in your browser to see GraphiQL:

[http://localhost:3000/graphql](http://localhost:3000/graphql)

Here's an example of a query you can run:

```
{
  people {
    name,
    starships {
      name,
      length
    }
  }
}
```

### Points of interest:

1. Uses the SWAPI JSON schema as a starting point to avoid writing all of the resolvers and types manually
2. Uses [Facebook's DataLoader](https://github.com/facebook/dataloader) to cache results to avoid hitting the same endpoint multiple times
