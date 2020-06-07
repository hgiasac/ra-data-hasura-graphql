/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-let */
import _ from "lodash";
import {
  GET_ONE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE_MANY,
  FetchType
} from "ra-core";

import { getFinalType } from "./utils";
import { IntrospectedSchema } from "ra-data-graphql";
import { IntrospectionField } from "graphql";

export type BuildVariablesHandler<
  P extends Record<string, any> = Record<string, any>,
  R extends Record<string, any> = Record<string, any>,
> = (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: P,
  queryType: IntrospectionField,
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
  resource,
  _aorFetchType,
  params
) => {
  const result: GetListVariables = {};
  const { filter: filterObj = {}, customFilters = [] } = params;

  const filters = Object.keys(filterObj).reduce((acc, key) => {
    let filter;
    if (key === "ids") {
      filter = { id: { _in: filterObj.ids } };
    } else if (Array.isArray(filterObj[key])) {
      filter = { [key]: { _in: filterObj[key] } };
    } else {
      const field = resource.type.fields.find((f) => f.name === key);
      switch (getFinalType(field.type).name) {
        case "String":
          filter = { [key]: { _ilike: `%${filterObj[key] as string}%` } };
          break;
        default:
          filter = { [key]: { _eq: filterObj[key] } };
      }
    }

    return [...acc, filter];
  }, customFilters);

  result.where = { _and: filters };

  if (params.pagination) {
    const perPage = params.pagination.perPage;
    result.limit = perPage;
    result.offset = (params.pagination.page - 1) * perPage;
  }

  if (params.sort) {
    result.order_by = _.set({}, params.sort.field, params.sort.order.toLowerCase());
  }

  return result;
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
) => Record<string, any>;

const defaultBuildVariables: BuildVariablesImpl = (introspectionResults) => (
  resource: Record<string, any>,
  aorFetchType: FetchType,
  params: Record<string, any>,
  queryType: IntrospectionField
): Record<string, any> => {
  switch (aorFetchType) {
    case GET_LIST:
      return buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType
      );
    case GET_MANY_REFERENCE: {
      const built = buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType
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
        where: { id: { _in: params.ids } }
      };

    case GET_ONE:
      return {
        where: { id: { _eq: params.id } },
        limit: 1
      };

    case DELETE:
      return {
        where: { id: { _eq: params.id } }
      };
    case CREATE:
      return {
        objects: buildCreateVariables(
          resource,
          aorFetchType,
          params,
          queryType
        )
      };

    case UPDATE:
      return {
        _set: buildUpdateVariables(
          resource,
          aorFetchType,
          params,
          queryType
        ),
        where: { id: { _eq: params.id } }
      };

    case UPDATE_MANY:
      return {
        _set: buildUpdateVariables(
          resource,
          aorFetchType,
          params,
          queryType
        ),
        where: { id: { _in: params.ids } }
      };
    default:
      throw new Error(`Unimplemented action type: ${aorFetchType as string}`);
  }
};

export default defaultBuildVariables;
