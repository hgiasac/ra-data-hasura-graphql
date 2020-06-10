import { IntrospectedSchema, FetchType } from "./ra-data-graphql";
import {
  IntrospectionField,
  DocumentNode,
  ArgumentNode,
  IntrospectionObjectType,
  ASTNode,
  VariableDefinitionNode
} from "graphql";

export type HasuraGraphQLResponse<T extends Record<string, any> = Record<string, any>> =
  { readonly data: T };

type BoolExp = Record<string, unknown>;

type FilterFieldExpOption<V = any> = (value: V) => BoolExp;
type FilterFunctionExpOption<P extends Record<string, any> = Record<string, any>> =
  (params: P) => BoolExp;

type FilterExpOptions
  = Record<string, FilterFieldExpOption>
  | FilterFunctionExpOption;

export type ResourceOptions = {
  readonly alias?: string
  readonly primaryKeys?: readonly string[]
  readonly filterExps?: FilterExpOptions
};

export type ResourceOptionsMap = Record<string, ResourceOptions>;

export type HasuraGraphQLProviderOptions = {
  readonly resourceOptions?: ResourceOptionsMap
};

export type BuildVariablesHandler<
  P extends Record<string, any> = Record<string, any>,
  R extends Record<string, any> = Record<string, any>,
> = (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: P,
  queryType: IntrospectionField,
  resourceOptions: ResourceOptions
) => R;

export type VariablesBuilder<
  P extends Record<string, any> = Record<string, any>,
  R extends Record<string, any> = Record<string, any>,
> = (introspectionResults: IntrospectedSchema) => BuildVariablesHandler<P, R>;

export type BuildVariablesImpl = (introspectionResults: IntrospectedSchema) => (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: Record<string, any>,
  queryType: IntrospectionField,
  resourceOptions: ResourceOptions
) => Record<string, any>;

// GQLQueryBuilder
export type GQLQueryBuildHandler = (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  queryType: IntrospectionField,
  variables: Record<string, any>
) => DocumentNode;

export type ApolloArgsBuilder = (
  query: IntrospectionField,
  variables: Record<string, any>
) => readonly VariableDefinitionNode[];

export type ArgsBuilder = (query: IntrospectionField, variables: Record<string, any>) => readonly ASTNode[];

export type FieldsBuilder =
  (introspectionResults: IntrospectedSchema) => (type: IntrospectionObjectType) => readonly ASTNode[];

export type MetaArgsBuilder =  (
  query: IntrospectionField,
  variables: Record<string, any>,
  aorFetchType: FetchType
) => readonly ArgumentNode[];

export type GQLQueryBuilder = (
  _introspectionResults: IntrospectedSchema,
  fieldsBuilder: FieldsBuilder,
  metaArgsBuilder: MetaArgsBuilder,
  argsBuilder: ArgsBuilder,
  apolloArgsBuilder: ApolloArgsBuilder
) => GQLQueryBuildHandler;

export type BuildGqlQueryImpl = (introspectionResults: IntrospectedSchema) => GQLQueryBuildHandler;
