import { describe, expect, it } from 'vitest';
import { canApprove, canGenerate, isOpen, shouldAutoSend } from '../engine/workflow';
import type { ValidationWarning } from '../types';

const warn = (severity: 'warning' | 'error'): ValidationWarning => ({
  rule: 'knowledge_scope',
  severity,
  message: 'x',
});

describe('turn state machine guards', () => {
  it('generate allowed only before approval', () => {
    expect(canGenerate('pending_ai')).toBe(true);
    expect(canGenerate('draft_ready')).toBe(true); // regenerate loop
    expect(canGenerate('approved')).toBe(false);
    expect(canGenerate('sent')).toBe(false);
  });

  it('approve requires a reviewed draft; sent is immutable', () => {
    expect(canApprove('pending_ai')).toBe(false); // cannot skip draft_ready
    expect(canApprove('draft_ready')).toBe(true);
    expect(canApprove('approved')).toBe(false);
    expect(canApprove('sent')).toBe(false);
  });

  it('any non-sent turn blocks a new player submission', () => {
    expect(isOpen('pending_ai')).toBe(true);
    expect(isOpen('draft_ready')).toBe(true);
    expect(isOpen('approved')).toBe(true);
    expect(isOpen('sent')).toBe(false);
  });
});

describe('shouldAutoSend (lifecycle gate)', () => {
  it('testing stories NEVER auto-send, even with a clean draft', () => {
    expect(shouldAutoSend('testing', [])).toBe(false);
  });

  it('draft stories never auto-send', () => {
    expect(shouldAutoSend('draft', [])).toBe(false);
  });

  it('released stories auto-send when validation is clean or warning-only', () => {
    expect(shouldAutoSend('released', [])).toBe(true);
    expect(shouldAutoSend('released', [warn('warning')])).toBe(true);
  });

  it('validator ERRORS hold released turns for admin review', () => {
    expect(shouldAutoSend('released', [warn('error')])).toBe(false);
    expect(shouldAutoSend('released', [warn('warning'), warn('error')])).toBe(false);
  });
});
