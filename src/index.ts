import buildDataProvider, { GraphQLProviderOptions, FetchType } from "./ra-data-graphql";
import {
  GET_ONE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE_MANY
} from "ra-core";
import buildQuery from "./buildQuery";
import buildGqlQuery, { buildFields, buildMetaArgs, buildArgs, buildApolloArgs } from "./buildGqlQuery";
import getResponseParser from "./getResponseParser";
import buildVariables from "./buildVariables";
import { IntrospectionType } from "graphql";
import { HasuraGraphQLProviderOptions, HasuraDataProvider } from "./types";
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
import {
  WATCH_ONE,
  WATCH_LIST,
  WATCH_MANY,
  WATCH_MANY_REFERENCE,
  HasuraFetchType,
  sanitizeHasuraFetchType
} from "./fetchDataAction";
import { Observable } from "apollo-client/util/Observable";
export * from "./fetchDataAction";
export * from "./types";

type ProviderOptions = HasuraGraphQLProviderOptions & GraphQLProviderOptions;

function hasuraGraphQLOptions<Options extends Record<string, any> = Record<string, any>>(
  options: Options & Partial<ProviderOptions>
): Partial<ProviderOptions> {
  const { introspection, ...rest } = options;

  return {
    buildQuery,
    introspection: {
      ...introspection,
      operationNames: {
        [GET_LIST]: (resource) => resource.name,
        [GET_ONE]: (resource) => resource.name,
        [GET_MANY]: (resource) => resource.name,
        [GET_MANY_REFERENCE]: (resource) => resource.name,
        [WATCH_LIST]: (resource) => resource.name,
        [WATCH_ONE]: (resource) => resource.name,
        [WATCH_MANY]: (resource) => resource.name,
        [WATCH_MANY_REFERENCE]: (resource) => resource.name,
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
  options: Options & Partial<ProviderOptions>
): Promise<HasuraDataProvider> =>
  buildDataProvider(hasuraGraphQLOptions(options))
    .then((dataProvider): any => {

      // require Apollo client in options
      if (!options || !options.client) {
        throw new Error("Apollo client option is required");
      }
      const { client, buildQuery: buildQueryImpl, ...otherOptions } = options as ProviderOptions;

      const watchHandler = (aorFetchType: HasuraFetchType, resource: string, params: any): Observable<any> => {
        const buildQueryFn = buildQueryImpl(dataProvider.introspectedSchema, otherOptions);
        const { parseResponse = null, ...query } = buildQueryFn(aorFetchType as FetchType, resource, params);

        if (!parseResponse) {
          throw new Error(
            `Missing '${sanitizeHasuraFetchType(aorFetchType)}' in the override option`
          );
        }

        const apolloQuery = {
          ...query,
          fetchPolicy: "network-only",
          ...getOptions(otherOptions.subscription, aorFetchType, resource)
        };

        return client
          .subscribe(apolloQuery)
          .map((response) => parseResponse(response));

      };

      return {
        ...dataProvider,
        watchList: (resource, params) => watchHandler(WATCH_LIST, resource, params),
        watchMany: (resource, params) => watchHandler(WATCH_MANY, resource, params),
        watchOne: (resource, params) => watchHandler(WATCH_ONE, resource, params),
        watchManyReference: (resource, params) => watchHandler(WATCH_MANY_REFERENCE, resource, params)
      };
    });

const getOptions = (options, aorFetchType, resource): any => {
  if (typeof options === "function") {
    return options(resource, aorFetchType);
  }

  return options;
};
