// @vitest-environment jsdom
import { test, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('demo assistant supports Hindi, emergency guidance and session chat history', async()=>{
 localStorage.clear(); document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();
 await import('../src/main.jsx'); const u=userEvent.setup();
 await u.click(await screen.findByRole('button',{name:/Explore with a demo profile/i}));
 await u.click(screen.getByRole('button',{name:'AI Assistant'}));
 expect(screen.getByText(/SIMULATED ASSISTANT/)).toBeTruthy();
 await u.selectOptions(screen.getByRole('combobox',{name:'Conversation language'}),'Hindi');
 await u.type(screen.getByRole('textbox',{name:'Health question'}),'सीने में दर्द');
 await u.click(screen.getByRole('button',{name:'Send message'}));
 expect(await screen.findByText(/यह स्थिति गंभीर हो सकती है/)).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Dashboard'}));
 await u.click(screen.getByRole('button',{name:'AI Assistant'}));
 expect(await screen.findByText('सीने में दर्द')).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Clear chat'}));
 expect(screen.queryByText('सीने में दर्द')).toBeNull();
},15000);
