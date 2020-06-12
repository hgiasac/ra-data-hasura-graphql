import { IntrospectedSchema, QueryBuilder, GraphQLDataProvider, IntrospectionOptions } from "./ra-data-graphql";
import {
  IntrospectionField,
  DocumentNode,
  ArgumentNode,
  IntrospectionObjectType,
  ASTNode,
  VariableDefinitionNode,
  IntrospectionType
} from "graphql";
import {
  GetListParams,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  GetListResult,
  GetOneResult,
  GetManyResult,
  GetManyReferenceResult
} from "ra-core";
import { HasuraFetchType } from "./fetchDataAction";
import { SubscriptionOptions } from "apollo-client";
import { Observable } from "apollo-client/util/Observable";

export type HasuraGraphQLResponse<T extends Record<string, any> = Record<string, any>> =
  { readonly data: T };

type BoolExp = Record<string, unknown>;

type FilterFieldExpOption<V = any> = (value: V) => BoolExp;
type FilterFunctionExpOption<P extends Record<string, any> = Record<string, any>> =
  (params: P) => BoolExp;

type FilterExpOptions
  = Record<string, FilterFieldExpOption>
  | FilterFunctionExpOption;

export type HasuraIntrospectionOptions = IntrospectionOptions & {
  readonly operationNames: { [Op in HasuraFetchType]?: (type: IntrospectionType) => string }
};

export type ResourceOptions = {
  readonly alias?: string
  readonly primaryKeys?: readonly string[]
  readonly filterExps?: FilterExpOptions
};

export type ResourceOptionsMap = Record<string, ResourceOptions>;

export type HasuraGraphQLProviderOptions = {
  readonly introspection: HasuraIntrospectionOptions
  readonly resourceOptions?: ResourceOptionsMap
  readonly subscription?: Partial<SubscriptionOptions<unknown>>
};

// BuildVariables interfaces
export type BuildVariablesHandler<
  P extends Record<string, any> = Record<string, any>,
  R extends Record<string, any> = Record<string, any>,
> = (
  resource: Record<string, any>,
  aorFetchType: HasuraFetchType,
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
  aorFetchType: HasuraFetchType,
  params: Record<string, any>,
  queryType: IntrospectionField,
  resourceOptions: ResourceOptions
) => Record<string, any>;

// GQLQueryBuilder
export type GQLQueryBuildHandler = (
  resource: Record<string, any>,
  aorFetchType: HasuraFetchType,
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
  aorFetchType: HasuraFetchType
) => readonly ArgumentNode[];

export type GQLQueryBuilder = (
  _introspectionResults: IntrospectedSchema,
  fieldsBuilder: FieldsBuilder,
  metaArgsBuilder: MetaArgsBuilder,
  argsBuilder: ArgsBuilder,
  apolloArgsBuilder: ApolloArgsBuilder
) => GQLQueryBuildHandler;

export type BuildGqlQueryImpl = (introspectionResults: IntrospectedSchema) => GQLQueryBuildHandler;

export type ResponseParserImpl = (
  introspectionResults: IntrospectedSchema
) => (aorFetchType: HasuraFetchType, resourceName: string, resourceOptions: ResourceOptions) => (
  res: HasuraGraphQLResponse
) => Record<string, any>;

export type HasuraQueryBuilder = (
  buildVariablesImpl: BuildVariablesImpl,
  buildGqlQueryImpl: BuildGqlQueryImpl,
  getResponseParserImpl: ResponseParserImpl
) => QueryBuilder<HasuraGraphQLProviderOptions>;

export type HasuraDataProvider = GraphQLDataProvider & {
  readonly watchList: (resource: string, params: GetListParams) => Observable<GetListResult>
  readonly watchOne: (resource: string, params: GetOneParams) => Observable<GetOneResult>
  readonly watchMany: (resource: string, params: GetManyParams) => Observable<GetManyResult>
  readonly watchManyReference: (resource: string, params: GetManyReferenceParams) => Observable<GetManyReferenceResult>
};
