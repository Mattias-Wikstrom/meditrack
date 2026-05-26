# Internationalization

The web apps currently display everything in English. This document describes what would be
involved in adding support for additional languages (e.g. Swedish).

## What needs translating

### Error codes

Business logic errors are returned from the server as `ErrorCode` strings (e.g.
`InsufficientStock`, `InvalidStatusTransition`). The apps need to turn these into
human-readable messages. A lookup table per language — one file shared across all three apps —
is sufficient. See [error_handling.md](error_handling.md) for the full list of codes.

### UI strings

Every hardcoded label, heading, button text, and status message in the React components needs to
be replaced with a translation function call. This includes strings in both the app-specific
`pages/` directories and the shared components in `packages/ui/`.

## Recommended approach

The standard library for React i18n is **`react-i18next`**. It provides a `t('key')` function
inside components, handles pluralisation and string interpolation, and has good TypeScript
support including optional key type-safety.

Translation files would live in `packages/` so that strings shared between apps (including
those in `packages/ui/`) are defined once:

```
packages/
  i18n/
    en.json
    sv.json
```

Each app configures `i18next` at startup and loads the shared translation files, optionally
merging in app-specific strings if needed.

The `packages/ui/` components need to be i18n-aware. The cleanest way is for them to call
`useTranslation()` directly, which requires `i18next` to be initialised by the host app before
the components render — a reasonable assumption since all three apps would use the same setup.

## Scope of the work

The architectural changes are small. The bulk of the work is mechanical:

1. Install and configure `react-i18next` in each app and in `packages/ui/`.
2. Extract every hardcoded string into the translation files.
3. Replace the hardcoded strings in components with `t('key')` calls.
4. Add the error code lookup tables for each language.

Because the apps are fairly focused in scope, the total number of strings is manageable.
The main ongoing cost is keeping the translation files in sync as the UI evolves — a new
string added in English needs a corresponding entry in every other language file.
