// @vitest-environment jsdom
import React from 'react';
import {test,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportScanner from '../src/ReportScanner';
import {reportApi} from '../src/services/reports';
vi.mock('../src/services/reports',()=>({reportApi:{status:vi.fn(),scan:vi.fn(),mockScan:vi.fn(),history:vi.fn(),remove:vi.fn(),clear:vi.fn()}}));
test('mock report sends no file and shows a clearly fictional result',async()=>{
 reportApi.status.mockResolvedValue({mock:true,ocrAvailable:false,historyAvailable:true});reportApi.mockScan.mockResolvedValue({report:{id:null,name:'Sample report (fictional)',pages:1,text:'Sample Patient',simulation:true,information:{fields:[],measurements:[]}}});
 render(<ReportScanner PageHeading={({title})=><h1>{title}</h1>}/>);const user=userEvent.setup();await screen.findByText('Simulation only.');await user.click(screen.getByRole('checkbox',{name:/I understand this is a fictional sample/}));await user.click(screen.getByRole('button',{name:'Generate sample result'}));await screen.findByRole('heading',{name:'Example report information'});expect(reportApi.mockScan).toHaveBeenCalledWith(false);expect(reportApi.scan).not.toHaveBeenCalled();expect(screen.getByText(/not extracted from your file/)).toBeTruthy();
});
