import {
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

export const QUERY_TYPES = [GET_LIST, GET_MANY, GET_MANY_REFERENCE, GET_ONE];
export const MUTATION_TYPES = [
  CREATE,
  UPDATE,
  DELETE,
  UPDATE_MANY,
  DELETE_MANY
];
export const ALL_TYPES = [...QUERY_TYPES, ...MUTATION_TYPES] as readonly FetchType[];

export type FetchType =
    | typeof GET_LIST
    | typeof GET_ONE
    | typeof GET_MANY
    | typeof GET_MANY_REFERENCE
    | typeof CREATE
    | typeof UPDATE
    | typeof UPDATE_MANY
    | typeof DELETE
    | typeof DELETE_MANY;
