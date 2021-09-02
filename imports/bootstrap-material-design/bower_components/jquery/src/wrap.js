define([
  "./core",
  "./core/init",
  "./manipulation", // clone
  "./traversing", // parent, contents
], function (jQuery) {
  jQuery.fn.extend({
    wrapAll: function (html) {
      let wrap;

      if (jQuery.isFunction(html)) {
        return this.each(function (i) {
          jQuery(this).wrapAll(html.call(this, i));
        });
      }

      if (this[0]) {
        // The elements to wrap the target around
        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

        if (this[0].parentNode) {
          wrap.insertBefore(this[0]);
        }

        wrap
          .map(function () {
            let elem = this;

            while (elem.firstElementChild) {
              elem = elem.firstElementChild;
            }

            return elem;
          })
          .append(this);
      }

      return this;
    },

    wrapInner: function (html) {
      if (jQuery.isFunction(html)) {
        return this.each(function (i) {
          jQuery(this).wrapInner(html.call(this, i));
        });
      }

      return this.each(function () {
        const self = jQuery(this);
        const contents = self.contents();

        if (contents.length) {
          contents.wrapAll(html);
        } else {
          self.append(html);
        }
      });
    },

    wrap: function (html) {
      const isFunction = jQuery.isFunction(html);

      return this.each(function (i) {
        jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
      });
    },

    unwrap: function () {
      return this.parent()
        .each(function () {
          if (!jQuery.nodeName(this, "body")) {
            jQuery(this).replaceWith(this.childNodes);
          }
        })
        .end();
    },
  });

  return jQuery;
});
