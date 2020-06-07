/* eslint-disable max-lines */
import {
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE_MANY
} from "ra-core";
import {
  TypeKind,
  IntrospectionTypeRef,
  ASTNode,
  InlineFragmentNode,
  ArgumentNode,
  IntrospectionField,
  DocumentNode,
  IntrospectionObjectType,
  VariableDefinitionNode,
  IntrospectionInputValue
} from "graphql";
import * as gqlTypes from "graphql-ast-types-browser";
import { isList, isRequired, getFinalType } from "./utils";
import { IntrospectedSchema, FetchType } from "./ra-data-graphql";

export const buildFragments = (introspectionResults: IntrospectedSchema) =>
  (possibleTypes: readonly IntrospectionTypeRef[]): readonly InlineFragmentNode[] =>
    possibleTypes.reduce((acc, possibleType) => {
      const type = getFinalType(possibleType);

      const linkedType = introspectionResults.types.find(
        (t) => t.name === type.name
      );

      return [
        ...acc,
        gqlTypes.inlineFragment(
          gqlTypes.selectionSet(
            buildFields(linkedType as IntrospectionObjectType)
          ),
          gqlTypes.namedType(gqlTypes.name(type.name))
        )
      ];
    }, []);

export type FieldsBuilder = (type: IntrospectionObjectType) => readonly ASTNode[];

export const buildFields: FieldsBuilder = (type) =>
  type.fields.reduce((acc, field) => {
    const finalType = getFinalType(field.type);

    if (finalType.name.startsWith("_")) {
      return acc;
    }

    if (finalType.kind !== TypeKind.OBJECT && finalType.kind !== TypeKind.INTERFACE) {
      return [...acc, gqlTypes.field(gqlTypes.name(field.name))];
    }

    return acc;
  }, []);

export const getArgType = (arg: IntrospectionField | IntrospectionInputValue): ASTNode => {
  const type = getFinalType(arg.type);
  const required = isRequired(arg.type);
  const list = isList(arg.type);

  if (required) {
    if (list) {
      return gqlTypes.nonNullType(
        gqlTypes.listType(
          gqlTypes.nonNullType(
            gqlTypes.namedType(gqlTypes.name(type.name))
          )
        )
      );
    }

    return gqlTypes.nonNullType(
      gqlTypes.namedType(gqlTypes.name(type.name))
    );
  }

  if (list) {
    return gqlTypes.listType(gqlTypes.namedType(gqlTypes.name(type.name)));
  }

  return gqlTypes.namedType(gqlTypes.name(type.name));
};

export type ArgsBuilder = (query: IntrospectionField, variables: Record<string, any>) => readonly ArgumentNode[];
export const buildArgs: ArgsBuilder = (query, variables) => {
  if (query.args.length === 0) {
    return [];
  }

  const validVariables = Object.keys(variables).filter(
    (k) => typeof variables[k] !== "undefined"
  );

  const args = query.args
    .filter((a) => validVariables.includes(a.name))
    .reduce(
      (acc, arg) => [
        ...acc,
        gqlTypes.argument(
          gqlTypes.name(arg.name),
          gqlTypes.variable(gqlTypes.name(arg.name))
        )
      ],
      []
    );

  return args;
};

export type MetaArgsBuilder =  (
  query: IntrospectionField,
  variables: Record<string, any>,
  aorFetchType: FetchType
) => readonly ArgumentNode[];

export const buildMetaArgs: MetaArgsBuilder = (query, variables, aorFetchType) => {
  if (query.args.length === 0) {
    return [];
  }

  const validVariables = Object.keys(variables).filter((k) => {
    if (
      aorFetchType === GET_LIST ||
            aorFetchType === GET_MANY ||
            aorFetchType === GET_MANY_REFERENCE
    ) {
      return (
        typeof variables[k] !== "undefined" &&
                k !== "limit" &&
                k !== "offset"
      );
    }

    return typeof variables[k] !== "undefined";
  });

  const args = query.args
    .filter((a) => validVariables.includes(a.name))
    .reduce(
      (acc, arg) => [
        ...acc,
        gqlTypes.argument(
          gqlTypes.name(arg.name),
          gqlTypes.variable(gqlTypes.name(arg.name))
        )
      ],
      []
    );

  return args;
};

export type ApolloArgsBuilder = (
  query: IntrospectionField,
  variables: Record<string, any>
) => readonly VariableDefinitionNode[];

export const buildApolloArgs: ApolloArgsBuilder = (query, variables) => {
  if (query.args.length === 0) {
    return [];
  }

  const validVariables = Object.keys(variables).filter(
    (k) => typeof variables[k] !== "undefined"
  );

  const args = query.args
    .filter((a) => validVariables.includes(a.name))
    .reduce((acc, arg) => [
      ...acc,
      gqlTypes.variableDefinition(
        gqlTypes.variable(gqlTypes.name(arg.name)),
        getArgType(arg)
      )
    ], []);

  return args;
};

export type GQLQueryBuildHandler = (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  queryType: IntrospectionField,
  variables: Record<string, any>
) => DocumentNode;

export type GQLQueryBuilder = (
  _introspectionResults: IntrospectedSchema,
  fieldsBuilder: FieldsBuilder,
  metaArgsBuilder: MetaArgsBuilder,
  argsBuilder: ArgsBuilder,
  apolloArgsBuilder: ApolloArgsBuilder
) => GQLQueryBuildHandler;

export const buildGqlQuery: GQLQueryBuilder = (
  _introspectionResults,
  fieldsBuilder,
  metaArgsBuilder,
  argsBuilder,
  apolloArgsBuilder
) => (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  queryType: IntrospectionField,
  variables: Record<string, any>
): DocumentNode => {
  const { sortField, sortOrder, ...metaVariables } = variables;
  const apolloArgs = apolloArgsBuilder(queryType, variables);
  const args = argsBuilder(queryType, variables);
  const metaArgs = metaArgsBuilder(queryType, metaVariables, aorFetchType);
  const fields = fieldsBuilder(resource.type);
  if (
    aorFetchType === GET_LIST ||
        aorFetchType === GET_MANY ||
        aorFetchType === GET_MANY_REFERENCE
  ) {
    return gqlTypes.document([
      gqlTypes.operationDefinition(
        "query",
        gqlTypes.selectionSet([
          gqlTypes.field(
            gqlTypes.name(queryType.name),
            gqlTypes.name("items"),
            args,
            null,
            gqlTypes.selectionSet(fields)
          ),
          gqlTypes.field(
            gqlTypes.name(`${queryType.name}_aggregate`),
            gqlTypes.name("total"),
            metaArgs,
            null,
            gqlTypes.selectionSet([
              gqlTypes.field(
                gqlTypes.name("aggregate"),
                null,
                null,
                null,
                gqlTypes.selectionSet([
                  gqlTypes.field(gqlTypes.name("count"))
                ])
              )
            ])
          )
        ]),
        gqlTypes.name(queryType.name),
        apolloArgs
      )
    ]);
  }

  if (
    aorFetchType === CREATE ||
        aorFetchType === UPDATE ||
        aorFetchType === UPDATE_MANY ||
        aorFetchType === DELETE ||
        aorFetchType === DELETE_MANY
  ) {
    return gqlTypes.document([
      gqlTypes.operationDefinition(
        "mutation",
        gqlTypes.selectionSet([
          gqlTypes.field(
            gqlTypes.name(queryType.name),
            gqlTypes.name("data"),
            args,
            null,
            gqlTypes.selectionSet([
              gqlTypes.field(
                gqlTypes.name("returning"),
                null,
                null,
                null,
                gqlTypes.selectionSet(fields)
              )
            ])
          )
        ]),
        gqlTypes.name(queryType.name),
        apolloArgs
      )
    ]);
  }

  return gqlTypes.document([
    gqlTypes.operationDefinition(
      "query",
      gqlTypes.selectionSet([
        gqlTypes.field(
          gqlTypes.name(queryType.name),
          gqlTypes.name("returning"),
          args,
          null,
          gqlTypes.selectionSet(fields)
        )
      ]),
      gqlTypes.name(queryType.name),
      apolloArgs
    )
  ]);
};

export type BuildGqlQueryImpl = (introspectionResults: IntrospectedSchema) => GQLQueryBuildHandler;
const defaultBuildGqlQuery: BuildGqlQueryImpl = (introspectionResults) =>
  buildGqlQuery(introspectionResults, buildFields, buildMetaArgs, buildArgs, buildApolloArgs);

export default defaultBuildGqlQuery;
