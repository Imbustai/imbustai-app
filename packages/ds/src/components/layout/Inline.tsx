import { Box } from './Box';
import type { Sprinkles } from '../../layout/sprinkles.css';

type SpaceToken = NonNullable<Sprinkles['gap']>;
type AllowedTag = 'div' | 'section' | 'nav' | 'ul' | 'ol' | 'span';
type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

export type InlineProps = AriaProps & DataProps & {
  gap?: SpaceToken;
  align?: Sprinkles['alignItems'];
  justify?: Sprinkles['justifyContent'];
  wrap?: boolean;
  as?: AllowedTag;
  children?: React.ReactNode;
  id?: string;
  role?: string;
};

export function Inline({ gap = '3', align = 'center', justify, wrap = true, as, children, id, role, ...rest }: InlineProps) {
  return (
    <Box
      as={as}
      display="flex"
      flexDirection="row"
      flexWrap={wrap ? 'wrap' : 'nowrap'}
      gap={gap}
      alignItems={align}
      justifyContent={justify}
      id={id}
      role={role}
      {...rest}
    >
      {children}
    </Box>
  );
}
