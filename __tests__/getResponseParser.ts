import { TypeKind } from "graphql";
import {
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE
} from "ra-core";
import getResponseParser from "../src/getResponseParser";
import { WATCH_LIST, WATCH_MANY, WATCH_MANY_REFERENCE } from "../src";

const testListTypes = (type, hasTotal: boolean) => {
  it(`returns the response expected by AOR for ${type}`, () => {
    const resource: any = {
      type: {
        name: "Post",
        fields: [
          {
            name: "id",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.SCALAR }
            }
          },
          {
            name: "title",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.SCALAR }
            }
          },
          {
            name: "tags",
            type: {
              kind: TypeKind.LIST,
              ofType: { kind: TypeKind.OBJECT, name: "Tag" }
            }
          },
          { name: "embeddedJson", type: { kind: TypeKind.OBJECT } },
          {
            name: "author",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.OBJECT, name: "User" }
            }
          },
          {
            name: "coauthor",
            type: { kind: TypeKind.OBJECT, name: "User" }
          }
        ]
      }
    };

    const introspectionResults: any = {
      resources: [
        {
          type: {
            name: "User",
            fields: [
              { name: "id", type: { kind: TypeKind.SCALAR } },
              {
                name: "firstName",
                type: { kind: TypeKind.SCALAR }
              }
            ]
          }
        },
        {
          type: {
            name: "Tag",
            fields: [
              { name: "id", type: { kind: TypeKind.SCALAR } },
              { name: "name", type: { kind: TypeKind.SCALAR } }
            ]
          }
        }
      ],
      types: [{ name: "User" }, { name: "Tag" }]
    };
    const response = {
      data: {
        items: [
          {
            _typeName: "Post",
            id: "post1",
            title: "title1",
            author: { id: "author1", firstName: "Toto" },
            coauthor: null,
            tags: [
              { id: "tag1", name: "tag1 name" },
              { id: "tag2", name: "tag2 name" }
            ],
            embeddedJson: { foo: "bar" }
          },
          {
            _typeName: "Post",
            id: "post2",
            title: "title2",
            author: { id: "author1", firstName: "Toto" },
            coauthor: null,
            tags: [
              { id: "tag1", name: "tag1 name" },
              { id: "tag3", name: "tag3 name" }
            ],
            embeddedJson: { foo: "bar" }
          }
        ],
        total: hasTotal ? {
          aggregate: { count: 100 }
        } : undefined
      }
    };

    expect(
      getResponseParser(introspectionResults)(type, resource, {})(response)
    ).toEqual({
      data: [
        {
          id: "post1",
          title: "title1",
          "author.id": "author1",
          author: { id: "author1", firstName: "Toto" },
          tags: [
            { id: "tag1", name: "tag1 name" },
            { id: "tag2", name: "tag2 name" }
          ],
          tagsIds: ["tag1", "tag2"],
          embeddedJson: { foo: "bar" }
        },
        {
          id: "post2",
          title: "title2",
          "author.id": "author1",
          author: { id: "author1", firstName: "Toto" },
          tags: [
            { id: "tag1", name: "tag1 name" },
            { id: "tag3", name: "tag3 name" }
          ],
          tagsIds: ["tag1", "tag3"],
          embeddedJson: { foo: "bar" }
        }
      ],
      total: hasTotal ? 100 : undefined
    });
  });
};

const testSingleTypes = (type) => {
  it(`returns the response expected by AOR for ${type}`, () => {
    const resource: any = {
      type: {
        name: "Post",
        fields: [
          {
            name: "id",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.SCALAR }
            }
          },
          {
            name: "title",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.SCALAR }
            }
          },
          {
            name: "tags",
            type: {
              kind: TypeKind.LIST,
              ofType: { kind: TypeKind.OBJECT, name: "Tag" }
            }
          },
          { name: "embeddedJson", type: { kind: TypeKind.OBJECT } },
          {
            name: "author",
            type: {
              kind: TypeKind.NON_NULL,
              ofType: { kind: TypeKind.OBJECT, name: "User" }
            }
          },
          {
            name: "coauthor",
            type: { kind: TypeKind.OBJECT, name: "User" }
          }
        ]
      }
    };

    const introspectionResults: any = {
      resources: [
        {
          type: {
            name: "User",
            fields: [
              { name: "id", type: { kind: TypeKind.SCALAR } },
              {
                name: "firstName",
                type: { kind: TypeKind.SCALAR }
              }
            ]
          }
        },
        {
          type: {
            name: "Tag",
            fields: [
              { name: "id", type: { kind: TypeKind.SCALAR } },
              { name: "name", type: { kind: TypeKind.SCALAR } }
            ]
          }
        }
      ],
      types: [{ name: "User" }, { name: "Tag" }]
    };
    const response = {
      data: {
        data: {
          returning: [{
            _typeName: "Post",
            id: "post1",
            title: "title1",
            author: { id: "author1", firstName: "Toto" },
            coauthor: null,
            tags: [
              { id: "tag1", name: "tag1 name" },
              { id: "tag2", name: "tag2 name" }
            ],
            embeddedJson: { foo: "bar" }
          }]
        }
      }
    };
    expect(
      getResponseParser(introspectionResults)(type, resource, {})(response)
    ).toEqual({
      data: {
        id: "post1",
        title: "title1",
        "author.id": "author1",
        author: { id: "author1", firstName: "Toto" },
        tags: [
          { id: "tag1", name: "tag1 name" },
          { id: "tag2", name: "tag2 name" }
        ],
        tagsIds: ["tag1", "tag2"],
        embeddedJson: { foo: "bar" }
      }
    });
  });
};

describe("getResponseParser", () => {
  testListTypes(GET_LIST, true);
  testListTypes(GET_MANY, false);
  testListTypes(GET_MANY_REFERENCE, true);
  testListTypes(WATCH_LIST, true);
  testListTypes(WATCH_MANY, false);
  testListTypes(WATCH_MANY_REFERENCE, true);
  testSingleTypes(CREATE);
  testSingleTypes(UPDATE);
  testSingleTypes(DELETE);
});
