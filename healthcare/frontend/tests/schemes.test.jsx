// @vitest-environment jsdom
import { test, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const scheme = {
  id:'test-health', name:'Test Health Programme', tag:'HEALTH COVER', category:'Health cover', beneficiary:'Families',
  description:'A test-only database record.', benefit:'Support for a rare test benefit.', target:'Families', documents:'Ask locally',
  criteria:'Official criteria apply.', apply:'Ask locally.', source:'Example official source', url:'https://nha.gov.in/PM-JAY',
  color:'mint', scope:'central', match:{status:'More Information Required',reason:'Verify with the authority.',sourceUrl:'https://nha.gov.in/PM-JAY'},
};
const user = {id:'test-user',name:'Test Citizen',age:32,state:'Uttar Pradesh',district:'Ghaziabad',language:'English',familySize:2};

test('account scheme search, details and save update the existing UI through API calls', async () => {
  localStorage.clear(); localStorage.setItem('sahaara-mode', JSON.stringify('account'));
  document.body.innerHTML = '<div id="root"></div>'; window.scrollTo = vi.fn();
  const requests = []; let saved = false;
  vi.stubGlobal('fetch', vi.fn(async (path, options = {}) => {
    const url = new URL(path, 'http://localhost'); requests.push({path:url.pathname, query:url.searchParams.toString(), method:options.method});
    const ok = body => ({ok:true,status:200,json:async()=>body});
    if(url.pathname==='/api/auth/me') return ok({user});
    if(url.pathname==='/api/schemes/saved') return ok({saved:saved?['test-health']:[]});
    if(url.pathname==='/api/schemes/test-health/saved') {saved=options.method==='PUT'; return ok({saved});}
    if(url.pathname==='/api/schemes/test-health') return ok({scheme});
    if(url.pathname==='/api/schemes') {
      const search=url.searchParams.get('q')||''; const category=url.searchParams.get('category');
      return ok({schemes:(!search||('test health programme '+scheme.benefit).toLowerCase().includes(search.toLowerCase()))&&(!category||category===scheme.category)?[scheme]:[]});
    }
    throw new Error('Unexpected request: '+url.pathname);
  }));
  await import('../src/main.jsx');
  await screen.findByText(/Good to see you, Test/);
  const ui=userEvent.setup();
  await ui.click(screen.getByRole('button',{name:'Government Schemes'}));
  await screen.findByRole('button',{name:'Test Health Programme'});
  const search=screen.getByPlaceholderText('Search schemes, benefits or keywords');
  await ui.type(search, 'rare test benefit');
  await waitFor(()=>expect(requests.some(r=>r.path==='/api/schemes'&&r.query.includes('rare+test+benefit'))).toBe(true));
  await ui.selectOptions(screen.getByRole('combobox',{name:'Filter by category'}),'Health cover');
  await waitFor(()=>expect(requests.some(r=>r.query.includes('category=Health+cover'))).toBe(true));
  await ui.click(await screen.findByRole('button',{name:'Test Health Programme'}));
  const dialog=await screen.findByRole('dialog');
  expect(within(dialog).getByText(/Verify with the authority/)).toBeTruthy();
  await ui.click(within(dialog).getByRole('button',{name:'Save scheme'}));
  await within(dialog).findByRole('button',{name:'Saved scheme'});
  expect(requests.some(r=>r.path==='/api/schemes/test-health/saved'&&r.method==='PUT')).toBe(true);
  await ui.click(within(dialog).getByRole('button',{name:'Saved scheme'}));
  await within(dialog).findByRole('button',{name:'Save scheme'});
  expect(requests.some(r=>r.path==='/api/schemes/test-health/saved'&&r.method==='DELETE')).toBe(true);
  vi.unstubAllGlobals();
}, 15000);
