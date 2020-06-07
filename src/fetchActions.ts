
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE_MANY,
  UPDATE_MANY
} from "ra-core";

export const fetchActionsWithRecordResponse = [GET_ONE, CREATE, UPDATE];
export const fetchActionsWithArrayOfIdentifiedRecordsResponse = [
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE
];
export const fetchActionsWithArrayOfRecordsResponse = [
  ...fetchActionsWithArrayOfIdentifiedRecordsResponse,
  UPDATE_MANY,
  DELETE_MANY
];
export const fetchActionsWithTotalResponse = [GET_LIST, GET_MANY_REFERENCE];
