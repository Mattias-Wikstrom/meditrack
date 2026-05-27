/**
 * Post-processes generated gql.ts files so that graphql() throws instead of
 * returning {} when called with an operation string that isn't in the document
 * map — i.e. when codegen hasn't been run since the operation was written.
 *
 * Invoked automatically by graphql-codegen's afterAllFileWrite hook.
 * Receives the list of written file paths as CLI arguments.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const NEEDLE = 'return (documents as any)[source] ?? {};';

const REPLACEMENT = `const doc = (documents as any)[source];
  if (doc === undefined) {
    throw new Error(
      'GraphQL operation not found in generated types — run "npm run codegen".\\n' +
      \`Source: \${(source as string).trim().slice(0, 120)}\`,
    );
  }
  return doc;`;

let patched = 0;
for (const file of process.argv.slice(2)) {
  if (!file.endsWith('gql.ts')) continue;
  const before = readFileSync(file, 'utf-8');
  if (!before.includes(NEEDLE)) continue;
  writeFileSync(file, before.replace(NEEDLE, REPLACEMENT), 'utf-8');
  patched++;
}

if (patched > 0) {
  console.log(`[guard-gql-fallback] patched ${patched} file(s)`);
}
