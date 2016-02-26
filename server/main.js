import { Schema } from './schema.js';
import graphqlHTTP from 'express-graphql';
import express from 'express';

const app = express();

app.use('/graphql', graphqlHTTP({ schema: Schema, graphiql: true }));

app.listen(3000);
