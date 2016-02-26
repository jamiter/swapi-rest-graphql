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
  mapValues,
  mapKeys,
} from 'lodash';

import {
  schema
} from '/imports/swapi/schema.js';

const graphQLObjectTypes = mapValues(schema, (jsonSchema, k) => {
  return new GraphQLObjectType({
    name: jsonSchema.title,
    description: jsonSchema.description,
    fields: () => {
      return mapValues(jsonSchema.properties, (propertySchema) => {
        return {
          description: propertySchema.description,
          type: jsonSchemaTypeToGraphQL(propertySchema.type)
        };
      });
    }
  })
});

function jsonSchemaTypeToGraphQL(jsonSchemaType) {
  return {
    string: GraphQLString,
    date: GraphQLString,
    integer: GraphQLInt,

    // In SWAPI all arrays are reference URLs
    array: new GraphQLList(GraphQLString)
  }[jsonSchemaType];
}

/**
 * This is the type that will be the root of our query,
 * and the entry point into our schema.
 */
const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => {
    const plural = mapValues(graphQLObjectTypes, (type, typePluralName) => {
      return {
        type: new GraphQLList(type),
        description: `All ${typePluralName}.`,
        args: {
          page: { type: GraphQLInt }
        },
        resolve: (_, { page }) => {
          return fetchPageOfType(typePluralName, page);
        },
      };
    });

    const singular = mapValues(mapKeys(graphQLObjectTypes, (value, key) => {
      // Name the query people_one vehicles_one etc.
      // Think about naming later.
      console.log("KEY", key);
      return key + "_one";
    }), (type, typeQueryName) => {
      const restName = typeQueryName.split('_')[0];

      return {
        type: type,
        description: `One ${restName}.`,
        args: {
          id: { type: GraphQLString }
        },
        resolve: (_, { id }) => {
          return fetchOne(restName, id);
        },
      }
    });

    return {
      ...plural,
      ...singular
    };
  },
});

function fetchPageOfType(typePluralName, pageNumber) {
  const params = {};
  if (pageNumber) {
    params.page = pageNumber;
  };

  const response = HTTP.get(`http://swapi.co/api/${typePluralName}/`, { params });
  console.log("result", response.data);
  return response.data.results;
}

function fetchOne(restName, id) {
  const response = HTTP.get(`http://swapi.co/api/${restName}/${id}`);
  return response.data;
}

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
