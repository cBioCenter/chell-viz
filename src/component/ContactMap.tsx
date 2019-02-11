import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { createContainerActions, createResiduePairActions } from '~chell-viz~/action';
import {
  ComponentCard,
  ContactMapChart,
  generateChartDataEntry,
  IContactMapChartData,
  IContactMapChartPoint,
} from '~chell-viz~/component';
import {
  CHELL_CSS_STYLE,
  ChellChartEvent,
  ChellWidgetConfig,
  CONFIGURATION_COMPONENT_TYPE,
  CouplingContainer,
  IContactMapData,
  ICouplingScore,
  RESIDUE_TYPE,
  SECONDARY_STRUCTURE,
  SECONDARY_STRUCTURE_SECTION,
  SliderWidgetConfig,
} from '~chell-viz~/data';
import { EMPTY_FUNCTION } from '~chell-viz~/helper';
import { ILockedResiduePair } from '~chell-viz~/reducer';
import { getCandidates, getHovered, getLocked, selectCurrentItems } from '~chell-viz~/selector';

export type CONTACT_MAP_CB_RESULT_TYPE = ICouplingScore;
export type ContactMapCallback = (coupling: CONTACT_MAP_CB_RESULT_TYPE) => void;

export interface IContactMapProps {
  candidateResidues: RESIDUE_TYPE[];
  configurations: ChellWidgetConfig[];
  data: IContactMapData;
  formattedPoints: IContactMapChartData[];
  height: number | string;
  highlightColor: string;
  hoveredResidues: RESIDUE_TYPE[];
  hoveredSecondaryStructures: SECONDARY_STRUCTURE_SECTION[];
  isDataLoading: boolean;
  lockedResiduePairs: ILockedResiduePair;
  observedColor: string;
  selectedSecondaryStructures: SECONDARY_STRUCTURE;
  showConfigurations: boolean;
  style?: CHELL_CSS_STYLE;
  width: number | string;
  addHoveredResidues(residues: RESIDUE_TYPE[]): void;
  addHoveredSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  addSelectedSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  removeAllLockedResiduePairs(): void;
  removeSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  removeHoveredResidues(): void;
  removeHoveredSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  onBoxSelection?(residues: RESIDUE_TYPE[]): void;
  toggleLockedResiduePair(residuePair: ILockedResiduePair): void;
}

export const initialContactMapState = {
  pointsToPlot: new Array<IContactMapChartData>(),
};

export type ContactMapState = Readonly<typeof initialContactMapState>;

export class ContactMapClass extends React.Component<IContactMapProps, ContactMapState> {
  public static defaultProps = {
    addHoveredResidues: EMPTY_FUNCTION,
    addHoveredSecondaryStructure: EMPTY_FUNCTION,
    addSelectedSecondaryStructure: EMPTY_FUNCTION,
    candidateResidues: [],
    configurations: new Array<ChellWidgetConfig>(),
    data: {
      couplingScores: new CouplingContainer(),
      secondaryStructures: new Array<SECONDARY_STRUCTURE>(),
    },
    enableSliders: true,
    formattedPoints: new Array<IContactMapChartData>(),
    height: '100%',
    highlightColor: '#ff8800',
    hoveredResidues: [],
    hoveredSecondaryStructures: [],
    isDataLoading: false,
    lockedResiduePairs: {},
    observedColor: '#0000ff',
    removeAllLockedResiduePairs: EMPTY_FUNCTION,
    removeHoveredResidues: EMPTY_FUNCTION,
    removeHoveredSecondaryStructure: EMPTY_FUNCTION,
    removeSecondaryStructure: EMPTY_FUNCTION,
    selectedSecondaryStructures: [],
    showConfigurations: true,
    toggleLockedResiduePair: EMPTY_FUNCTION,
    width: '100%',
  };

  public readonly state: ContactMapState = initialContactMapState;

  constructor(props: IContactMapProps) {
    super(props);
  }

  public componentDidMount() {
    this.setupPointsToPlot(this.props.data.couplingScores);
  }

  public componentDidUpdate(prevProps: IContactMapProps) {
    const { data, lockedResiduePairs } = this.props;
    if (data !== prevProps.data || lockedResiduePairs !== prevProps.lockedResiduePairs) {
      this.setupPointsToPlot(data.couplingScores);
    }
  }

  public render() {
    const { configurations, removeAllLockedResiduePairs } = this.props;
    const { pointsToPlot } = this.state;

    return this.renderContactMapChart(pointsToPlot, [
      {
        name: 'Clear Selections',
        onClick: removeAllLockedResiduePairs,
        type: CONFIGURATION_COMPONENT_TYPE.BUTTON,
      },
      ...configurations,
      ...this.generateNodeSizeSliderConfigs(pointsToPlot),
    ]);
  }

  public onNodeSizeChange = (index: number) => (value: number) => {
    const { pointsToPlot } = this.state;

    this.setState({
      pointsToPlot: [
        ...pointsToPlot.slice(0, index),
        {
          ...pointsToPlot[index],
          nodeSize: value,
        },
        ...pointsToPlot.slice(index + 1),
      ],
    });
  };

  protected setupPointsToPlot(couplingContainer: CouplingContainer) {
    const { data, lockedResiduePairs, hoveredResidues, formattedPoints, observedColor, highlightColor } = this.props;
    const { pointsToPlot } = this.state;

    const chartNames = {
      selected: 'Selected Residue Pairs',
      structure: `${data.pdbData ? (data.pdbData.known ? 'Known' : 'Predicted') : 'Unknown'} Structure Contact`,
    };

    const knownPointsIndex = pointsToPlot.findIndex(entry => entry.name === chartNames.structure);
    const selectedPointIndex = pointsToPlot.findIndex(entry => entry.name === chartNames.selected);

    const observedContactPoints = couplingContainer.getObservedContacts();
    const result = new Array<IContactMapChartData>(
      generateChartDataEntry(
        'text',
        { start: observedColor, end: 'rgb(100,177,200)' },
        chartNames.structure,
        '(from PDB structure)',
        knownPointsIndex >= 0 ? pointsToPlot[knownPointsIndex].nodeSize : 4,
        observedContactPoints,
        {
          text: observedContactPoints.map(point => {
            const score = couplingContainer.getCouplingScore(point.i, point.j);

            return score && score.A_i && score.A_j
              ? `(${point.i}${score.A_i}, ${point.j}${score.A_j})`
              : `(${point.i}, ${point.j})`;
          }),
        },
      ),
      ...formattedPoints,
    );

    const chartPoints = new Array<IContactMapChartPoint>();

    if (hoveredResidues.length >= 1) {
      chartPoints.push({
        i: hoveredResidues[0],
        j: hoveredResidues.length === 1 ? hoveredResidues[0] : hoveredResidues[1],
      });
    }

    if (Object.keys(lockedResiduePairs).length >= 1) {
      chartPoints.push(
        ...Array.from(Object.keys(lockedResiduePairs)).reduce((reduceResult: IContactMapChartPoint[], key) => {
          const keyPair = lockedResiduePairs[key];
          if (keyPair && keyPair.length === 2) {
            reduceResult.push({ i: keyPair[0], j: keyPair[1], dist: 0 });
          }

          return reduceResult;
        }, new Array<IContactMapChartPoint>()),
      );
    }

    result.push(
      generateChartDataEntry(
        'none',
        highlightColor,
        chartNames.selected,
        '',
        selectedPointIndex >= 0 ? pointsToPlot[selectedPointIndex].nodeSize : 6,
        chartPoints,
        {
          marker: {
            color: new Array<string>(chartPoints.length * 2).fill(highlightColor),
            line: {
              color: highlightColor,
              width: 3,
            },
            symbol: 'circle-open',
          },
        },
      ),
    );

    this.setState({
      ...this.state,
      pointsToPlot: [...result],
    });
  }

  protected renderContactMapChart(pointsToPlot: IContactMapChartData[], configurations: ChellWidgetConfig[]) {
    const {
      candidateResidues,
      data,
      onBoxSelection,
      selectedSecondaryStructures,
      showConfigurations,
      addHoveredResidues,
      removeHoveredResidues,
      toggleLockedResiduePair,
    } = this.props;

    return (
      <ComponentCard componentName={'Contact Map'}>
        <div style={{ height: '90%', width: '100%' }}>
          <ContactMapChart
            candidateResidues={candidateResidues}
            configurations={configurations}
            contactData={pointsToPlot}
            onClickCallback={this.onMouseClick(toggleLockedResiduePair)}
            onHoverCallback={this.onMouseEnter(addHoveredResidues)}
            onSelectedCallback={this.onMouseSelect(onBoxSelection)}
            onUnHoverCallback={this.onMouseLeave(removeHoveredResidues)}
            range={data.couplingScores.residueIndexRange.max + 20}
            secondaryStructures={data.secondaryStructures ? data.secondaryStructures : []}
            selectedSecondaryStructures={[selectedSecondaryStructures]}
            showConfigurations={showConfigurations}
          />
        </div>
      </ComponentCard>
    );
  }

  protected generateNodeSizeSliderConfigs = (entries: IContactMapChartData[]) =>
    entries.map(
      (entry, index): SliderWidgetConfig => {
        return {
          id: `node-size-slider-${index}`,
          name: `Node size for ${entry.name}`,
          onChange: this.onNodeSizeChange(index),
          type: CONFIGURATION_COMPONENT_TYPE.SLIDER,
          values: {
            current: entry.nodeSize,
            max: 20,
            min: 1,
          },
        };
      },
    );

  protected onMouseEnter = (cb: (residue: RESIDUE_TYPE[]) => void) => (e: ChellChartEvent) => {
    if (e.isAxis()) {
      const { addHoveredSecondaryStructure, hoveredSecondaryStructures, data } = this.props;

      for (const secondaryStructure of data.secondaryStructures) {
        for (const section of secondaryStructure) {
          if (
            section.contains(...e.selectedPoints) &&
            !hoveredSecondaryStructures.find(
              secStruct =>
                secStruct.end === section.end && secStruct.label === section.label && secStruct.start === section.start,
            )
          ) {
            addHoveredSecondaryStructure(section);
          }
        }
      }
    } else {
      cb(e.selectedPoints);
    }
  };

  protected onMouseLeave = (cb?: (residue: RESIDUE_TYPE[]) => void) => (e: ChellChartEvent) => {
    if (e.isAxis()) {
      const { data, hoveredSecondaryStructures, removeHoveredSecondaryStructure } = this.props;

      for (const secondaryStructure of data.secondaryStructures) {
        for (const section of secondaryStructure) {
          const searchResult = hoveredSecondaryStructures.find(
            secStruct =>
              secStruct.end === section.end && secStruct.label === section.label && secStruct.start === section.start,
          );
          if (section.contains(...e.selectedPoints) && searchResult) {
            removeHoveredSecondaryStructure(searchResult);
          }
        }
      }
    } else if (cb) {
      cb(e.selectedPoints);
    }
  };

  protected onMouseClick = (cb: (residues: ILockedResiduePair) => void) => (e: ChellChartEvent) => {
    if (e.isAxis()) {
      const { addSelectedSecondaryStructure, data, removeSecondaryStructure, selectedSecondaryStructures } = this.props;

      for (const secondaryStructure of data.secondaryStructures) {
        for (const section of secondaryStructure) {
          if (section.contains(...e.selectedPoints)) {
            if (selectedSecondaryStructures.includes(section)) {
              removeSecondaryStructure(section);
            } else {
              addSelectedSecondaryStructure(section);
            }
          }
        }
      }
    } else {
      cb({ [e.selectedPoints.sort().toString()]: e.selectedPoints });
    }
  };

  protected onMouseSelect = (cb?: (residues: RESIDUE_TYPE[]) => void) => (e: ChellChartEvent) => {
    if (cb) {
      // For the contact map, all the x/y values are mirrored and correspond directly with i/j values.
      // Thus, all the residue numbers can be obtained by getting either all x or values from ths selected points.
      cb(e.selectedPoints.map(point => point));
    }
  };
}

const mapStateToProps = (state: { [key: string]: any }) => ({
  candidateResidues: getCandidates(state).toArray(),
  hoveredResidues: getHovered(state).toArray(),
  hoveredSecondaryStructures: selectCurrentItems<SECONDARY_STRUCTURE_SECTION>(
    state,
    'secondaryStructure/hovered',
  ).toArray(),
  lockedResiduePairs: getLocked(state).toJS(),
  selectedSecondaryStructures: selectCurrentItems<SECONDARY_STRUCTURE_SECTION>(
    state,
    'secondaryStructure/selected',
  ).toArray(),
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      addHoveredResidues: createResiduePairActions().hovered.set,
      addHoveredSecondaryStructure: createContainerActions('secondaryStructure/hovered').add,
      addSelectedSecondaryStructure: createContainerActions('secondaryStructure/selected').add,
      removeAllLockedResiduePairs: createResiduePairActions().locked.clear,
      removeHoveredResidues: createResiduePairActions().hovered.clear,
      removeHoveredSecondaryStructure: createContainerActions('secondaryStructure/hovered').remove,
      removeSecondaryStructure: createContainerActions('secondaryStructure/selected').remove,
      toggleLockedResiduePair: createResiduePairActions().locked.toggle,
    },
    dispatch,
  );

export const ContactMap = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContactMapClass);
