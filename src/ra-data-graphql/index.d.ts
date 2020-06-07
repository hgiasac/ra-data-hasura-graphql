import ApolloClient, { ApolloQueryResult, QueryOptions } from 'apollo-client';
import { FetchResult } from 'apollo-link';
import { MutationOptions, WatchQueryOptions } from 'apollo-client/core/watchQueryOptions';
import { DocumentNode } from 'graphql';
import { DataProvider, FetchType } from 'ra-core';
import { BuildClientOptions } from './buildApolloClient';
import { IntrospectedSchema, IntrospectionOptions } from './introspection';
export * from './introspection';
export * from './constants';
export interface GraphQLProviderOptions<OtherOptions = any> {
    client?: ApolloClient<unknown>;
    clientOptions?: BuildClientOptions<unknown>;
    introspection?: IntrospectionOptions;
    resolveIntrospection?: (client: ApolloClient<unknown>, options: IntrospectionOptions) => Promise<IntrospectedSchema> | IntrospectedSchema;
    buildQuery: (schema: IntrospectedSchema, otherOptions: OtherOptions) => (raFetchType: FetchType, resourceName: string, params: any) => QueryHandler;
    query?: QueryOptions | ((resource: string, raFetchType: FetchType) => QueryOptions);
    mutation?: MutationOptions | ((resource: string, raFetchType: FetchType) => MutationOptions);
    watchQuery?: WatchQueryOptions | ((resource: string, raFetchType: FetchType) => WatchQueryOptions);
    override?: Record<string, (params: any) => QueryHandler>;
}
interface QueryHandler {
    query: DocumentNode;
    variables: Record<string, any>;
    parseResponse: (response: ApolloQueryResult<any> | FetchResult) => any;
}
declare const _default: <Options extends {} = any>(options: Options & GraphQLProviderOptions<Options>) => Promise<DataProvider>;
export default _default;
