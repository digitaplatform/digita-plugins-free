import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { provideHostServices, type HostApi } from '@digitaplatform/plugins';
import { UserMenuNav } from '../src/UserMenuNav';
import { ROWS } from './rows';

function hostFor(roles: string[], get: HostApi['get'] = (() => Promise.resolve({ success: true, data: ROWS })) as HostApi['get']) {
  provideHostServices({
    api: { get, post: vi.fn(), put: vi.fn(), del: vi.fn() } as HostApi,
    getUser: () => ({ _id: 'u1', email: 'u1@example.com', roles }),
    t: (key) => key,
    closeMobileNav: () => {},
  });
}

function renderNav() {
  return render(
    <MemoryRouter>
      <UserMenuNav />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('UserMenuNav', () => {
  it('renders the groups and links of the role', async () => {
    hostFor(['Sales']);
    renderNav();

    const nav = await screen.findByRole('navigation');
    const group = screen.getByRole('button', { name: 'Selling' });
    expect(group.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('link', { name: 'Reports' }).getAttribute('href')).toBe('/reports');
    expect(nav.textContent).not.toContain('Users');

    fireEvent.click(group);
    expect(screen.getByRole('link', { name: 'Customers' }).getAttribute('href')).toBe('/Customer');
    expect(screen.getByRole('link', { name: 'Orders' }).getAttribute('href')).toBe(
      `/SalesOrder?filter=${encodeURIComponent('{"status":"Open"}')}`,
    );
    expect(screen.queryByRole('link', { name: 'Quotes' })).toBeNull();
  });

  it('shows the empty state for a role without a menu, and a menu for one with it', async () => {
    hostFor(['Warehouse']);
    renderNav();
    await screen.findByText('No navigation assigned.');
    expect(screen.queryByRole('navigation')).toBeNull();
    cleanup();

    hostFor(['Warehouse', 'Sales']);
    renderNav();
    await screen.findByRole('navigation');
    expect(screen.queryByText('No navigation assigned.')).toBeNull();
  });
});
