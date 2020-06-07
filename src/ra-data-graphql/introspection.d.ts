import ApolloClient from 'apollo-client';
import { IntrospectionField, IntrospectionType } from 'graphql';
import { IntrospectionSchema } from 'graphql/utilities/introspectionQuery';
import { FetchType } from 'ra-core';
export declare const filterTypesByIncludeExclude: ({ include, exclude, }: Pick<IntrospectionOptions, 'include' | 'exclude'>) => (type: IntrospectionType) => boolean;
export interface IntrospectionOptions {
    schema?: IntrospectionSchema;
    operationNames: {
        [Op in FetchType]?: (type: IntrospectionType) => string;
    };
    include?: Filter;
    exclude?: Filter;
}
declare type Filter = string[] | ((type: IntrospectionType) => boolean);
export interface IntrospectedSchema {
    types: IntrospectionType[];
    queries: IntrospectionField[];
    resources: IntrospectedResource[];
    schema: IntrospectionSchema;
}
export declare type IntrospectedResource = {
    type: IntrospectionType;
    GET_LIST: IntrospectionField;
    GET_ONE: IntrospectionField;
} & Record<Exclude<FetchType, 'GET_LIST' | 'GET_ONE'>, IntrospectionField | undefined>;
declare const _default: (client: ApolloClient<unknown>, options: IntrospectionOptions) => Promise<IntrospectedSchema>;
/**
 * @param {ApolloClient} client The Apollo client
 * @param {Object} options The introspection options
 */
export default _default;
