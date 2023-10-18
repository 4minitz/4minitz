export const subElementsHelper = {
  findIndexById(id, elements, attributeName) {
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

  getElementById(id, elements, attributeName) {
    const i = subElementsHelper.findIndexById(id, elements, attributeName);
    if (i != undefined) {
      return elements[i];
    }
    return undefined;
  },
};
