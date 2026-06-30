// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@imbustai/i18n';
import en from '@/lib/i18n/en.json';
import itMessages from '@/lib/i18n/it.json';
import { FreeOrderForm } from './free-order-form';

const messages = { en, it: itMessages } as Record<'en' | 'it', Record<string, unknown>>;

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  pushMock.mockClear();
  refreshMock.mockClear();
});

function renderForm() {
  return render(
    <I18nProvider messages={messages} fallbackLocale="en">
      <FreeOrderForm
        users={[{ id: 'user-1', email: 'user@example.com' }]}
        stories={[
          { id: 'story-1', slug: 'voss', title_en: 'The Voss Case', title_it: 'Il Caso Voss' },
        ]}
      />
    </I18nProvider>
  );
}

describe('FreeOrderForm', () => {
  it('submits via the API and navigates to the new order on success, instead of doing a native form GET', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/addresses')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                addresses: [
                  {
                    id: 'addr-1',
                    user_id: 'user-1',
                    label: 'Home',
                    line1: 'Via Roma 1',
                    line2: null,
                    city: 'Padova',
                    postal_code: '35012',
                    country: 'IT',
                    is_default: true,
                    created_at: '',
                    updated_at: '',
                  },
                ],
              }),
              { status: 200 }
            )
          );
        }
        if (url.endsWith('/api/admin/orders/free')) {
          return Promise.resolve(
            new Response(JSON.stringify({ id: 'order-123' }), { status: 200 })
          );
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

    renderForm();

    fireEvent.change(screen.getByLabelText('Select user'), {
      target: { value: 'user-1' },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("Select address for this user")).not.toBeDisabled()
    );

    fireEvent.change(screen.getByLabelText('Select story'), {
      target: { value: 'story-1' },
    });
    fireEvent.change(screen.getByLabelText("Select address for this user"), {
      target: { value: 'addr-1' },
    });

    const form = screen.getByRole('button', { name: /create order/i }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /create order/i }));

    // Proves the click ran through the React onSubmit handler (fetch + router.push)
    // rather than a native, un-prevented form submission — which is exactly what
    // broke when onSubmit wasn't wired to the <form> element.
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/order/order-123'));

    const freeOrderCall = fetchMock.mock.calls.find(([input]) =>
      (typeof input === 'string' ? input : input.toString()).endsWith(
        '/api/admin/orders/free'
      )
    );
    expect(freeOrderCall).toBeDefined();
    const [, init] = freeOrderCall!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      userId: 'user-1',
      storyId: 'story-1',
      addressId: 'addr-1',
    });
  });
});
