'use client';

// PROTOTYPE — throwaway. Floating bar that cycles ?variant= on a prototype route.
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function PrototypeSwitcher({ variants }: { variants: { key: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get('variant') ?? variants[0].key;
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  function go(delta: number) {
    const next = variants[(index + delta + variants.length) % variants.length];
    const sp = new URLSearchParams(params.toString());
    sp.set('variant', next.key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (process.env.NODE_ENV === 'production') return null;

  const bar: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 14px',
    borderRadius: 999,
    background: '#111',
    color: '#fff',
    font: '13px/1 ui-monospace, monospace',
    boxShadow: '0 6px 24px rgba(0,0,0,.35)',
  };
  const btn: React.CSSProperties = { background: 'none', border: 0, color: '#fff', fontSize: 18, cursor: 'pointer' };
  return (
    <div style={bar}>
      <button type="button" style={btn} onClick={() => go(-1)} aria-label="Previous variant">
        ←
      </button>
      <span>
        {variants[index].key} ({variants[index].name})
      </span>
      <button type="button" style={btn} onClick={() => go(1)} aria-label="Next variant">
        →
      </button>
    </div>
  );
}
