/* eslint-disable max-len */
import gql from "graphql-tag";
import defaultQuery, { buildQueryFactory } from "../src/buildQuery";

describe("buildQuery", () => {
  const queryType = "query_type";

  const resource = {
    type: { name: "Post" },
    GET_LIST: queryType
  };
  const otherOptions = {
    resourceOptions: {}
  };
  const introspectionResults: any = {
    resources: [resource]
  };

  it("throws an error if resource is unknown", () => {
    expect(() =>
      defaultQuery(introspectionResults, otherOptions)("GET_LIST", "Comment", {} as any)
    ).toThrow(
      "Unknown resource 'Comment'. Make sure it has been declared on your server side schema, or the user has resource permission. Known resources are Post"
    );
  });

  it("throws an error if resource does not have a query or mutation for specified AOR fetch type", () => {
    expect(() =>
      defaultQuery(introspectionResults, otherOptions)("CREATE", "Post", {} as any)
    ).toThrow(
      "No query matching fetch type could be found for resource Post. Maybe the current user doesn't have INSERT permission"
    );
  });

  it("correctly builds a query and returns it along with variables and parseResponse", () => {
    const buildVariables = jest.fn(() => ({ foo: true }));
    const buildGqlQuery = jest.fn(
      () =>
        gql`
                    query {
                        id
                    }
                `
    );
    const getResponseParser = jest.fn(() => "parseResponseFunction");
    const buildVariablesFactory = jest.fn(() => buildVariables);
    const buildGqlQueryFactory = jest.fn(() => buildGqlQuery);
    const getResponseParserFactory = jest.fn(() => getResponseParser);

    expect(
      buildQueryFactory(
        buildVariablesFactory,
        buildGqlQueryFactory,
        getResponseParserFactory as any
      )(introspectionResults, {})("GET_LIST", "Post", { foo: "bar" } as any)
    ).toEqual({
      query: gql`
                query {
                    id
                }
            `,
      variables: { foo: true },
      parseResponse: "parseResponseFunction"
    });

    expect(buildVariablesFactory).toHaveBeenCalledWith(
      introspectionResults
    );
    expect(buildGqlQueryFactory).toHaveBeenCalledWith(introspectionResults);
    expect(getResponseParserFactory).toHaveBeenCalledWith(
      introspectionResults
    );

    expect(buildVariables).toHaveBeenCalledWith(
      resource,
      "GET_LIST",
      { foo: "bar" },
      queryType,
      {}
    );
    expect(buildGqlQuery).toHaveBeenCalledWith(
      resource,
      "GET_LIST",
      queryType,
      { foo: true }
    );
    expect(getResponseParser).toHaveBeenCalledWith(
      "GET_LIST",
      "Post",
      {}
    );
  });
});
