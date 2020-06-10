import { TypeKind } from "graphql";
import { isRequired, isList, getFinalType } from "../src/utils";

describe("isRequired", () => {
  it("returns the correct type for SCALAR types", () => {
    expect(isRequired({ name: "foo", kind: TypeKind.SCALAR })).toEqual(
      false
    );
  });

  it("returns the correct type for NON_NULL types", () => {
    expect(
      isRequired({
        kind: TypeKind.NON_NULL,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual(true);
  });
  it("returns the correct type for LIST types", () => {
    expect(
      isRequired({
        kind: TypeKind.LIST,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual(false);
  });
  it("returns the correct type for NON_NULL LIST types", () => {
    expect(
      isRequired({
        kind: TypeKind.NON_NULL,
        ofType: {
          kind: TypeKind.LIST,
          ofType: { name: "foo", kind: TypeKind.SCALAR }
        }
      })
    ).toEqual(true);
  });
});

describe("isList", () => {
  it("returns the correct type for SCALAR types", () => {
    expect(isList({ name: "foo", kind: TypeKind.SCALAR })).toEqual(false);
  });
  it("returns the correct type for NON_NULL types", () => {
    expect(
      isList({
        kind: TypeKind.NON_NULL,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual(false);
  });
  it("returns the correct type for LIST types", () => {
    expect(
      isList({
        kind: TypeKind.LIST,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual(true);
  });
  it("returns the correct type for NON_NULL LIST types", () => {
    expect(
      isList({
        kind: TypeKind.NON_NULL,
        ofType: {
          kind: TypeKind.LIST,
          ofType: { name: "foo", kind: TypeKind.SCALAR }
        }
      })
    ).toEqual(true);
  });
});

describe("getFinalType", () => {
  it("returns the correct type for SCALAR types", () => {
    expect(getFinalType({ name: "foo", kind: TypeKind.SCALAR })).toEqual({
      name: "foo",
      kind: TypeKind.SCALAR
    });
  });
  it("returns the correct type for NON_NULL types", () => {
    expect(
      getFinalType({
        kind: TypeKind.NON_NULL,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual({
      name: "foo",
      kind: TypeKind.SCALAR
    });
  });
  it("returns the correct type for LIST types", () => {
    expect(
      getFinalType({
        kind: TypeKind.LIST,
        ofType: { name: "foo", kind: TypeKind.SCALAR }
      })
    ).toEqual({
      name: "foo",
      kind: TypeKind.SCALAR
    });
  });
  it("returns the correct type for NON_NULL LIST types", () => {
    expect(
      getFinalType({
        kind: TypeKind.NON_NULL,
        ofType: {
          kind: TypeKind.LIST,
          ofType: { name: "foo", kind: TypeKind.SCALAR }
        }
      })
    ).toEqual({ name: "foo", kind: TypeKind.SCALAR });
  });
});
