/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-let */
import {
  GET_ONE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE_MANY
} from "ra-core";

import { IntrospectedSchema, FetchType } from "./ra-data-graphql";
import { IntrospectionField } from "graphql";
import { ResourceOptions } from "./types";
import { buildPrimaryKeyIdExp } from "./utils";

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

type GetListVariables = {
  where?: Record<string, any>
  limit?: number
  offset?: number
  order_by?: Record<string, "asc" | "desc">
};

const buildGetListVariables: VariablesBuilder<Record<string, any>, GetListVariables> = () => (
  _resource,
  _aorFetchType,
  params,
  _queryType,
  resourceOptions
) => {
  const { filterExps, primaryKeys = [] } = resourceOptions;
  const { filter: filterObj = {}, customFilters = [] } = params;

  const filterFn = (): Record<string, any> => {
    if (filterExps && typeof filterExps === "function") {
      return filterExps(filterObj);
    }

    const filters = Object.keys(filterObj).reduce((acc, key) => {

      const val = filterObj[key];
      if (filterExps && filterExps[key]) {
        return [...acc, filterExps[key](val)];
      }

      if (key === "ids" && Array.isArray(filterObj.ids)) {
        return acc.concat(buildPrimaryKeyIdExp(filters.ids, primaryKeys));
      }

      switch (typeof val) {
        case "object":
          return {
            [key]: Array.isArray(val) ? { _in: val } : { _eq: val }
          };
        default:
          return { [key]: { _eq: filterObj[key] } };
      }

    }, customFilters);

    return { _and: filters };
  };

  const getOrderBy = (): Record<string, "asc" | "desc"> => {
    if (!params.sort || !Object.keys(params.sort).length) {
      return undefined;
    }

    const orderValue = params.sort.order.toLowerCase();
    if (params.sort.field !== "id") {
      return {
        [params.sort.field]: orderValue
      };
    }
    if (primaryKeys.length <= 1) {
      return {
        [primaryKeys[0] || "id"]: orderValue
      };
    }

    // sort composite keys
    return primaryKeys.reduce((acc, key) => ({
      ...acc,
      [key]: orderValue
    }), {});
  };

  return {
    where: filterFn(),
    ...(params.pagination ? {} : {
      limit: params.pagination.perPage,
      offset: (params.pagination.page - 1) * params.pagination.perPage
    }),
    order_by: getOrderBy()
  };
};

const buildUpdateVariables: BuildVariablesHandler = (resource, _aorFetchType, params) =>
  Object.keys(params.data).reduce((acc, key) => {
    // If hasura permissions do not allow a field to be updated like (id),
    // we are not allowed to put it inside the variables
    // RA passes the whole previous Object here
    // https://github.com/marmelab/react-admin/issues/2414#issuecomment-428945402

    // TODO: To overcome this permission issue,
    // it would be better to allow only permitted inputFields from *_set_input INPUT_OBJECT
    if (
      params.previousData &&
            params.data[key] === params.previousData[key]
    ) {
      return acc;
    }

    if (resource.type.fields.some((f) => f.name === key)) {
      return {
        ...acc,
        [key]: params.data[key]
      };
    }

    return acc;
  }, {});

const buildCreateVariables: BuildVariablesHandler = (_resource, _aorFetchType, params) => params.data;

export type BuildVariablesImpl = (introspectionResults: IntrospectedSchema) => (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: Record<string, any>,
  queryType: IntrospectionField,
  resourceOptions: ResourceOptions
) => Record<string, any>;

const defaultBuildVariables: BuildVariablesImpl = (introspectionResults) => (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: Record<string, any>,
  queryType: IntrospectionField,
  resourceOptions: ResourceOptions
): Record<string, any> => {

  const primaryKeys = resourceOptions && resourceOptions.primaryKeys
    ? resourceOptions.primaryKeys : [];

  switch (aorFetchType) {
    case GET_LIST:
      return buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType,
        resourceOptions
      );
    case GET_MANY_REFERENCE: {
      const built = buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType,
        resourceOptions
      );
      if (params.filter) {
        return {
          ...built,
          where: {
            _and: [
              ...built.where._and,
              { [params.target]: { _eq: params.id } }
            ]
          }
        };
      }

      return {
        ...built,
        where: {
          [params.target]: { _eq: params.id }
        }
      };
    }
    case GET_MANY:
    case DELETE_MANY:
      return {
        where: {
          _and: buildPrimaryKeyIdExp(params.ids, primaryKeys)
        }
      };

    case GET_ONE:
      return {
        where: {
          _and: buildPrimaryKeyIdExp(params.id, primaryKeys)
        },
        limit: 1
      };

    case DELETE:
      return {
        where: {
          _and: buildPrimaryKeyIdExp(params.id, primaryKeys)
        }
      };
    case CREATE:
      return {
        objects: buildCreateVariables(
          resource,
          aorFetchType,
          params,
          queryType,
          resourceOptions
        )
      };

    case UPDATE:
      return {
        _set: buildUpdateVariables(
          resource,
          aorFetchType,
          params,
          queryType,
          resourceOptions
        ),
        where: {
          _and: buildPrimaryKeyIdExp(params.id, primaryKeys)
        }
      };

    case UPDATE_MANY:
      return {
        _set: buildUpdateVariables(
          resource,
          aorFetchType,
          params,
          queryType,
          resourceOptions
        ),
        where: {
          _and: buildPrimaryKeyIdExp(params.ids, primaryKeys)
        }
      };
    default:
      throw new Error(`Unimplemented action type: ${aorFetchType as string}`);
  }
};

export default defaultBuildVariables;
