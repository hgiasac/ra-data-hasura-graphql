import { TypeKind, IntrospectionTypeRef, IntrospectionNamedTypeRef } from "graphql";

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

export const buildPrimaryKeyExp = (
  ids: readonly (string | number)[],
  primaryKeys?: readonly string[]
): readonly Record<string, any>[] => {

  if (primaryKeys.length <= 1) {
    const key = primaryKeys.length ? primaryKeys[0] : "id";

    return [{ [key]: ids.length === 1 ? { _eq: ids[0] } : { _in: ids } }];
  }

  return ids.map((id) => {
    const idObject = JSON.parse(id as string);

    return primaryKeys.reduce((acc, key) => ({
      ...acc,
      [key]: {
        _eq: idObject[key]
      }
    }), {});
  });
};
