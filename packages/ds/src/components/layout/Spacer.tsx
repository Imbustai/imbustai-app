import { Box } from './Box';
import type { Sprinkles } from '../../layout/sprinkles.css';

type SpaceToken = NonNullable<Sprinkles['gap']>;

export type SpacerProps = {
  size?: SpaceToken;
};

export function Spacer({ size }: SpacerProps) {
  if (size) {
    return <Box paddingTop={size} />;
  }
  return <Box flexGrow={1} />;
}
