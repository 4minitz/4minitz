define(["./core", "./var/slice", "./callbacks"], function (jQuery, slice) {
  jQuery.extend({
    Deferred: function (func) {
      const tuples = [
        // action, add listener, listener list, final state
        ["resolve", "done", jQuery.Callbacks("once memory"), "resolved"],
        ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"],
        ["notify", "progress", jQuery.Callbacks("memory")],
      ];
      let state = "pending";
      var promise = {
        state: function () {
          return state;
        },
        always: function () {
          deferred.done(arguments).fail(arguments);
          return this;
        },
        then: function (/* fnDone, fnFail, fnProgress */) {
          let fns = arguments;
          return jQuery
            .Deferred(function (newDefer) {
              jQuery.each(tuples, function (i, tuple) {
                const fn = jQuery.isFunction(fns[i]) && fns[i];

                // deferred[ done | fail | progress ] for forwarding actions to newDefer
                deferred[tuple[1]](function () {
                  const returned = fn && fn.apply(this, arguments);
                  if (returned && jQuery.isFunction(returned.promise)) {
                    returned
                      .promise()
                      .progress(newDefer.notify)
                      .done(newDefer.resolve)
                      .fail(newDefer.reject);
                  } else {
                    newDefer[tuple[0] + "With"](
                      this === promise ? newDefer.promise() : this,
                      fn ? [returned] : arguments
                    );
                  }
                });
              });
              fns = null;
            })
            .promise();
        },

        // Get a promise for this deferred
        // If obj is provided, the promise aspect is added to the object
        promise: function (obj) {
          return obj != null ? jQuery.extend(obj, promise) : promise;
        },
      };
      var deferred = {};

      // Keep pipe for back-compat
      promise.pipe = promise.then;

      // Add list-specific methods
      jQuery.each(tuples, function (i, tuple) {
        const list = tuple[2];
        const stateString = tuple[3];

        // promise[ done | fail | progress ] = list.add
        promise[tuple[1]] = list.add;

        // Handle state
        if (stateString) {
          list.add(
            function () {
              // state = [ resolved | rejected ]
              state = stateString;

              // [ reject_list | resolve_list ].disable; progress_list.lock
            },
            tuples[i ^ 1][2].disable,
            tuples[2][2].lock
          );
        }

        // deferred[ resolve | reject | notify ]
        deferred[tuple[0]] = function () {
          deferred[tuple[0] + "With"](
            this === deferred ? promise : this,
            arguments
          );
          return this;
        };
        deferred[tuple[0] + "With"] = list.fireWith;
      });

      // Make the deferred a promise
      promise.promise(deferred);

      // Call given func if any
      if (func) {
        func.call(deferred, deferred);
      }

      // All done!
      return deferred;
    },

    // Deferred helper
    when: function (subordinate /* , ..., subordinateN */) {
      let i = 0;
      const resolveValues = slice.call(arguments);
      const length = resolveValues.length;

      // the count of uncompleted subordinates
      let remaining =
        length !== 1 || (subordinate && jQuery.isFunction(subordinate.promise))
          ? length
          : 0;

      // the master Deferred.
      // If resolveValues consist of only a single Deferred, just use that.
      const deferred = remaining === 1 ? subordinate : jQuery.Deferred();

      // Update function for both resolve and progress values
      const updateFunc = function (i, contexts, values) {
        return function (value) {
          contexts[i] = this;
          values[i] = arguments.length > 1 ? slice.call(arguments) : value;
          if (values === progressValues) {
            deferred.notifyWith(contexts, values);
          } else if (!--remaining) {
            deferred.resolveWith(contexts, values);
          }
        };
      };

      let progressValues;
      let progressContexts;
      let resolveContexts;

      // Add listeners to Deferred subordinates; treat others as resolved
      if (length > 1) {
        progressValues = new Array(length);
        progressContexts = new Array(length);
        resolveContexts = new Array(length);
        for (; i < length; i++) {
          if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
            resolveValues[i]
              .promise()
              .progress(updateFunc(i, progressContexts, progressValues))
              .done(updateFunc(i, resolveContexts, resolveValues))
              .fail(deferred.reject);
          } else {
            --remaining;
          }
        }
      }

      // If we're not waiting on anything, resolve the master
      if (!remaining) {
        deferred.resolveWith(resolveContexts, resolveValues);
      }

      return deferred.promise();
    },
  });

  return jQuery;
});
