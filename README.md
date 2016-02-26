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
