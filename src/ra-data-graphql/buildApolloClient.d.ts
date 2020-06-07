import { ApolloClient, ApolloClientOptions } from 'apollo-client';
import { ApolloCache } from 'apollo-cache';
import { UriFunction } from 'apollo-link-http-common';
export interface BuildClientOptions<TCacheShape> extends Omit<ApolloClientOptions<TCacheShape>, 'cache'> {
    uri?: string | UriFunction;
    cache?: ApolloCache<TCacheShape>;
}
declare const _default: <TCacheShape>(options?: BuildClientOptions<TCacheShape>) => ApolloClient<TCacheShape>;
export default _default;
