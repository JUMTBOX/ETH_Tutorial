const { sortCharacters } = require("./index");

describe("util", () => {
  describe("sortCharacters()", () => {
    it("creates the same string from objects with the same properties in a different order", () => {
      expect(sortCharacters({ foo: "foo", bar: "bar" })).toEqual(
        sortCharacters({ bar: "bar", foo: "foo" })
      );
    });

    it("creates the different string from different objects", () => {
      expect(sortCharacters({ foo: "foo" })).not.toEqual(
        sortCharacters({ bar: "bar" })
      );
    });
  });
});
