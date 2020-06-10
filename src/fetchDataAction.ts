import {
  fetchActionsWithRecordResponse,
  fetchActionsWithArrayOfIdentifiedRecordsResponse,
  fetchActionsWithArrayOfRecordsResponse,
  fetchActionsWithTotalResponse,
  sanitizeFetchType
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
