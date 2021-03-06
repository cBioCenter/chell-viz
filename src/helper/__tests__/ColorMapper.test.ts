import { ColorMapper } from '~bioblocks-viz~/helper';

describe('ColorMapper', () => {
  it('Should use a default set of colors when none are provided.', () => {
    const expected = ['red', 'green', 'blue', 'orange', 'purple', 'teal', 'pink', 'yellow', 'violet', 'olive', 'brown'];
    const mapper = new ColorMapper();
    expect(mapper.colors).toEqual(expected);
  });

  it('Should allow a custom set of colors to be supplied.', () => {
    const expected = ['white', 'black'];
    const mapper = new ColorMapper(new Map(), 'black', expected);
    expect(mapper.colors).toEqual(expected);
  });

  it('Should assign unique colors to each new key and cycle back when exhausted.', () => {
    const expectedColor = 'black';
    const mapper = new ColorMapper(new Map(), expectedColor, ['white', 'black']);
    mapper.addEntry('Lucas');
    mapper.addEntry('Ness');
    mapper.addEntry('Mario');
    expect(mapper.getColorFor('Lucas')).toEqual(expectedColor);
    expect(mapper.getColorFor('Ness')).toEqual(expectedColor);
    expect(mapper.getColorFor('Mario')).toEqual(expectedColor);
  });

  it('Should allow colors to be added for a key on first access if none currently exists.', () => {
    const expectedColor = 'black';
    const mapper = new ColorMapper(new Map(), 'black', ['white']);
    expect(mapper.getColorFor('Lucas')).toEqual(expectedColor);
    expect(mapper.getColorFor('Ness')).toEqual(expectedColor);
    expect(mapper.getColorFor('Mario')).toEqual(expectedColor);
  });

  it('Should allow colors to be provided when creating an entry.', () => {
    const expected = ['orange', 'blue', 'red'];
    const mapper = new ColorMapper(new Map(), 'black', ['white']);
    mapper.addEntry('Lucas', 'orange');
    mapper.addEntry('Ness', 'blue');
    mapper.addEntry('Mario', 'red');
    expect(mapper.getColorFor('Lucas')).toEqual(expected[0]);
    expect(mapper.getColorFor('Ness')).toEqual(expected[1]);
    expect(mapper.getColorFor('Mario')).toEqual(expected[2]);
  });

  it('Should allow user to opt-out of adding color to be included in the rotation for possible colors.', () => {
    const expected = ['white', 'black'];
    const mapper = new ColorMapper(new Map(), 'black', ['white', 'black']);
    mapper.addEntry('Lucas', 'orange', false);
    expect(mapper.getColorFor('Lucas')).toEqual('orange');
    expect(mapper.colors).toEqual(expected);
  });
});
