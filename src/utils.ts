import { TypeKind, IntrospectionTypeRef, IntrospectionNamedTypeRef } from "graphql";

export type HasuraGraphQLResponse<T extends Record<string, any> = Record<string, any>> =
  { readonly data: T };

export const isRequired = (type: IntrospectionTypeRef): boolean => {
  if (type.kind === TypeKind.LIST) {
    return isRequired(type.ofType);
  }

  return type.kind === TypeKind.NON_NULL;
};

export const isList = (type: IntrospectionTypeRef): boolean => {
  if (type.kind === TypeKind.NON_NULL) {
    return isList(type.ofType);
  }

  return type.kind === TypeKind.LIST;
};

/**
 * Ensure we get the real type even if the root type is NON_NULL or LIST
 * @param {GraphQLType} type
 */
export const getFinalType = (type: IntrospectionTypeRef): IntrospectionNamedTypeRef => {
  if (type.kind === TypeKind.NON_NULL || type.kind === TypeKind.LIST) {
    return getFinalType(type.ofType);
  }

  return type;
};
