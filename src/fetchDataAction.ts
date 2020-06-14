import {
  fetchActionsWithRecordResponse,
  fetchActionsWithArrayOfIdentifiedRecordsResponse,
  fetchActionsWithArrayOfRecordsResponse,
  fetchActionsWithTotalResponse,
  sanitizeFetchType,
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY
} from "ra-core";
import { FetchType } from "./ra-data-graphql";

export const WATCH_LIST = "WATCH_LIST";
export const WATCH_ONE = "WATCH_ONE";
export const WATCH_MANY = "WATCH_MANY";
export const WATCH_MANY_REFERENCE = "WATCH_MANY_REFERENCE";

export type HasuraFetchType
  = FetchType
  | typeof WATCH_LIST
  | typeof WATCH_ONE
  | typeof WATCH_MANY
  | typeof WATCH_MANY_REFERENCE;

export const fetchHasuraActionsWithRecordResponse = [
  ...fetchActionsWithRecordResponse,
  WATCH_ONE
];
export const fetchHasuraActionsWithArrayOfIdentifiedRecordsResponse = [
  ...fetchActionsWithArrayOfIdentifiedRecordsResponse,
  WATCH_LIST,
  WATCH_MANY,
  WATCH_MANY_REFERENCE
];

export const fetchHasuraActionsWithArrayOfRecordsResponse = fetchActionsWithArrayOfRecordsResponse;

export const fetchHasuraActionsWithTotalResponse = [
  ...fetchActionsWithTotalResponse,
  WATCH_LIST,
  WATCH_MANY_REFERENCE
];

export const sanitizeHasuraFetchType = (fetchType: string): string => {
  switch (fetchType) {
    case WATCH_LIST:
      return "watchList";
    case WATCH_ONE:
      return "watchOne";
    case WATCH_MANY:
      return "watchMany";
    case WATCH_MANY_REFERENCE:
      return "watchManyReference";
    default:
      return sanitizeFetchType(fetchType);
  }
};

/**
 * Get a fetch type for a data provider verb.
 *
 * The fetch type is used in reducers.
 *
 * @example getFetchType('getMany'); // 'GET_MANY'
 */
export const getFetchType = (actionType: string): HasuraFetchType | string => {
  switch (actionType) {
    case "getList":
      return GET_LIST;
    case "getOne":
      return GET_ONE;
    case "getMany":
      return GET_MANY;
    case "getManyReference":
      return GET_MANY_REFERENCE;
    case "create":
      return CREATE;
    case "update":
      return UPDATE;
    case "updateMany":
      return UPDATE_MANY;
    case "delete":
      return DELETE;
    case "deleteMany":
      return DELETE_MANY;
    case "watchList":
      return WATCH_LIST;
    case "watchOne":
      return WATCH_ONE;
    case "watchMany":
      return WATCH_MANY;
    case "watchManyReference":
      return WATCH_MANY_REFERENCE;

    default:
      return actionType;
  }
};
