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
} from './swapi.js';

import rp from 'request-promise';

const graphQLObjectTypes = mapValues(schema, (jsonSchema, k) => {
  return new GraphQLObjectType({
    name: jsonSchema.title,
    description: jsonSchema.description,
    fields: () => {
      return mapValues(jsonSchema.properties, (propertySchema, propertyName) => {
        const value = {
          description: propertySchema.description,
          type: jsonSchemaTypeToGraphQL(propertySchema.type, propertyName)
        };

        if(propertySchema.type === 'array') {
          value.resolve = (root, args) => {
            const arrayOfUrls = root[propertyName];
            const arrayOfResults = arrayOfUrls.map(fetchOneFromUrl);
            return arrayOfResults;
          }
        }

        return value;
      });
    }
  })
});

function jsonSchemaTypeToGraphQL(jsonSchemaType, schemaName) {
  if (jsonSchemaType === "array") {
    if (graphQLObjectTypes[schemaName]) {
      return new GraphQLList(graphQLObjectTypes[schemaName]);
    } else {
      const translated = {
        pilots: "people",
        characters: "people",
        residents: "people"
      }[schemaName];

      if (! translated) {
        throw new Error(`no type ${schemaName}`);
      }

      const type = graphQLObjectTypes[translated];

      if (! type) {
        throw new Error(`no GraphQL type ${schemaName}`);
      }

      return new GraphQLList(type);
    }
  }

  return {
    string: GraphQLString,
    date: GraphQLString,
    integer: GraphQLInt,
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

  return _fetchUrl(`http://swapi.co/api/${typePluralName}/`, { params }).then((data) => {
    // Paginated results have a different shape
    return data.results;
  });
}

function fetchOne(restName, id) {
  return _fetchUrl(`http://swapi.co/api/${restName}/${id}`);
}

function fetchOneFromUrl(url) {
  return _fetchUrl(url);
}

function _fetchUrl(url, options) {
  return rp({
    uri: url,
    json: true,
    qs: options && options.params,
    transform: (res) => {
      // uncomment below to log all results
      // console.log(res);
      return res;
    }
  });
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
