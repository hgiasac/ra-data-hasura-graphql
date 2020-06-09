import { GraphQLProviderOptions } from "./ra-data-graphql";

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
  readonly primaryKeys?: readonly string[]
  readonly filterExps?: FilterExpOptions
};

export type ResourceOptionsMap = Record<string, ResourceOptions>;

export type HasuraGraphQLProviderOptions =
  GraphQLProviderOptions & {
    readonly resourceOptions?: ResourceOptionsMap
  };
