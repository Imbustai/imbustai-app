import { createElement } from 'react';
import { sprinkles } from '../../layout/sprinkles.css';
import { gridColumns } from './Grid.css';
import type { Sprinkles } from '../../layout/sprinkles.css';

type SpaceToken = NonNullable<Sprinkles['gap']>;
type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

export type GridProps = AriaProps & DataProps & {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: SpaceToken;
  as?: 'div' | 'section' | 'ul' | 'ol';
  children?: React.ReactNode;
  id?: string;
  role?: string;
};

export function Grid({ columns = 3, gap = '4', as = 'div', children, id, role, ...rest }: GridProps) {
  const cls = `${sprinkles({ display: 'grid', gap })} ${gridColumns[columns]}`;

  return createElement(as, {
    className: cls,
    id,
    role,
    ...rest,
  }, children);
}
