import { Box } from './Box';
import type { Sprinkles } from '../../layout/sprinkles.css';

type SpaceToken = NonNullable<Sprinkles['gap']>;
type AllowedTag = 'div' | 'section' | 'article' | 'aside' | 'main' | 'nav' | 'ul' | 'ol' | 'form';
type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

export type StackProps = AriaProps & DataProps & {
  gap?: SpaceToken;
  align?: Sprinkles['alignItems'];
  justify?: Sprinkles['justifyContent'];
  as?: AllowedTag;
  children?: React.ReactNode;
  id?: string;
  role?: string;
  padding?: Sprinkles['padding'];
  paddingX?: Sprinkles['paddingX'];
  paddingY?: Sprinkles['paddingY'];
};

export function Stack({ gap = '4', align, justify, as, children, id, role, padding, paddingX, paddingY, ...rest }: StackProps) {
  return (
    <Box
      as={as}
      display="flex"
      flexDirection="column"
      gap={gap}
      alignItems={align}
      justifyContent={justify}
      id={id}
      role={role}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      {...rest}
    >
      {children}
    </Box>
  );
}
