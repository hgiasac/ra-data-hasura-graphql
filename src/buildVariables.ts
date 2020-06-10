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
import { FetchType } from "./ra-data-graphql";
import { IntrospectionField } from "graphql";
import { ResourceOptions, VariablesBuilder, BuildVariablesHandler, BuildVariablesImpl } from "./types";
import { buildPrimaryKeyIdExp } from "./utils";

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

  const buildFilterValue = (key: string, value: any, pks?: readonly string[]): any => {

    if (key === "ids" && Array.isArray(value)) {
      return buildPrimaryKeyIdExp(value, pks || []);
    }

    switch (typeof value) {
      case "object":
        if (!Array.isArray(value)) {
          return {
            [key]: filterFn(value, true)
          };
        }

        if (typeof value[0] === "object") {
          return {
            [key]: {
              _or: value.map((v) => filterFn(v, true))
            }
          };
        }

        return {
          [key]: { _in: value }
        };
      default:
        return {
          [key]: { _eq: value }
        };
    }
  };

  function objectFromPaths<V = any>(paths: readonly string[], value: V): Record<string, any> {
    if (paths.length === 1) {
      return buildFilterValue(paths[0], value);
    }

    return {
      [paths[0]]: objectFromPaths(paths.slice(1), value)
    };
  }

  const filterFn = (obj: Record<string, unknown>, isNested: boolean): Record<string, any> => {

    const filters = Object.keys(obj).reduce((acc, key) => {

      const val = obj[key];
      if (!isNested && filterExps && filterExps[key]) {
        return [...acc, filterExps[key](val)];
      }

      const parts = key.split(".");
      if (parts.length > 1) {
        return [
          ...acc,
          objectFromPaths(parts, val)
        ];
      }

      return [
        ...acc,
        buildFilterValue(key, val, primaryKeys)
      ];

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
    where: filterExps && typeof filterExps === "function"
      ? filterExps(filterObj) : filterFn(filterObj, false),
    ...(!params.pagination ? {} : {
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
      return buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        {
          ...params,
          filter: {
            ...params.filter,
            [params.target]: params.id
          }
        },
        queryType,
        resourceOptions
      );
    }
    case GET_MANY:
    case DELETE_MANY:
      return {
        where: buildPrimaryKeyIdExp(params.ids, primaryKeys)
      };

    case GET_ONE:
      return {
        where: buildPrimaryKeyIdExp([params.id], primaryKeys),
        limit: 1
      };

    case DELETE:
      return {
        where: buildPrimaryKeyIdExp([params.id], primaryKeys)
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
        where: buildPrimaryKeyIdExp([params.id], primaryKeys)
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
        where: buildPrimaryKeyIdExp([params.ids], primaryKeys)
      };
    default:
      throw new Error(`Unimplemented action type: ${aorFetchType as string}`);
  }
};

export default defaultBuildVariables;
