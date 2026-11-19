// @vitest-environment jsdom
import React from 'react';
import {test,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportScanner from '../src/ReportScanner';
import {reportApi} from '../src/services/reports';
vi.mock('../src/services/reports',()=>({reportApi:{status:vi.fn(),scan:vi.fn(),history:vi.fn(),remove:vi.fn(),clear:vi.fn()}}));
const PageHeading=({title})=><h1>{title}</h1>;
const item={id:'abc',name:'report.png',pages:1,text:'Haemoglobin: 13.2 g/dL',information:{fields:[],measurements:['Haemoglobin: 13.2 g/dL']},createdAt:'2026-01-01T00:00:00Z'};
test('scanner asks for consent and saves only when opted in; history can be deleted',async()=>{
 reportApi.status.mockResolvedValue({ocrAvailable:true,historyAvailable:true});reportApi.scan.mockResolvedValue({report:item,saved:true});reportApi.history.mockResolvedValue({reports:[item]});reportApi.remove.mockResolvedValue();window.confirm=vi.fn(()=>true);
 render(<ReportScanner PageHeading={PageHeading}/>);let u=userEvent.setup();await waitFor(()=>expect(reportApi.status).toHaveBeenCalled());
 const file=new File(['image bytes'],'report.png',{type:'image/png'});await u.upload(screen.getByLabelText('Choose report file'),file);await u.click(screen.getByRole('button',{name:'Scan / Extract text'}));expect(reportApi.scan).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toMatch(/consent/);
 await u.click(screen.getByRole('checkbox',{name:/I consent/}));await u.click(screen.getByRole('checkbox',{name:/Save the extracted text/}));await u.click(screen.getByRole('button',{name:'Scan / Extract text'}));await screen.findByRole('heading',{name:'Extracted report information'});expect(reportApi.scan).toHaveBeenCalledWith(file,true);expect(screen.getAllByText('Haemoglobin: 13.2 g/dL').length).toBeGreaterThan(0);
 await u.click(screen.getByRole('button',{name:'Load saved reports'}));await screen.findByRole('button',{name:'Delete report.png'});await u.click(screen.getByRole('button',{name:'Delete report.png'}));await screen.findByText('No saved reports.');expect(reportApi.remove).toHaveBeenCalledWith('abc');expect(screen.queryByRole('heading',{name:'Extracted report information'})).toBeNull();
});

test('choosing an invalid replacement clears the previous report',async()=>{
 const {cleanup}=await import('@testing-library/react');cleanup();
 reportApi.status.mockResolvedValue({ocrAvailable:true,historyAvailable:true});render(<ReportScanner PageHeading={PageHeading}/>);const u=userEvent.setup({applyAccept:false});await waitFor(()=>expect(screen.getByRole('checkbox',{name:/Save the extracted text/}).disabled).toBe(false));
 await u.upload(screen.getByLabelText('Choose report file'),new File(['valid'],'first.png',{type:'image/png'}));expect(screen.getByText('first.png')).toBeTruthy();await u.upload(screen.getByLabelText('Choose report file'),new File(['bad'],'bad.txt',{type:'text/plain'}));expect(screen.queryByText('first.png')).toBeNull();expect(screen.getByRole('alert').textContent).toMatch(/PDF, JPG or PNG/);expect(screen.getByRole('button',{name:'Scan / Extract text'}).disabled).toBe(true);
});
