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
  GetManyReferenceResult,
  UpdateParams,
  UpdateManyParams,
  CreateParams,
  DeleteParams,
  DeleteManyParams,
  UpdateResult,
  UpdateManyResult,
  CreateResult,
  DeleteResult,
  DeleteManyResult
} from "ra-core";
import { HasuraFetchType } from "./fetchDataAction";
import ApolloClient, { SubscriptionOptions } from "apollo-client";
import { Observable } from "apollo-client/util/Observable";

type BoolExp = Record<string, unknown>;

type FilterFieldExpOption<V = any> = (value: V) => BoolExp;
type FilterFunctionExpOption<P extends Record<string, any> = Record<string, any>> =
  (params: P) => BoolExp;

type FilterExpOptions
  = Record<string, FilterFieldExpOption>
  | FilterFunctionExpOption;

export type HasuraGraphQLResponse<T extends Record<string, any> = Record<string, any>> =
  { readonly data: T };

export type GetListRawResult<I extends Record<string, any> = Record<string, any>> = HasuraGraphQLResponse<{
  readonly items: readonly I[]
  readonly total: {
    readonly aggregate: {
      readonly count: number
    }
  }
}>;
export type GetManyReferenceRawResult<I extends Record<string, any> = Record<string, any>> = GetListRawResult<I>;
export type WatchListRawResult<I extends Record<string, any> = Record<string, any>> = GetListRawResult<I>;
export type WatchManyReferenceRawResult<I extends Record<string, any> = Record<string, any>> = GetListRawResult<I>;
export type GetManyRawResult<I extends Record<string, any> = Record<string, any>> = HasuraGraphQLResponse<{
  readonly items: readonly I[]
}>;
export type WatchManyRawResult<I extends Record<string, any> = Record<string, any>> = GetManyRawResult<I>;
export type GetOneRawResult<I extends Record<string, any> = Record<string, any>> = HasuraGraphQLResponse<{
  readonly returning: readonly I[]
}>;
export type WatchOneRawResult<I extends Record<string, any> = Record<string, any>> = GetOneRawResult<I>;
export type CreateRawResult<I extends Record<string, any> = Record<string, any>> = HasuraGraphQLResponse<{
  readonly data: {
    readonly returning: readonly I[]
  }
}>;
export type UpdateRawResult<I extends Record<string, any> = Record<string, any>> = CreateRawResult<I>;
export type DeleteRawResult<I extends Record<string, any> = Record<string, any>> = CreateRawResult<I>;
export type UpdateManyRawResult<I extends Record<string, any> = Record<string, any>> = CreateRawResult<I>;
export type DeleteManyRawResult<I extends Record<string, any> = Record<string, any>> = CreateRawResult<I>;

export type WatchListParams = GetListParams;
export type WatchOneParams = GetOneParams;
export type WatchManyParams = GetManyParams;
export type WatchManyReferenceParams = GetManyReferenceParams;
export type WatchListResult = GetListResult;
export type WatchOneResult = GetOneResult;
export type WatchManyResult = GetManyResult;
export type WatchManyReferenceResult = GetManyReferenceResult;

export type ParseReponseInput
  = GetListRawResult
  | GetOneRawResult
  | GetManyRawResult
  | GetManyReferenceRawResult
  | CreateRawResult
  | UpdateRawResult
  | UpdateManyRawResult
  | DeleteRawResult
  | DeleteManyRawResult
  | WatchManyRawResult
  | WatchListRawResult
  | WatchOneRawResult
  | WatchManyReferenceRawResult;

export type ParseReponseResult
  = GetListResult
  | GetOneResult
  | GetManyResult
  | GetManyReferenceResult
  | CreateResult
  | UpdateResult
  | UpdateManyResult
  | DeleteResult
  | DeleteManyResult
  | WatchManyResult
  | WatchListResult
  | WatchOneResult
  | WatchManyReferenceResult;

export type HasuraIntrospectionOptions = IntrospectionOptions & {
  readonly operationNames: { [Op in HasuraFetchType]?: (type: IntrospectionType) => string }
};
export type ParseResponseFunction<I = ParseReponseInput, R = ParseReponseResult> = (res: I) => R;

export type CustomResourceActionOptions<I = ParseReponseInput, PR = ParseReponseResult, TCache = unknown> = {
  readonly client: ApolloClient<TCache>
  readonly parseResponse: ParseResponseFunction<I, PR>
};

export type CustomResourceActions = {
  readonly getList?: (
    params: GetListParams,
    options: CustomResourceActionOptions<GetListRawResult, GetListResult>
  ) => Promise<GetListResult>
  readonly getOne?: (
    params: GetOneParams,
    options: CustomResourceActionOptions<GetOneRawResult, GetOneResult>
  ) => Promise<GetOneResult>
  readonly getMany?: (
    params: GetManyParams,
    options: CustomResourceActionOptions<GetManyRawResult, GetManyResult>
  ) => Promise<GetManyResult>
  readonly getManyReference?: (
    params: GetManyReferenceParams,
    options: CustomResourceActionOptions<GetManyReferenceRawResult, GetManyReferenceResult>
  ) => Promise<GetManyReferenceResult>
  readonly update?: (
    params: UpdateParams,
    options: CustomResourceActionOptions<UpdateRawResult, UpdateResult>
  ) => Promise<UpdateResult>
  readonly updateMany?: (
    params: UpdateManyParams,
    options: CustomResourceActionOptions<UpdateManyRawResult, UpdateManyResult>
  ) => Promise<UpdateManyResult>
  readonly create?: (
    params: CreateParams,
    options: CustomResourceActionOptions<CreateRawResult, CreateResult>
  ) => Promise<CreateResult>
  readonly delete?: (
    params: DeleteParams,
    options: CustomResourceActionOptions<DeleteRawResult, DeleteResult>
  ) => Promise<DeleteResult>
  readonly deleteMany?: (
    params: DeleteManyParams,
    options: CustomResourceActionOptions<DeleteManyRawResult, DeleteManyResult>
  ) => Promise<DeleteManyResult>
  readonly watchList?: (
    params: WatchListParams,
    options: CustomResourceActionOptions<WatchListRawResult, WatchListResult>
  ) => Observable<WatchListResult>
  readonly watchOne?: (
    params: WatchOneParams,
    options: CustomResourceActionOptions<WatchOneRawResult, WatchOneResult>
  ) => Observable<WatchOneResult>
  readonly watchMany?: (
    params: WatchManyParams,
    options: CustomResourceActionOptions<WatchManyRawResult, WatchManyResult>
  ) => Observable<WatchManyResult>
  readonly watchManyReference?: (
    params: WatchManyReferenceParams,
    options: CustomResourceActionOptions<WatchManyReferenceRawResult, WatchManyReferenceResult>
  )=> Observable<WatchManyReferenceResult>
};

export type ResourceOptions = {
  readonly alias?: string
  readonly primaryKeys?: readonly string[]
  readonly filterExps?: FilterExpOptions
  readonly customActions?: CustomResourceActions
};

export type ResourceOptionsMap = Record<string, ResourceOptions>;

export type HasuraGraphQLProviderOptions = {
  readonly introspection?: HasuraIntrospectionOptions
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
) => (aorFetchType: HasuraFetchType, resourceName: string, resourceOptions: ResourceOptions) => ParseResponseFunction;

export type HasuraQueryBuilder = (
  buildVariablesImpl: BuildVariablesImpl,
  buildGqlQueryImpl: BuildGqlQueryImpl,
  getResponseParserImpl: ResponseParserImpl
) => QueryBuilder<HasuraGraphQLProviderOptions & { readonly parseResponseOnly?: boolean }>;

export type HasuraDataProvider = GraphQLDataProvider & {
  readonly watchList: (resource: string, params: GetListParams) => Observable<GetListResult>
  readonly watchOne: (resource: string, params: GetOneParams) => Observable<GetOneResult>
  readonly watchMany: (resource: string, params: GetManyParams) => Observable<GetManyResult>
  readonly watchManyReference: (resource: string, params: GetManyReferenceParams) => Observable<GetManyReferenceResult>
};
