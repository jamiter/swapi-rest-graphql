import { Schema } from '../imports/schema/schema.js';
import graphqlHTTP from 'express-graphql';
import proxyMiddleware from 'http-proxy-middleware';
import express from 'express';

// For side effect of registering server methods
import '../imports/schema/methods.js';

const app = express();

app.use('/graphql', graphqlHTTP({ schema: Schema, graphiql: true }));

app.listen(3005);

WebApp.rawConnectHandlers.use(proxyMiddleware('http://localhost:3005/graphql'));
