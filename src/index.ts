import buildDataProvider from "./ra-data-graphql";
import {
  GET_ONE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE_MANY,
  DataProvider
} from "ra-core";
import buildQuery from "./buildQuery";
import buildGqlQuery, { buildFields, buildMetaArgs, buildArgs, buildApolloArgs } from "./buildGqlQuery";
import getResponseParser from "./getResponseParser";
import buildVariables from "./buildVariables";
import { IntrospectionType } from "graphql";
import { HasuraGraphQLProviderOptions } from "./types";
import { buildPrimaryKeyExp, buildPrimaryKeyIdExp } from "./utils";
export {
  buildQuery,
  buildGqlQuery,
  getResponseParser,
  buildVariables,
  buildFields,
  buildMetaArgs,
  buildArgs,
  buildApolloArgs,
  buildPrimaryKeyExp,
  buildPrimaryKeyIdExp
};

export * from "./types";

function hasuraGraphQLOptions<Options extends Record<string, any> = Record<string, any>>(
  options: Options & Partial<HasuraGraphQLProviderOptions>
): Partial<HasuraGraphQLProviderOptions> {
  const { resourceOptions, introspection, ...rest } = options;

  return {
    buildQuery: buildQuery(resourceOptions),
    introspection: {
      ...introspection,
      operationNames: {
        [GET_LIST]: (resource) => resource.name,
        [GET_ONE]: (resource) => resource.name,
        [GET_MANY]: (resource) => resource.name,
        [GET_MANY_REFERENCE]: (resource) => resource.name,
        [CREATE]: (resource: IntrospectionType) => `insert_${resource.name}`,
        [UPDATE]: (resource: IntrospectionType) => `update_${resource.name}`,
        [UPDATE_MANY]: (resource: IntrospectionType) => `update_${resource.name}`,
        [DELETE]: (resource: IntrospectionType) => `delete_${resource.name}`,
        [DELETE_MANY]: (resource: IntrospectionType) => `delete_${resource.name}`,
        ...(introspection && introspection.operationNames ? introspection.operationNames : {})
      }
    },
    ...rest
  };
}

export default <Options extends Record<string, any> = Record<string, any>>(
  options: Options & Partial<HasuraGraphQLProviderOptions>
): Promise<DataProvider> =>
  buildDataProvider(hasuraGraphQLOptions(options));
