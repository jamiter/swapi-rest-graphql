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

import DataLoader from 'dataloader';

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
            const arrayOfResults = arrayOfUrls.map(restLoader.load.bind(restLoader));
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
  let url = `http://swapi.co/api/${typePluralName}/`;
  if (pageNumber) {
    url += `?page=${pageNumber}`;
  };

  return restLoader.load(url).then((data) => {
    // Paginated results have a different shape
    return data.results;
  });
}

function fetchOne(restName, id) {
  return restLoader.load(`http://swapi.co/api/${restName}/${id}`);
}

const restLoader = new DataLoader((urls) => {
  console.log("Fetching batch:", urls);
  return Promise.all(urls.map((url) => {
    return rp({
      uri: url,
      json: true
    });
  }));
});

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const Schema = new GraphQLSchema({
  query: queryType,
});
