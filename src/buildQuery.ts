import buildVariables, { BuildVariablesImpl } from "./buildVariables";
import buildGqlQuery, { BuildGqlQueryImpl } from "./buildGqlQuery";
import getResponseParser, { ResponseParserGetter } from "./getResponseParser";
import { IntrospectedSchema, FetchType } from "./ra-data-graphql";
import { ResourceOptionsMap } from "./types";
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

const buildQueryFactory = (
  buildVariablesImpl: BuildVariablesImpl,
  buildGqlQueryImpl: BuildGqlQueryImpl,
  getResponseParserImpl: ResponseParserGetter
) => (resourceOptions: ResourceOptionsMap = {}) => (introspectionResults: IntrospectedSchema) => {
  const knownResources = introspectionResults.resources.map((r) => r.type.name);

  return (aorFetchType: FetchType, resourceName: string, params) => {
    const resource = introspectionResults.resources.find(
      (r) => r.type.name === resourceName
    );
    const resourceOption = resourceOptions[resourceName];

    if (!resource) {
      if (knownResources.length) {
        throw new Error(
          `Unknown resource ${resourceName}. ` +
          "Make sure it has been declared on your server side schema, or the user has resource permission. " +
          `Known resources are ${knownResources.join(", ")}`
        );
      } else {
        throw new Error(
          `Unknown resource ${resourceName}. No resources were found. ` +
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
      resourceOption
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
      resourceOption
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
