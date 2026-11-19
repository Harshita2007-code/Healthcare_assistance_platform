// @vitest-environment jsdom
import { test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('demo remains usable when browser storage is blocked', async () => {
  document.body.innerHTML='<div id="root"></div>';
  window.scrollTo=vi.fn();
  Object.defineProperty(window, 'localStorage', { configurable:true, get() { throw new DOMException('Blocked','SecurityError'); } });
  await import('../src/main.jsx');
  expect(await screen.findByText(/This embedded preview blocks browser storage/)).toBeTruthy();
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/Explore with a demo profile/i}));
  expect(await screen.findByText(/Good to see you, Priya/)).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Government Schemes'}));
  await user.click(await screen.findByRole('button',{name:'Ayushman Bharat PM-JAY'}));
  expect(await screen.findByRole('dialog')).toBeTruthy();
});
