import {test,expect} from 'vitest';
import {officialUrl} from '../src/services/officialUrl';
test('scheme links only open trusted HTTPS government-domain URLs',()=>{
 expect(officialUrl('https://nha.gov.in/PM-JAY')).toBe('https://nha.gov.in/PM-JAY');
 for(const value of ['javascript:alert(1)','https://gov.in.evil.test/','https://evil.test/?q=gov.in','http://nha.gov.in/','https://nha.gov.in@evil.test/','https://nha.gov.in:444/',''])expect(officialUrl(value)).toBeNull();
});
