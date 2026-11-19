// @vitest-environment jsdom
import { test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('guest can open demo dashboard and schemes', async () => {
  localStorage.clear();
  document.body.innerHTML='<div id="root"></div>';
  window.scrollTo=vi.fn();
  await import('../src/main.jsx');
  await screen.findByText('Welcome to Sahaara');
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/Explore with a demo profile/i}));
  await screen.findByText(/Good to see you, Priya/);
  await user.click(screen.getByRole('button',{name:'Government Schemes'}));
  expect(await screen.findByRole('button',{name:'Ayushman Bharat PM-JAY'})).toBeTruthy();
});
