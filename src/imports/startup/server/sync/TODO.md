# Move sync into callable methods

Currently sync runs, based on a given setting in the `settings.json` file.

However, we want to make sync to become more dynamic, so schools can decide
what to sync when and thus we need the sync system to be callable from
the administration are.

Furthermore, there needs to be a system-wide lock until syncing is 100% complete.

This could be achieved using a flag in the `system/Settings` context document,
that is kept in server-wide cache and can be accessed using a mixing, 
making all curriculum-context-related methods "wait" until the flag disappears.

 