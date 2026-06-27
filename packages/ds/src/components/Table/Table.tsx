import { createElement } from 'react';
import * as s from './Table.css';

type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

type TableBaseProps = AriaProps & DataProps & {
  children?: React.ReactNode;
  id?: string;
};

export function Table({ children, id, ...rest }: TableBaseProps) {
  return createElement('div', { className: s.tableWrapper, 'data-slot': 'table-wrapper' },
    createElement('table', { className: s.table, 'data-slot': 'table', id, ...rest }, children)
  );
}

export function TableHeader({ children, id, ...rest }: TableBaseProps) {
  return createElement('thead', { className: s.tableHeader, 'data-slot': 'table-header', id, ...rest }, children);
}

export function TableBody({ children, id, ...rest }: TableBaseProps) {
  return createElement('tbody', { className: s.tableBody, 'data-slot': 'table-body', id, ...rest }, children);
}

export function TableRow({ children, id, ...rest }: TableBaseProps) {
  return createElement('tr', { className: s.tableRow, 'data-slot': 'table-row', id, ...rest }, children);
}

export function TableHead({ children, id, ...rest }: TableBaseProps) {
  return createElement('th', { className: s.tableHead, 'data-slot': 'table-head', id, ...rest }, children);
}

export function TableCell({ children, id, ...rest }: TableBaseProps) {
  return createElement('td', { className: s.tableCell, 'data-slot': 'table-cell', id, ...rest }, children);
}
