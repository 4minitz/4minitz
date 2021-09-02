define(function () {
  return function (n, elem) {
    const matched = [];

    for (; n; n = n.nextSibling) {
      if (n.nodeType === 1 && n !== elem) {
        matched.push(n);
      }
    }

    return matched;
  };
});
