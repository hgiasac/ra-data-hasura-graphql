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
  IntrospectionField,
  DocumentNode,
  IntrospectionObjectType,
  IntrospectionInputValue
} from "graphql";
import * as gqlTypes from "graphql-ast-types-browser";
import { isList, isRequired, getFinalType } from "./utils";
import { IntrospectedSchema, FetchType } from "./ra-data-graphql";
import {
  ArgsBuilder,
  MetaArgsBuilder,
  GQLQueryBuilder,
  ApolloArgsBuilder,
  FieldsBuilder,
  BuildGqlQueryImpl
} from "./types";

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
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            buildFields(introspectionResults)(linkedType as IntrospectionObjectType)
          ),
          gqlTypes.namedType(gqlTypes.name(type.name))
        )
      ];
    }, []);

export const buildFields: FieldsBuilder = () => (type) =>
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sortField, sortOrder, ...metaVariables } = variables;
  const apolloArgs = apolloArgsBuilder(queryType, variables);
  const args = argsBuilder(queryType, variables);
  const metaArgs = metaArgsBuilder(queryType, metaVariables, aorFetchType);
  const fields = fieldsBuilder(_introspectionResults)(resource.type);

  if ([GET_LIST, GET_MANY, GET_MANY_REFERENCE].includes(aorFetchType)) {
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
          )
        ].concat(
          // GET_MANY doesn't need total count
          aorFetchType === GET_MANY ? [] : gqlTypes.field(
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
        )),
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

const defaultBuildGqlQuery: BuildGqlQueryImpl = (introspectionResults) =>
  buildGqlQuery(introspectionResults, buildFields, buildMetaArgs, buildArgs, buildApolloArgs);

export default defaultBuildGqlQuery;
