/* eslint-disable @typescript-eslint/quotes */
import {
  CREATE,
  DELETE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  UPDATE
} from "ra-core";
import buildVariables from "../src/buildVariables";

const resourceOptions = {
  articles: {},
  customPk: {
    primaryKeys: ["article_id"]
  },
  composite: {
    primaryKeys: ["article_id", "category_id"]
  }
};
const introspectionResult: any = {
  types: [
    {
      name: "articles",
      inputFields: [
        { name: "id" },
        { name: "title" },
        { name: "views"}
      ]
    }
  ]
};

const articleResource = {
  type: {
    name: "articles",
    fields: [
      { name: "id" },
      { name: "title" },
      { name: "views"}
    ]
  }
};

describe("buildVariables", () => {
  describe("GET_LIST", () => {
    it("returns correct variables", () => {

      const params = {
        filter: {
          ids: ["foo1", "foo2"],
          tags: { id: ["tag1", "tag2"] },
          "author.id": "author1",
          views: 100
        },
        pagination: { page: 10, perPage: 10 },
        sort: { field: "name", order: "DESC" }
      };

      const variables = buildVariables(introspectionResult)(
        articleResource,
        GET_LIST,
        params,
        null,
        {}
      );

      expect(variables).toEqual({
        where: {
          _and: [{
            id: { _in: ["foo1", "foo2"] }
          }, {
            tags: {
              _and: [{ id: { _in: ["tag1", "tag2"] } }]
            }
          }, {
            author: {
              id: { _eq: "author1" }
            }
          }, {
            views: { _eq: 100 }
          }]
        },
        limit: 10,
        order_by: { name: "desc" },
        offset: 90
      });
    });

    it("returns correct custom primary key", () => {

      const params = {
        filter: {
          ids: ["foo1",  "foo2"]
        }
      };

      const variables = buildVariables(introspectionResult)(
        articleResource,
        GET_LIST,
        params,
        null,
        resourceOptions.customPk
      );

      expect(variables).toEqual({
        where: {
          _and: [{
            article_id: {
              _in: ["foo1",  "foo2"]
            }
          }]
        }
      });
    });

    it("returns correct composite primary keys", () => {

      const params = {
        filter: {
          ids: [
            '{ "article_id": "foo1", "category_id": 1 }',
            '{ "article_id": "foo2", "category_id": 2 }'
          ]
        },
        pagination: { page: 10, perPage: 10 },
        sort: { field: "name", order: "DESC" }
      };

      const variables = buildVariables(introspectionResult)(
        articleResource,
        GET_LIST,
        params,
        null,
        resourceOptions.composite
      );

      expect(variables).toEqual({
        where: {
          _and: [{
            _or: [{
              article_id: { _eq: "foo1"},
              category_id: { _eq: 1 }
            }, {
              article_id: { _eq: "foo2"},
              category_id: { _eq: 2 }
            }]
          }]
        },
        limit: 10,
        order_by: { name: "desc" },
        offset: 90
      });
    });
  });

  describe("CREATE", () => {
    it("returns correct variables", () => {
      const params = {
        data: {
          author: { id: "author1" },
          tags: [{ id: "tag1" }, { id: "tag2" }],
          title: "Foo"
        }
      };
      const queryType: any = {
        args: []
      };

      expect(
        buildVariables(introspectionResult)(
          articleResource,
          CREATE,
          params,
          queryType,
          {}
        )
      ).toEqual({
        objects: {
          author: { id: "author1" },
          tags: [{ id: "tag1" }, { id: "tag2" }],
          title: "Foo"
        }
      });
    });
  });

  describe("UPDATE", () => {
    it("returns correct variables", () => {
      const params = {
        data: {
          title: "Foo"
        },
        id: "foo1"
      };
      const queryType: any = {};

      expect(
        buildVariables(introspectionResult)(
          articleResource,
          UPDATE,
          params,
          queryType,
          {}
        )
      ).toEqual({
        _set: {
          title: "Foo"
        },
        where: {
          id: {
            _eq: "foo1"
          }
        }
      });
    });
  });

  describe("GET_MANY", () => {
    it("returns correct variables", () => {
      const params = {
        ids: ["tag1", "tag2"]
      };

      expect(
        buildVariables(introspectionResult)(
          articleResource,
          GET_MANY,
          params,
          {} as any,
          {}
        )
      ).toEqual({
        where: {
          id: { _in: ["tag1", "tag2"] }
        }
      });
    });
  });

  describe("GET_MANY_REFERENCE", () => {
    it("returns correct variables", () => {
      const params = {
        target: "author.id",
        id: "author1",
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" }
      };

      expect(
        buildVariables(introspectionResult)(
          articleResource,
          GET_MANY_REFERENCE,
          params,
          {} as any,
          {}
        )
      ).toEqual({
        where: {
          _and: [{
            author: {
              id: { _eq: "author1" }
            }
          }]
        },
        limit: 10,
        order_by: { name: "asc" },
        offset: 0
      });
    });
  });

  describe("DELETE", () => {
    it("returns correct variables", () => {
      const params = {
        id: "post1"
      };

      expect(
        buildVariables(introspectionResult)(
          articleResource,
          DELETE,
          params,
          {} as any,
          {}
        )
      ).toEqual({
        where: {
          id: { _eq: "post1" }
        }
      });
    });
  });
});
