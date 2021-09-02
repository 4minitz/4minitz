define([
  "./core",
  "./data/var/dataPriv",
  "./deferred",
  "./callbacks",
], function (jQuery, dataPriv) {
  jQuery.extend({
    queue: function (elem, type, data) {
      let queue;

      if (elem) {
        type = (type || "fx") + "queue";
        queue = dataPriv.get(elem, type);

        // Speed up dequeue by getting out quickly if this is just a lookup
        if (data) {
          if (!queue || jQuery.isArray(data)) {
            queue = dataPriv.access(elem, type, jQuery.makeArray(data));
          } else {
            queue.push(data);
          }
        }
        return queue || [];
      }
    },

    dequeue: function (elem, type) {
      type = type || "fx";

      const queue = jQuery.queue(elem, type);
      let startLength = queue.length;
      let fn = queue.shift();
      const hooks = jQuery._queueHooks(elem, type);
      const next = function () {
        jQuery.dequeue(elem, type);
      };

      // If the fx queue is dequeued, always remove the progress sentinel
      if (fn === "inprogress") {
        fn = queue.shift();
        startLength--;
      }

      if (fn) {
        // Add a progress sentinel to prevent the fx queue from being
        // automatically dequeued
        if (type === "fx") {
          queue.unshift("inprogress");
        }

        // Clear up the last queue stop function
        delete hooks.stop;
        fn.call(elem, next, hooks);
      }

      if (!startLength && hooks) {
        hooks.empty.fire();
      }
    },

    // Not public - generate a queueHooks object, or return the current one
    _queueHooks: function (elem, type) {
      const key = type + "queueHooks";
      return (
        dataPriv.get(elem, key) ||
        dataPriv.access(elem, key, {
          empty: jQuery.Callbacks("once memory").add(function () {
            dataPriv.remove(elem, [type + "queue", key]);
          }),
        })
      );
    },
  });

  jQuery.fn.extend({
    queue: function (type, data) {
      let setter = 2;

      if (typeof type !== "string") {
        data = type;
        type = "fx";
        setter--;
      }

      if (arguments.length < setter) {
        return jQuery.queue(this[0], type);
      }

      return data === undefined
        ? this
        : this.each(function () {
            const queue = jQuery.queue(this, type, data);

            // Ensure a hooks for this queue
            jQuery._queueHooks(this, type);

            if (type === "fx" && queue[0] !== "inprogress") {
              jQuery.dequeue(this, type);
            }
          });
    },
    dequeue: function (type) {
      return this.each(function () {
        jQuery.dequeue(this, type);
      });
    },
    clearQueue: function (type) {
      return this.queue(type || "fx", []);
    },

    // Get a promise resolved when queues of a certain type
    // are emptied (fx is the type by default)
    promise: function (type, obj) {
      let tmp;
      let count = 1;
      const defer = jQuery.Deferred();
      const elements = this;
      let i = this.length;
      const resolve = function () {
        if (!--count) {
          defer.resolveWith(elements, [elements]);
        }
      };

      if (typeof type !== "string") {
        obj = type;
        type = undefined;
      }
      type = type || "fx";

      while (i--) {
        tmp = dataPriv.get(elements[i], type + "queueHooks");
        if (tmp && tmp.empty) {
          count++;
          tmp.empty.add(resolve);
        }
      }
      resolve();
      return defer.promise(obj);
    },
  });

  return jQuery;
});
