import {
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  GET_ONE,
  CREATE,
  UPDATE,
  DELETE,
  UPDATE_MANY,
  DELETE_MANY
} from "ra-core";
import { ResponseParserImpl } from "./types";
import {
  WATCH_LIST,
  WATCH_MANY_REFERENCE,
  WATCH_MANY,
  WATCH_ONE
} from "./fetchDataAction";

const sanitizeResource = (data = {}): Record<string, any> => {
  const result = Object.keys(data).reduce((acc, key) => {
    if (key.startsWith("_")) {
      return acc;
    }

    const dataKey = data[key];

    if (dataKey === null || dataKey === undefined) {
      return acc;
    }
    if (Array.isArray(dataKey)) {
      if (typeof dataKey[0] === "object") {
        // if var is an array of reference objects with id properties
        if (dataKey[0].id !== null && dataKey[0].id !== undefined) {
          return {
            ...acc,
            [key]: dataKey.map(sanitizeResource),
            [`${key}Ids`]: dataKey.map((d) => d.id)
          };
        } else {
          return {
            ...acc,
            [key]: dataKey.map(sanitizeResource)
          };
        }
      } else {
        return { ...acc, [key]: dataKey };
      }
    }

    if (typeof dataKey === "object") {
      return {
        ...acc,
        ...(dataKey && dataKey.id && { [`${key}.id`]: dataKey.id }),
        [key]: sanitizeResource(dataKey)
      };
    }

    return { ...acc, [key]: dataKey };
  }, {});

  return result;
};

const parseResponse: ResponseParserImpl = () =>
  (aorFetchType, resourceName, resourceOptions) => (res) => {
    const response = res.data;
    const { primaryKeys = [] } = resourceOptions;
    // react-admin use id as primary key as default. Most of features don't work without id
    // in this case, to support non-id primary key column, or composite primary keys
    // the work around is adding `id` field with primary key value
    const serializeItemId = !primaryKeys.length
      ? (record) => record
      : (record) => {
        // record id is here, nothing to do here
        if (record.id) {
          return record;
        }
        // if there is only one primary key, copy its value to `id`
        if (primaryKeys.length === 1) {
          const key = primaryKeys[0];
          if (record[key] === null || record[key] === undefined) {
            throw new Error(`primary key value is null or undefined; resource ${resourceName}; column: ${key}`);
          }

          return {
            ...record,
            id: record[primaryKeys[0]]
          };
        }

        // with composite keys, since we can't access record data in filter object
        // the workaround is serialize composite data to JSON string
        const idObject = primaryKeys.reduce((acc, key) => {

          if (record[key] === null || record[key] === undefined) {
            throw new Error(`primary key value is null or undefined; resource ${resourceName}; column: ${key}`);
          }

          return { ...acc, [key]: record[key] };
        }, {});

        return {
          ...record,
          id: JSON.stringify(idObject)
        };
      };

    switch (aorFetchType) {
      case GET_MANY_REFERENCE:
      case GET_LIST:
      case WATCH_LIST:
      case WATCH_MANY_REFERENCE:
        return {
          data: response.items.map((record) => sanitizeResource(serializeItemId(record))),
          total: response.total.aggregate.count
        };

      case GET_MANY:
      case WATCH_MANY:
        return {
          data: response.items.map((record) => sanitizeResource(serializeItemId(record)))
        };

      case GET_ONE:
      case WATCH_ONE:
        return {
          data: sanitizeResource(serializeItemId(response.returning[0]))
        };

      case CREATE:
      case UPDATE:
      case DELETE:
        return {
          data: sanitizeResource(serializeItemId(response.data.returning[0]))
        };

      case UPDATE_MANY:
      case DELETE_MANY:
        return {
          data: response.data.returning.map((x) => serializeItemId(x).id)
        };

      default:
        throw Error(`Expected a propper fetchType, got: ${aorFetchType as string}`);
    }
  };

export default parseResponse;
