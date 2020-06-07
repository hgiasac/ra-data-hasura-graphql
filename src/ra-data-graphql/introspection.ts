import ApolloClient from "apollo-client";
import {
  IntrospectionField,
  IntrospectionObjectType,
  IntrospectionQuery,
  IntrospectionType,
  getIntrospectionQuery,
  IntrospectionSchema
} from "graphql";
import gql from "graphql-tag";
import { GET_LIST, GET_ONE } from "ra-core";

import { ALL_TYPES, FetchType } from "./constants";

export const filterTypesByIncludeExclude = ({
  include,
  exclude
}: Pick<IntrospectionOptions, "include" | "exclude">): ((
    type: IntrospectionType
  ) => boolean) => {
  if (Array.isArray(include)) {
    return (type) => include.includes(type.name);
  }

  if (typeof include === "function") {
    return (type) => include(type);
  }

  if (Array.isArray(exclude)) {
    return (type) => !exclude.includes(type.name);
  }

  if (typeof exclude === "function") {
    return (type) => !exclude(type);
  }

  return () => true;
};

export type IntrospectionOptions = {
  readonly schema?: IntrospectionSchema
  readonly operationNames: { [Op in FetchType]?: (type: IntrospectionType) => string }
  readonly include?: Filter
  readonly exclude?: Filter
};

type Filter = readonly string[] | ((type: IntrospectionType) => boolean);

export type IntrospectedSchema = {
  readonly types: readonly IntrospectionType[]
  readonly queries: readonly IntrospectionField[]
  readonly resources: readonly IntrospectedResource[]
  readonly schema: IntrospectionSchema
};

export type IntrospectedResource = {
  readonly type: IntrospectionType
  readonly GET_LIST: IntrospectionField
  readonly GET_ONE: IntrospectionField
} & Record<
Exclude<FetchType, "GET_LIST" | "GET_ONE">,
IntrospectionField | undefined
>;

/**
 * @param {ApolloClient} client The Apollo client
 * @param {Object} options The introspection options
 */
export default async (
  client: ApolloClient<unknown>,
  options: IntrospectionOptions
): Promise<IntrospectedSchema> => {
  const schema = options.schema
    ? options.schema
    : await client
      .query<IntrospectionQuery>({
      fetchPolicy: "network-only",
      query: gql`
                      ${getIntrospectionQuery()}
                  `
    })
      .then(({ data: { __schema } }) => __schema);

  const queries: readonly IntrospectionField[] = schema.types.reduce((acc, type) => {
    if (
      type.name !== schema.queryType.name &&
            type.name !== schema.mutationType.name
    )
      return acc;

    const { fields = [] } = type as IntrospectionObjectType;

    return [...acc, ...fields];
  }, []);

  const types = schema.types.filter(
    (type) =>
      type.name !== schema.queryType.name &&
            type.name !== schema.mutationType.name
  );

  const isResource = (type: IntrospectionType): boolean =>
    queries.some(
      (query) => query.name === options.operationNames[GET_LIST](type)
    ) &&
        queries.some(
          (query) => query.name === options.operationNames[GET_ONE](type)
        );

  const buildResource = (type: IntrospectionType): IntrospectedResource =>
    ALL_TYPES.reduce(
      (acc, aorFetchType) => ({
        ...acc,
        [aorFetchType]: queries.find(
          (query) =>
            options.operationNames[aorFetchType] &&
                        query.name ===
                            options.operationNames[aorFetchType](type)
        )
      }),
      { type } as IntrospectedResource
    );

  const potentialResources = types.filter(isResource);
  const filteredResources = potentialResources.filter(
    filterTypesByIncludeExclude(options)
  );
  const resources = filteredResources.map(buildResource);

  return {
    types,
    queries,
    resources,
    schema
  };
};
