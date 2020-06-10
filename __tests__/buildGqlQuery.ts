import { TypeKind, print } from "graphql";
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  UPDATE,
  CREATE,
  DELETE
} from "ra-core";
import buildGqlQuery, {
  buildApolloArgs,
  buildArgs,
  buildFields,
  getArgType
} from "../src/buildGqlQuery";

describe("getArgType", () => {
  it("returns the arg type", () => {
    expect(
      print(getArgType({
        type: {
          kind: TypeKind.SCALAR,
          name: "foo"
        }
      } as any))
    ).toEqual("foo");
  });
  it("returns the arg type for NON_NULL types", () => {
    expect(
      print(
        getArgType({
          type: {
            kind: TypeKind.NON_NULL,
            ofType: { name: "ID", kind: TypeKind.SCALAR }
          }
        } as any)
      )
    ).toEqual("ID!");
  });
  it("returns the arg type for LIST types", () => {
    expect(
      print(
        getArgType({
          type: {
            kind: TypeKind.LIST,
            ofType: { name: "ID", kind: TypeKind.SCALAR }
          }
        } as any)
      )
    ).toEqual("[ID]");
  });
  it("returns the arg type for LIST types of NON_NULL type", () => {
    expect(
      print(
        getArgType({
          type: {
            kind: TypeKind.LIST,
            ofType: {
              kind: TypeKind.NON_NULL,
              ofType: {
                kind: TypeKind.SCALAR,
                name: "ID"
              }
            }
          }
        } as any)
      )
    ).toEqual("[ID!]!");
  });
});

describe("buildArgs", () => {
  it("returns an empty array when query does not have any arguments", () => {
    expect(buildArgs({ args: [] } as any, {})).toEqual([]);
  });

  it("returns an array of args correctly filtered when query has arguments", () => {
    expect(
      buildArgs(
        { args: [{ name: "foo" }, { name: "bar" }] } as any,
        { foo: "foo_value" }
      ).map(print)
    ).toEqual(["foo: $foo"]);
  });
});

describe("buildApolloArgs", () => {
  it("returns an empty array when query does not have any arguments", () => {
    expect(buildApolloArgs({ args: [] } as any, {}).map(print)).toEqual([]);
  });

  it("returns an array of args correctly filtered when query has arguments", () => {
    expect(
      buildApolloArgs(
        {
          args: [
            {
              name: "foo",
              type: {
                kind: TypeKind.NON_NULL,
                ofType: {
                  kind: TypeKind.SCALAR,
                  name: "Int"
                }
              }
            },
            {
              name: "barId",
              type: { kind: TypeKind.SCALAR, name: "ID" }
            },
            {
              name: "barIds",
              type: {
                kind: TypeKind.NON_NULL,
                ofType: {
                  kind: TypeKind.LIST,
                  ofType: {
                    kind: TypeKind.NON_NULL,
                    ofType: {
                      kind: TypeKind.SCALAR,
                      name: "ID"
                    }
                  }
                }
              }
            },
            { name: "bar" } as any
          ]
        } as any,
        { foo: "foo_value", barId: 100, barIds: [101, 102] }
      ).map(print)
    ).toEqual(["$foo: Int!", "$barId: ID", "$barIds: [ID!]!"]);
  });
});

describe("buildFields", () => {
  it("returns an object with the fields to retrieve", () => {
    const introspectionResults: any = {
      resources: [{ type: { name: "resourceType" } }],
      types: [
        {
          name: "linkedType",
          fields: [
            {
              name: "id",
              type: { kind: TypeKind.SCALAR, name: "ID" }
            }
          ]
        }
      ]
    };

    const type: any = {
      fields: [
        { type: { kind: TypeKind.SCALAR, name: "ID" }, name: "id" },
        {
          type: { kind: TypeKind.SCALAR, name: "_internalField" },
          name: "foo1"
        },
        {
          type: { kind: TypeKind.OBJECT, name: "linkedType" },
          name: "linked"
        },
        {
          type: { kind: TypeKind.OBJECT, name: "resourceType" },
          name: "resource"
        }
      ]
    };

    const result = buildFields(introspectionResults)(type).map(print);
    expect(result).toEqual([
      "id"
      //             `linked {
      //   id
      // }`,
      //             `resource {
      //   id
      // }`
    ]);
  });
});

describe("buildGqlQuery", () => {
  const introspectionResults: any = {
    resources: [{ type: { name: "resourceType" } }],
    types: [
      {
        name: "linkedType",
        fields: [
          {
            name: "foo",
            type: { kind: TypeKind.SCALAR, name: "bar" }
          }
        ]
      }
    ]
  };

  const resource = {
    type: {
      fields: [
        { type: { kind: TypeKind.SCALAR, name: "" }, name: "foo" },
        { type: { kind: TypeKind.SCALAR, name: "_foo" }, name: "foo1" },
        {
          type: { kind: TypeKind.OBJECT, name: "linkedType" },
          name: "linked"
        },
        {
          type: { kind: TypeKind.OBJECT, name: "resourceType" },
          name: "resource"
        }
      ]
    }
  };

  const queryType: any = {
    name: "allCommand",
    args: [
      {
        name: "foo",
        type: {
          kind: TypeKind.NON_NULL,
          ofType: { kind: TypeKind.SCALAR, name: "Int" }
        }
      },
      {
        name: "barId",
        type: { kind: TypeKind.SCALAR }
      },
      {
        name: "barIds",
        type: { kind: TypeKind.SCALAR }
      },
      { name: "bar" }
    ]
  };
  const params = { foo: "foo_value" };

  it("returns the correct query for GET_LIST", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          GET_LIST,
          queryType,
          params
        )
      )
    ).toEqual(
            `query allCommand($foo: Int!) {
  items: allCommand(foo: $foo) {
    foo
  }
  total: allCommand_aggregate(foo: $foo) {
    aggregate {
      count
    }
  }
}
`
    );
  });
  it("returns the correct query for GET_MANY", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          GET_MANY,
          queryType,
          params
        )
      )
    ).toEqual(
            `query allCommand($foo: Int!) {
  items: allCommand(foo: $foo) {
    foo
  }
}
`
    );
  });
  it("returns the correct query for GET_MANY_REFERENCE", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          GET_MANY_REFERENCE,
          queryType,
          params
        )
      )
    ).toEqual(
            `query allCommand($foo: Int!) {
  items: allCommand(foo: $foo) {
    foo
  }
  total: allCommand_aggregate(foo: $foo) {
    aggregate {
      count
    }
  }
}
`
    );
  });
  it("returns the correct query for GET_ONE", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          GET_ONE,
          { ...queryType, name: "getCommand" },
          params
        )
      )
    ).toEqual(
            `query getCommand($foo: Int!) {
  returning: getCommand(foo: $foo) {
    foo
  }
}
`
    );
  });
  it("returns the correct query for UPDATE", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          UPDATE,
          { ...queryType, name: "updateCommand" },
          params
        )
      )
    ).toEqual(
            `mutation updateCommand($foo: Int!) {
  data: updateCommand(foo: $foo) {
    returning {
      foo
    }
  }
}
`
    );
  });
  it("returns the correct query for CREATE", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          CREATE,
          { ...queryType, name: "createCommand" },
          params
        )
      )
    ).toEqual(
            `mutation createCommand($foo: Int!) {
  data: createCommand(foo: $foo) {
    returning {
      foo
    }
  }
}
`
    );
  });
  it("returns the correct query for DELETE", () => {
    expect(
      print(
        buildGqlQuery(introspectionResults)(
          resource,
          DELETE,
          { ...queryType, name: "deleteCommand" },
          params
        )
      )
    ).toEqual(
            `mutation deleteCommand($foo: Int!) {
  data: deleteCommand(foo: $foo) {
    returning {
      foo
    }
  }
}
`
    );
  });
});
