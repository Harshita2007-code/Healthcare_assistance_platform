// @vitest-environment jsdom
import React from 'react';
import {test,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HospitalFinder from '../src/HospitalFinder';
import {hospitalApi} from '../src/services/hospitals';
vi.mock('../src/services/hospitals',()=>({hospitalApi:{status:vi.fn(),geocode:vi.fn(),nearby:vi.fn()}}));
vi.mock('leaflet',()=>({default:{map:()=>({setView(){return this},remove(){},panTo(){}}),tileLayer:()=>({addTo(){}}),layerGroup:()=>({addTo(){return this},clearLayers(){}}),marker:()=>({on(){},addTo(){}}),divIcon:()=>({})}}));
const Demo=()=> <div>Fictional demo map</div>;const PageHeading=({title,action})=><div><h1>{title}</h1>{action}</div>;
test('real search requires consent, locates and filters mapped hospitals, selects a mapped result',async()=>{
 hospitalApi.status.mockResolvedValue({configured:true});hospitalApi.geocode.mockResolvedValue({locations:[{name:'Delhi, India',lat:28.6,lon:77.2}]});hospitalApi.nearby.mockResolvedValue({hospitals:[{id:'node/1',name:'Example real result',type:'Government',address:'Delhi',departments:['Emergency'],distanceKm:1.2,lat:28.6,lon:77.2}]});
 render(<HospitalFinder Demo={Demo} PageHeading={PageHeading}/>);let u=userEvent.setup();await screen.findByText(/Community-sourced, not verified/);
 await u.type(screen.getByLabelText('Search city or area'),'Delhi');await u.click(screen.getByRole('button',{name:'Search place'}));expect(hospitalApi.geocode).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toMatch(/privacy notice/);
 await u.click(screen.getByRole('checkbox'));await u.click(screen.getByRole('button',{name:'Search place'}));await u.click(await screen.findByRole('button',{name:/Delhi, India/}));await screen.findByText('Example real result');expect(hospitalApi.nearby).toHaveBeenCalledWith({lat:'28.6',lon:'77.2',radius:'5',type:'',department:''});
 await u.selectOptions(screen.getByLabelText('Medical department'),'Emergency');await waitFor(()=>expect(hospitalApi.nearby).toHaveBeenLastCalledWith(expect.objectContaining({department:'Emergency'})));
 await u.click(screen.getByRole('button',{name:'Example real result Government Delhi Emergency 1.2 km away · straight line View on map'}));
 expect(screen.queryByText('Fictional demo map')).toBeNull();
});

test('unconfigured account finder does not silently substitute fictional facilities and can retry',async()=>{
 const {cleanup}=await import('@testing-library/react');cleanup();hospitalApi.status.mockReset().mockResolvedValueOnce({configured:false}).mockResolvedValueOnce({configured:true});
 render(<HospitalFinder Demo={Demo} PageHeading={PageHeading}/>);const u=userEvent.setup();await screen.findByText(/No hospital listings are displayed/);expect(screen.queryByText('Fictional demo map')).toBeNull();await u.click(screen.getByRole('button',{name:'Retry location search'}));await screen.findByText(/Community-sourced, not verified/);
});
