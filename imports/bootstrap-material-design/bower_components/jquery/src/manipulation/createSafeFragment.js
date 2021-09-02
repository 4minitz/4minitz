define(["./var/nodeNames"], function (nodeNames) {
  function createSafeFragment(document) {
    const list = nodeNames.split("|");
    const safeFrag = document.createDocumentFragment();

    if (safeFrag.createElement) {
      while (list.length) {
        safeFrag.createElement(list.pop());
      }
    }
    return safeFrag;
  }

  return createSafeFragment;
});
