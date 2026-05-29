import { graphql } from 'graphql';
import { schema } from '../../../../api/graphql/schema';
import { GraphQLContext } from '../../../../api/graphql/context';
import { CliOutput } from '../CliOutput';

export async function runGraphQL(
  context: GraphQLContext,
  output: CliOutput,
  query: string,
  variables?: Record<string, unknown>,
): Promise<void> {
  const result = await graphql({
    schema,
    source: query,
    contextValue: context,
    variableValues: variables,
  });

  output.print(JSON.stringify(result, null, 2));

  if (result.errors?.length) {
    output.exit(1);
  }
}
