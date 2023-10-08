import { expect } from "chai";
import { subElementsHelper } from "../../../../imports/helpers/subElements";

describe("subElementsHelper", () => {
  describe("#findIndexById", () => {
    it("returns undefined if an empty list is given", () => {
      let list = [],
        id = "someId";

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.be.undefined;
    });

    it("returns undefined if the given id is not found", () => {
      let list = [{}, {}, {}],
        id = "someId";

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.be.undefined;
    });

    it("returns the index of the element with the given id", () => {
      let id = "someId",
        list = [{}, { _id: "someId" }, {}];

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.equal(1);
    });

    it("returns the index of the element with the given id it first encounters", () => {
      let id = "someId",
        list = [{}, { _id: id }, { _id: id }];

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.equal(1);
    });
  });
});
