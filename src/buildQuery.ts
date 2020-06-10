import buildVariables from "./buildVariables";
import buildGqlQuery from "./buildGqlQuery";
import getResponseParser, { ResponseParserGetter } from "./getResponseParser";
import { IntrospectedSchema, FetchType, QueryBuilder } from "./ra-data-graphql";
import { HasuraGraphQLProviderOptions, BuildGqlQueryImpl, BuildVariablesImpl } from "./types";
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY
} from "ra-core";

export type RAHasuraQueryBuilder = (
  buildVariablesImpl: BuildVariablesImpl,
  buildGqlQueryImpl: BuildGqlQueryImpl,
  getResponseParserImpl: ResponseParserGetter
) => QueryBuilder<HasuraGraphQLProviderOptions>;

export const buildQueryFactory: RAHasuraQueryBuilder = (
  buildVariablesImpl: BuildVariablesImpl,
  buildGqlQueryImpl: BuildGqlQueryImpl,
  getResponseParserImpl: ResponseParserGetter
) => (
  introspectionResults: IntrospectedSchema,
  extraOptions: HasuraGraphQLProviderOptions
) => {
  const resourceOptionsM = extraOptions && extraOptions.resourceOptions
    ? extraOptions.resourceOptions : {};

  const knownResources = introspectionResults.resources.map((r) => r.type.name);

  return (aorFetchType: FetchType, resourceName: string, params) => {
    const resourceOptions = resourceOptionsM[resourceName] || {};
    const resourceAlias = resourceOptions.alias || resourceName;

    const resource = introspectionResults.resources.find(
      (r) => r.type.name === resourceAlias
    );

    if (!resource) {
      const preMessage =
        `Unknown resource '${resourceName}'${resourceOptions.alias ? `, alias of '${resourceAlias}'` : ""}. `;
      if (knownResources.length) {
        throw new Error(
          `${preMessage}Make sure it has been declared on your server side schema, or the user has resource permission.`
          + ` Known resources are ${knownResources.join(", ")}`
        );
      } else {
        throw new Error(
          `${preMessage}No resources were found. ` +
          // eslint-disable-next-line max-len
          "Make sure it has been declared on your server side schema, or the user has resource permission."
        );
      }
    }

    const queryType = resource[aorFetchType];

    if (!queryType) {
      const throwError = (queryTy: string, sqlTy?: string): never => {
        throw new Error(
          `No ${queryTy} matching fetch type could be found for resource ${resource.type.name}. ${
          sqlTy ? `Maybe the current user doesn't have ${sqlTy} permission` : ""}`
        );
      };

      switch (aorFetchType) {
        case GET_LIST:
        case GET_ONE:
        case GET_MANY:
        case GET_MANY_REFERENCE:
          return throwError("query", "SELECT");
        case CREATE:
          return throwError("query", "INSERT");
        case UPDATE:
        case UPDATE_MANY:
          return throwError("query", "UPDATE");
        case DELETE:
        case DELETE_MANY:
          return throwError("query", "DELETE");
        default:
          return throwError("query or mutation");
      }
    }

    const variables = buildVariablesImpl(introspectionResults)(
      resource,
      aorFetchType,
      params,
      queryType,
      resourceOptions
    );
    const query = buildGqlQueryImpl(introspectionResults)(
      resource,
      aorFetchType,
      queryType,
      variables
    );
    const parseResponse = getResponseParserImpl(introspectionResults)(
      aorFetchType,
      resourceName,
      resourceOptions
    );

    return {
      query,
      variables,
      parseResponse
    };
  };
};

export default buildQueryFactory(
  buildVariables,
  buildGqlQuery,
  getResponseParser
);
