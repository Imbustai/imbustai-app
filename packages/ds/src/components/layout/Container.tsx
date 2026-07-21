import { Box } from './Box';

type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

export type ContainerProps = AriaProps & DataProps & {
  as?: 'div' | 'section' | 'main' | 'article';
  children?: React.ReactNode;
  id?: string;
  role?: string;
};

export function Container({ as = 'div', children, id, role, ...rest }: ContainerProps) {
  return (
    <Box
      as={as}
      width="full"
      maxWidth="container"
      marginX="auto"
      paddingX={{ mobile: '4', tablet: '6', desktop: '8' }}
      id={id}
      role={role}
      {...rest}
    >
      {children}
    </Box>
  );
}
