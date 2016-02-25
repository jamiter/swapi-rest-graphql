/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInputObjectType,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  Mongo
} from 'meteor/mongo';

import {
  getDepObj,
  depInvalidated
} from './deps.js';

export const Lists = new Mongo.Collection('Lists');
export const Tasks = new Mongo.Collection('Tasks');

global.Tasks = Tasks;

/**
 * We get the node interface and field from the Relay library.
 *
 * The first method defines the way we resolve an ID to its object.
 * The second defines the way we resolve an object to its GraphQL type.
 */
const {
  nodeInterface,
  nodeField
} = nodeDefinitions(getObjectFromGlobalId, getGraphQLTypeFromObject);

function getObjectFromGlobalId(globalId) {
  const {typeName, id} = fromGlobalId(globalId);

  if (typeName === 'List') {
    return Lists.findOne(id);
  } else if (typeName === 'Task') {
    return Tasks.findOne(id);
  } else {
    return null;
  }
}

function getGraphQLTypeFromObject(obj) {
  return TaskType;

  if (obj instanceof User) {
    return userType;
  } else if (obj instanceof Widget)  {
    return widgetType;
  } else {
    return null;
  }
}

const TaskType = new GraphQLObjectType({
  name: 'Task',
  description: 'A task in a todo list.',
  fields: () => ({
    id: globalMongoIdField('Task'),
    text: {
      type: GraphQLString,
      description: 'The content of the task.',
    },
    completed: {
      type: GraphQLBoolean,
      description: 'Whether the task has been completed.',
    },
    _dep: mongoDepField()
  }),
  interfaces: [nodeInterface],
});

const ListType = new GraphQLObjectType({
  name: 'List',
  description: 'A todo list.',
  fields: () => ({
    id: globalMongoIdField('List'),
    _id: {
      type: GraphQLString,
      description: 'The name of the list.',
    },
    name: {
      type: GraphQLString,
      description: 'The name of the list.',
    },
    tasks: {
      type: new GraphQLList(TaskType),
      description: 'The tasks in this todo list.',
      resolve: (list, args) => {
        return Tasks.find({ listId: list._id }).fetch();
      },
    },
    _dep: mongoDepField()
  }),
  interfaces: [nodeInterface],
});

const DepType = new GraphQLObjectType({
  name: 'Dep',
  fields: () => ({
    key: {
      type: GraphQLString
    },
    version: {
      type: GraphQLInt
    }
  })
});

const DepInputType = new GraphQLInputObjectType({
  name: 'InputDep',
  fields: () => ({
    key: {
      type: GraphQLString
    },
    version: {
      type: GraphQLInt
    }
  })
});

// /**
//  * Define your own connection types here
//  */
// const {connectionType: widgetConnection} =
//   connectionDefinitions({name: 'Widget', nodeType: widgetType});


/**
 * This is the type that will be the root of our query,
 * and the entry point into our schema.
 */
const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    allLists: {
      type: new GraphQLList(ListType),
      description: 'All lists.',
      resolve: () => {
        return Lists.find().fetch();
      },
    },
    deps: {
      type: new GraphQLList(DepType),
      description: 'Check for invalidated deps.',
      args: {
        deps: {
          type: new GraphQLList(DepInputType),
          description: 'A list of dep tokens to check for invalidation.'
        }
      },
      resolve: (obj, args) => {
        return args.deps.filter(depInvalidated);
      }
    }
  }),
});

// /**
//  * This is the type that will be the root of our mutations,
//  * and the entry point into performing writes in our schema.
//  */
// const mutationType = new GraphQLObjectType({
//   name: 'Mutation',
//   fields: () => ({
//     // Add your own mutations here
//   })
// });


/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const Schema = new GraphQLSchema({
  query: queryType,
  // Uncomment the following after adding some mutation fields:
  // mutation: mutationType
});

function globalIdField(
  typeName?: ?string,
  idFetcher?: (object: any, info: GraphQLResolveInfo) => string
): GraphQLFieldConfig {
  return {
    name: 'id',
    description: 'The ID of an object',
    type: new GraphQLNonNull(GraphQLID),
    resolve: (obj, args, info) => toGlobalId(
      typeName != null ? typeName : info.parentType.name,
      idFetcher ? idFetcher(obj, info) : obj.id
    )
  };
}

function mongoDepField() {
  return {
    name: 'dep',
    description: 'Dependency key.',
    type: DepType,
    resolve: (obj) => {
      return getDepObj(obj._id);
    }
  }
}

function globalMongoIdField(typeName) {
  return globalIdField(typeName, mongoIdFetcher);
}

function mongoIdFetcher(obj) {
  return obj._id;
}

function toGlobalId(typeName, id) {
  return typeName + ':' + id;
}

function fromGlobalId(globalId) {
  const [typeName, id] = globalId.split(':');
  return {typeName, id};
}
