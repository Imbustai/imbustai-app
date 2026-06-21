import { smoke } from './DsSmoke.css';

export function DsSmoke({ label = '@imbustai/ds OK' }: { label?: string }) {
  return <div className={smoke}>{label}</div>;
}
