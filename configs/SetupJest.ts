import { configure } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const jestGlobal = global as any;
// tslint:disable-next-line:no-var-requires
jestGlobal.fetch = require('jest-fetch-mock');

// Mock out createObjectURL since it is not available in a fake browser.
jestGlobal.window.URL.createObjectURL = jest.fn();

export interface IMockDict {
  [key: string]: jest.Mock<{}>;
}