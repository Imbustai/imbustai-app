import { divider } from './Divider.css';

export type DividerProps = {
  id?: string;
};

export function Divider({ id }: DividerProps) {
  return <hr className={divider} id={id} />;
}
