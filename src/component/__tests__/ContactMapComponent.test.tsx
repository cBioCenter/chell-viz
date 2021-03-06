import { mount, shallow } from 'enzyme';
import * as plotly from 'plotly.js-gl3d-dist-min';
import * as React from 'react';

import { ContactMapComponent } from '~bioblocks-viz~/component';
import {
  Bioblocks1DSection,
  BioblocksPDB,
  CouplingContainer,
  IContactMapData,
  ICouplingScore,
  SECONDARY_STRUCTURE,
  SECONDARY_STRUCTURE_KEYS,
} from '~bioblocks-viz~/data';
import { dispatchPlotlyEvent, dispatchPlotlySelectionEvent, getAsyncMountedComponent } from '~bioblocks-viz~/test';

describe('ContactMapComponent', () => {
  let emptyData: IContactMapData;
  let sampleContactsWithAminoAcids: ICouplingScore[];
  let sampleCorrectPredictedContacts: ICouplingScore[];
  let sampleIncorrectPredictedContacts: ICouplingScore[];
  let sampleOutOfLinearDistContacts: ICouplingScore[];
  let sampleData: IContactMapData;
  let sampleDataWithAminoAcid: IContactMapData;
  let uniqueScores: Set<ICouplingScore>;
  let sampleObservedContacts: ICouplingScore[];

  beforeEach(() => {
    jest.resetModuleRegistry();

    emptyData = {
      couplingScores: new CouplingContainer(),
      secondaryStructures: [],
    };

    sampleContactsWithAminoAcids = [
      generateCouplingScore(1, 10, 1.3, { A_i: 'N', A_j: 'I' }),
      generateCouplingScore(10, 1, 1.3, { A_i: 'I', A_j: 'N' }),
    ];
    sampleCorrectPredictedContacts = [generateCouplingScore(56, 50, 2.4)];
    sampleIncorrectPredictedContacts = [generateCouplingScore(42, 50, 20.4)];
    sampleOutOfLinearDistContacts = [
      generateCouplingScore(45, 46, 1.3),
      generateCouplingScore(44, 45, 1.3),
      generateCouplingScore(56, 57, 1.3),
    ];

    sampleObservedContacts = [...sampleCorrectPredictedContacts, generateCouplingScore(41, 52, 1.3)];

    uniqueScores = new Set(
      Array.from([
        ...sampleCorrectPredictedContacts,
        ...sampleIncorrectPredictedContacts,
        ...sampleObservedContacts,
        ...sampleOutOfLinearDistContacts,
      ]),
    );

    sampleData = {
      couplingScores: new CouplingContainer(
        Array.from(uniqueScores).map((value, index) => ({
          dist: value.dist,
          i: value.i,
          j: value.j,
        })),
      ),
      secondaryStructures: [
        [
          {
            end: 31,
            label: 'C',
            length: 2,
            start: 30,
          },
        ],
      ] as SECONDARY_STRUCTURE[],
    };

    sampleDataWithAminoAcid = {
      couplingScores: new CouplingContainer(sampleContactsWithAminoAcids),
      secondaryStructures: [],
    };
  });

  const generateCouplingScore = (
    i: number,
    j: number,
    dist: number,
    extra?: Partial<ICouplingScore>,
  ): ICouplingScore => ({
    dist,
    i,
    j,
    ...extra,
  });
  // Translated from example1/coupling_scores.csv

  describe('Snapshots', () => {
    it('Should match existing snapshot when given no data.', () => {
      expect(shallow(<ContactMapComponent />)).toMatchSnapshot();
    });

    it('Should match existing snapshot when given empty data.', () => {
      expect(shallow(<ContactMapComponent data={emptyData} />)).toMatchSnapshot();
    });

    it('Should match snapshot when locked residues are added.', async () => {
      const wrapper = await getAsyncMountedComponent(<ContactMapComponent data={sampleData} />);
      const expectedSelectedPoints = new Map(
        Object.entries({
          '37,46': [37, 46],
          8: [8],
        }),
      );
      wrapper.setProps({
        lockedResiduePairs: expectedSelectedPoints,
      });
      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('Should match existing snapshot when given basic data.', () => {
      expect(shallow(<ContactMapComponent data={sampleData} />)).toMatchSnapshot();
    });

    it('Should match existing snapshot when given data with amino acids.', () => {
      expect(shallow(<ContactMapComponent data={sampleDataWithAminoAcid} />)).toMatchSnapshot();
    });

    it('Should match existing snapshot when given data with a PDB.', async () => {
      const pdbData = { experimental: await BioblocksPDB.createPDB() };
      expect(shallow(<ContactMapComponent data={{ ...sampleDataWithAminoAcid, pdbData }} />)).toMatchSnapshot();
    });

    it('Should match existing snapshot when a single point are hovered.', () => {
      expect(
        shallow(
          <ContactMapComponent
            data={sampleData}
            hoveredResidues={[sampleData.couplingScores.getObservedContacts()[0].i]}
          />,
        ),
      ).toMatchSnapshot();
    });

    it('Should match existing snapshot when multiple points are hovered.', () => {
      const contact = sampleData.couplingScores.getObservedContacts()[0];
      expect(
        shallow(<ContactMapComponent data={sampleData} hoveredResidues={[contact.i, contact.j]} />),
      ).toMatchSnapshot();
    });

    it('Should match existing snapshot when multiple points are selected.', () => {
      const contacts = sampleData.couplingScores.getObservedContacts();
      const wrapper = shallow(
        <ContactMapComponent
          data={sampleData}
          hoveredResidues={[contacts[0].i, contacts[0].j]}
          lockedResiduePairs={{
            '41,52': [41, 52],
          }}
        />,
      );
      wrapper.setProps({
        hoveredResidues: [contacts[0].i, contacts[0].j],
        lockedResiduePairs: {
          '41,52': [41, 52],
          '50,56': [50, 56],
        },
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('Callbacks', async () => {
    it('Should invoke callback to add locked residues when a click event is fired.', async () => {
      const onClickSpy = jest.fn();
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent data={sampleData} toggleLockedResiduePair={onClickSpy} />,
      );
      await dispatchPlotlyEvent(wrapper, 'plotly_click');

      expect(onClickSpy).toHaveBeenCalledTimes(1);
    });

    it('Should invoke callback to add hovered residues when a hover event is fired.', async () => {
      const onHoverSpy = jest.fn();
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent data={sampleData} addHoveredResidues={onHoverSpy} />,
      );
      await dispatchPlotlyEvent(wrapper, 'plotly_hover');

      expect(onHoverSpy).toHaveBeenCalledTimes(1);
    });

    it('Should invoke callback to remove hovered residues when the mouse leaves.', async () => {
      const onHoverSpy = jest.fn();
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent data={sampleData} removeHoveredResidues={onHoverSpy} />,
      );
      await dispatchPlotlyEvent(wrapper, 'plotly_unhover');

      expect(onHoverSpy).toHaveBeenCalledTimes(1);
    });

    it('Should invoke callback for selected residues when a click event is fired.', async () => {
      const onSelectedSpy = jest.fn();
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent data={sampleData} onBoxSelection={onSelectedSpy} />,
      );
      await dispatchPlotlySelectionEvent(wrapper);
      expect(onSelectedSpy).toHaveBeenLastCalledWith([0, 0]);
    });

    it('Should invoke callback for adding a secondary structure when a mouse clicks it the first time.', async () => {
      const addSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 0, 10);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          addSelectedSecondaryStructure={addSecondaryStructureSpy}
        />,
      );
      const data = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: [0],
        y: [0],
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_click', data);
      expect(addSecondaryStructureSpy).toHaveBeenLastCalledWith(testSecStruct);
    });

    it('Should invoke callback for removing a secondary structure when a mouse clicks one that is already locked.', async () => {
      const removeSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 0, 10);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          removeSecondaryStructure={removeSecondaryStructureSpy}
          selectedSecondaryStructures={[testSecStruct]}
        />,
      );
      const data = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: [0],
        y: [0],
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_click', data);
      expect(removeSecondaryStructureSpy).toHaveBeenLastCalledWith(testSecStruct);
    });

    it('Should invoke callback for toggling a secondary structure when a mouse hovers over it.', async () => {
      const toggleSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 0, 10);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          addHoveredSecondaryStructure={toggleSecondaryStructureSpy}
        />,
      );
      const data = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: [0],
        y: [0],
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_hover', data);
      expect(toggleSecondaryStructureSpy).toHaveBeenLastCalledWith(testSecStruct);
    });

    it('Should not invoke callback for toggling a secondary structure when a mouse hovers over a different structure.', async () => {
      const toggleSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 10, 11);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          addHoveredSecondaryStructure={toggleSecondaryStructureSpy}
        />,
      );
      const data = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: [0],
        y: [0],
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_hover', data);
      expect(toggleSecondaryStructureSpy).not.toHaveBeenCalled();
    });

    it('Should invoke callback for removing a secondary structure when a mouse leaves it.', async () => {
      const removeSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 0, 10);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          hoveredSecondaryStructures={[testSecStruct]}
          removeHoveredSecondaryStructure={removeSecondaryStructureSpy}
          selectedSecondaryStructures={[]}
        />,
      );
      const data: Partial<plotly.PlotScatterDataPoint> = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: 0,
        y: 0,
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_unhover', data);
      expect(removeSecondaryStructureSpy).toHaveBeenLastCalledWith(testSecStruct);
    });

    it('Should not invoke callback for toggling a secondary structure when a mouse leaves a different structure.', async () => {
      const toggleSecondaryStructureSpy = jest.fn();
      const testSecStruct = new Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>('C', 10, 11);
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={{
            ...sampleData,
            secondaryStructures: [[testSecStruct]],
          }}
          addHoveredSecondaryStructure={toggleSecondaryStructureSpy}
        />,
      );
      const data: Partial<plotly.PlotScatterDataPoint> = {
        data: { type: 'scattergl', xaxis: 'x2' } as any,
        x: 0,
        y: 0,
      };
      await dispatchPlotlyEvent(wrapper, 'plotly_unhover', data);
      expect(toggleSecondaryStructureSpy).not.toHaveBeenCalled();
    });

    it('Should _not_ clear residues when given new data.', async () => {
      const onClearResidueSpy = jest.fn();
      const wrapper = await getAsyncMountedComponent(<ContactMapComponent data={sampleData} />);
      wrapper.update();
      wrapper.setProps({
        data: emptyData,
      });
      wrapper.update();
      expect(onClearResidueSpy).toHaveBeenCalledTimes(0);
    });

    it('Should invoke callback for clearing all selections when clicked.', async () => {
      const mocks = [jest.fn(), jest.fn(), jest.fn()];
      const wrapper = await getAsyncMountedComponent(
        <ContactMapComponent
          data={sampleData}
          selectedSecondaryStructures={sampleData.secondaryStructures[0]}
          removeAllLockedResiduePairs={mocks[0]}
          removeAllSelectedSecondaryStructures={mocks[1]}
          removeHoveredResidues={mocks[2]}
        />,
      );
      wrapper.find('a[children="Clear Selections"]').simulate('click');
      mocks.forEach(mock => {
        expect(mock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Configuration', () => {
    it('Should handle the node size being changed.', () => {
      const wrapper = mount(<ContactMapComponent />);
      const instance = wrapper.instance() as ContactMapComponent;
      const expected = 10;
      expect(instance.state.pointsToPlot[0].nodeSize).not.toEqual(expected);

      instance.onNodeSizeChange(0, expected)();
      expect(instance.state.pointsToPlot[0].nodeSize).toEqual(expected);
    });
  });
});
