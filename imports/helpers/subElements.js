export const subElementsHelper = {
  findIndexById: function (id, elements, attributeName) {
    if (!attributeName) {
      attributeName = "_id";
    }
    let i;
    for (i = 0; i < elements.length; i++) {
      if (id === elements[i][attributeName]) {
        return i;
      }
    }
    return undefined;
  },

  getElementById: function (id, elements, attributeName) {
    let i = subElementsHelper.findIndexById(id, elements, attributeName);
    if (i != undefined) {
      return elements[i];
    }
    return undefined;
  },
};
