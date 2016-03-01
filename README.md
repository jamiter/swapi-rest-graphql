A GraphQL endpoint for the Star Wars API, generated from the [JSON Schema
provided](http://swapi.co/documentation#schema).

## Running

Install with:

```
npm install
```

Run with:

```
npm start
```

## Running queries

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

The server console will print a list of all of the URLs fetched. Thanks to
[dataloader](https://github.com/facebook/dataloader), we only request each URL once instead of
loading it for each subtree of the query.
