// @vitest-environment jsdom
import {test,expect,vi} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
test('mock account is clearly labelled and shows fictional hospital map',async()=>{
 localStorage.clear();localStorage.setItem('sahaara-mode',JSON.stringify('account'));document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();const user={id:'mock-id',name:'Mock Tester',age:30,state:'Uttar Pradesh',language:'English'};
 vi.stubGlobal('fetch',vi.fn(async url=>{const path=new URL(url,'http://localhost').pathname;const ok=body=>({ok:true,status:200,json:async()=>body});if(path==='/api/auth/me')return ok({user,dataMode:'mock'});if(path==='/api/schemes')return ok({schemes:[]});if(path==='/api/schemes/saved')return ok({saved:[]});throw Error(path)}));
 await import('../src/main.jsx');await screen.findByText(/Local mock data mode/);expect(screen.getByText('MOCK DATA')).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Hospital Finder'}));await screen.findByText(/Facilities, addresses and departments below are fictional sample data/);vi.unstubAllGlobals();
});
