// ~bb-viz~
// Contact Map Component
// Component for displaying and interacting with Contact Map data in plotly.
// ~bb-viz~

import * as React from 'react';
import { ButtonProps, Checkbox, CheckboxProps, Icon, Label } from 'semantic-ui-react';

import {
  ComponentCard,
  ContactMapChart,
  generateChartDataEntry,
  IComponentMenuBarItem,
  IContactMapChartData,
  IContactMapChartPoint,
} from '~bioblocks-viz~/component';
import {
  BIOBLOCKS_CSS_STYLE,
  BioblocksChartEvent,
  BioblocksWidgetConfig,
  ButtonGroupWidgetConfig,
  CONFIGURATION_COMPONENT_TYPE,
  CouplingContainer,
  IContactMapData,
  ICouplingScore,
  RESIDUE_TYPE,
  SECONDARY_STRUCTURE,
  SECONDARY_STRUCTURE_KEYS,
  SECONDARY_STRUCTURE_SECTION,
} from '~bioblocks-viz~/data';
import { ColorMapper, EMPTY_FUNCTION, generateCouplingScoreHoverText } from '~bioblocks-viz~/helper';
import { LockedResiduePair } from '~bioblocks-viz~/reducer';

export type CONTACT_MAP_CB_RESULT_TYPE = ICouplingScore;
export type ContactMapCallback = (coupling: CONTACT_MAP_CB_RESULT_TYPE) => void;

export interface IContactMapComponentProps {
  configurations: BioblocksWidgetConfig[];
  /** Data for the Contact Map */
  data: IContactMapData;
  formattedPoints: IContactMapChartData[];
  /** Height of the component. */
  height: number | string;
  highlightColor: string;
  hoveredResidues: RESIDUE_TYPE[];
  hoveredSecondaryStructures: SECONDARY_STRUCTURE_SECTION[];
  isDataLoading: boolean;
  lockedResiduePairs: LockedResiduePair;
  /** Color to distinguish contacts that are considered 'observed' */
  observedColor: string;
  secondaryStructureColors?: ColorMapper<SECONDARY_STRUCTURE_KEYS>;
  selectedSecondaryStructures: SECONDARY_STRUCTURE;
  /** Controls whether button to change settings is shown. */
  showConfigurations: boolean;
  style?: BIOBLOCKS_CSS_STYLE;
  /** Width of the component. */
  width: number | string;
  addHoveredResidues(residues: RESIDUE_TYPE[]): void;
  addHoveredSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  addSelectedSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  onBoxSelection?(residues: RESIDUE_TYPE[]): void;
  removeAllLockedResiduePairs(): void;
  removeAllSelectedSecondaryStructures(): void;
  removeHoveredResidues(): void;
  removeHoveredSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  removeSecondaryStructure(section: SECONDARY_STRUCTURE_SECTION): void;
  toggleLockedResiduePair(residuePair: LockedResiduePair): void;
}

export const initialContactMapState = {
  pointsToPlot: new Array<IContactMapChartData>(),
};

export type ContactMapComponentState = Readonly<typeof initialContactMapState>;

/**
 * Presentational Component for the ContactMap.
 *
 * @extends {React.Component<IContactMapComponentProps, ContactMapComponentState>}
 */
export class ContactMapComponent extends React.Component<IContactMapComponentProps, ContactMapComponentState> {
  public static defaultProps = {
    addHoveredResidues: EMPTY_FUNCTION,
    addHoveredSecondaryStructure: EMPTY_FUNCTION,
    addSelectedSecondaryStructure: EMPTY_FUNCTION,
    configurations: new Array<BioblocksWidgetConfig>(),
    data: {
      couplingScores: new CouplingContainer(),
      pdbData: { experimental: undefined, predicted: undefined },
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
    removeAllSelectedSecondaryStructures: EMPTY_FUNCTION,
    removeHoveredResidues: EMPTY_FUNCTION,
    removeHoveredSecondaryStructure: EMPTY_FUNCTION,
    removeSecondaryStructure: EMPTY_FUNCTION,
    selectedSecondaryStructures: [],
    showConfigurations: true,
    toggleLockedResiduePair: EMPTY_FUNCTION,
    width: '100%',
  };

  public readonly state: ContactMapComponentState = initialContactMapState;

  constructor(props: IContactMapComponentProps) {
    super(props);
  }

  public componentDidMount() {
    this.setupPointsToPlot(this.props.data.couplingScores);
  }

  public componentDidUpdate(prevProps: IContactMapComponentProps) {
    const { data, lockedResiduePairs } = this.props;
    if (data !== prevProps.data || lockedResiduePairs !== prevProps.lockedResiduePairs) {
      this.setupPointsToPlot(data.couplingScores);
    }
  }

  public onNodeSelectionChange = (index: number) => (
    event?: React.MouseEvent<HTMLInputElement>,
    data?: CheckboxProps,
  ) => {
    const { pointsToPlot } = this.state;

    this.setState({
      pointsToPlot: [
        ...pointsToPlot.slice(0, index),
        {
          ...pointsToPlot[index],
          hoverinfo: pointsToPlot[index].hoverinfo === 'skip' ? 'text' : 'skip',
        },
        ...pointsToPlot.slice(index + 1),
      ],
    });
  };

  public onNodeSizeChange = (index: number, nodeSizeMod: number) => (
    event?: React.MouseEvent<HTMLButtonElement>,
    data?: ButtonProps,
  ) => {
    const { pointsToPlot } = this.state;

    this.setState({
      pointsToPlot: [
        ...pointsToPlot.slice(0, index),
        {
          ...pointsToPlot[index],
          // This ensures a number in the range [1, 10]. 0 is an invalid point size in plotly.
          nodeSize: Math.min(Math.max(Math.abs(pointsToPlot[index].nodeSize + nodeSizeMod), 1), 10),
        },
        ...pointsToPlot.slice(index + 1),
      ],
    });
  };

  public render() {
    const { pointsToPlot } = this.state;

    return this.renderContactMapChart(pointsToPlot);
  }

  /**
   * Given a chart data entry, sets node options if one is already set for this point.
   *
   * @param chartDatum A single chart data entry.
   */
  protected applySavedNodeOptions = (chartDatum: IContactMapChartData) => {
    const { pointsToPlot } = this.state;
    const index = pointsToPlot.findIndex(currentPoint => currentPoint.name === chartDatum.name);
    if (index >= 0) {
      return {
        ...chartDatum,
        hoverinfo: pointsToPlot[index].hoverinfo,
        nodeSize: pointsToPlot[index].nodeSize,
      };
    } else {
      return chartDatum;
    }
  };

  /**
   * Returns an {i, j} pair for a hovered residue. Handles case when a single residue is hovered.
   *
   * @param hoveredResidues Array of residues that are hovered.
   */
  protected generateHoveredResiduePairs = (hoveredResidues: RESIDUE_TYPE[]) => {
    if (hoveredResidues.length >= 1) {
      return [
        {
          i: hoveredResidues[0],
          j: hoveredResidues.length === 1 ? hoveredResidues[0] : hoveredResidues[1],
        },
      ];
    }

    return [];
  };

  /**
   * Returns contact map points for locked residue pairs.
   *
   * @param hoveredResidues Array of residues that are hovered.
   */
  protected generateLockedResiduePairs = (lockedResiduePairs: LockedResiduePair) => {
    const lockedResiduePairKeys = Object.keys(lockedResiduePairs);

    return lockedResiduePairKeys.reduce((reduceResult: IContactMapChartPoint[], key) => {
      const keyPair = lockedResiduePairs[key];
      if (keyPair && keyPair.length === 2) {
        reduceResult.push({ i: keyPair[0], j: keyPair[1], dist: 0 });
      }

      return reduceResult;
    }, new Array<IContactMapChartPoint>());
  };

  protected generateSelectedResiduesChartData = (
    highlightColor: string,
    chartName: string,
    nodeSize: number,
    chartPoints: IContactMapChartPoint[],
  ) => {
    return generateChartDataEntry('none', highlightColor, chartName, '', nodeSize, chartPoints, {
      marker: {
        color: new Array<string>(chartPoints.length * 2).fill(highlightColor),
        line: {
          color: highlightColor,
          width: 3,
        },
        symbol: 'circle-open',
      },
    });
  };

  /**
   * Gets the color from the provided chart entry.
   *
   * The following are checked in order - the first one found is the color returned:
   * - Marker's line color.
   * - Marker's color.
   * - Marker's colorscale.
   * - Line color.
   */
  protected getColorFromEntry = (entry: IContactMapChartData) => {
    if (entry.marker) {
      if (entry.marker.line && entry.marker.line.color) {
        return entry.marker.line.color;
      }
      if (entry.marker.color) {
        return Array.isArray(entry.marker.color) ? entry.marker.color[0] : entry.marker.color;
      }
      if (entry.marker.colorscale) {
        return Array.isArray(entry.marker.colorscale) ? entry.marker.colorscale[0][1] : entry.marker.colorscale;
      }
    }
    if (entry.line && entry.line.color) {
      return entry.line.color;
    }
  };

  protected getDockConfigs = () => [
    {
      isVisibleCb: () =>
        this.props.selectedSecondaryStructures.length >= 1 || Object.values(this.props.lockedResiduePairs).length >= 1,
      onClick: () => {
        this.props.removeAllLockedResiduePairs();
        this.props.removeAllSelectedSecondaryStructures();
        this.props.removeHoveredResidues();
      },
      text: 'Clear Selections',
    },
  ];

  protected getMenuConfigs = (
    Filters: BioblocksWidgetConfig[],
    pointsToPlot: IContactMapChartData[],
  ): IComponentMenuBarItem[] => [
    {
      component: {
        configs: { Filters },
        name: 'POPUP',
      },
      description: 'Filter',
      iconName: 'filter',
    },
    {
      component: {
        configs: this.getNodeOptionConfigs(pointsToPlot),
        name: 'POPUP',
      },
      description: 'Settings',
    },
  ];

  protected getNodeOptionConfigs = (entries: IContactMapChartData[]) => ({
    'Node Options': new Array<ButtonGroupWidgetConfig>(
      {
        id: 'stuff-1-2-3',
        name: '',
        // prettier-ignore
        options: [(
          <Label basic={true} style={{border: 0}} key={'node-selection-label'}>
            Selectable?
          </Label>
        )],
        style: { padding: 0 },
        type: CONFIGURATION_COMPONENT_TYPE.BUTTON_GROUP,
      },
      ...entries.map(
        (entry, index): ButtonGroupWidgetConfig => {
          const color = this.getColorFromEntry(entry);

          // prettier-ignore
          const options = [(
            <Checkbox
              checked={this.state.pointsToPlot[index].hoverinfo !== 'skip'}
              key={`node-selection-checkbox-${index}`}
              onClick={this.onNodeSelectionChange(index)}
            />),
            (
          <Icon
            key={`node-size-slider-${index}-minus`}
            name={'minus'}
            onClick={this.onNodeSizeChange(index, -1)}
            size={'small'}
            style={{ color }}
          />), (
          <Icon
            key={`node-size-slider-${index}-2`}
            name={'circle'}
            size={'small'}
            style={{ color }}
          />), (
          <Icon
            key={`node-size-slider-${index}-plus`}
            name={'plus'}
            onClick={this.onNodeSizeChange(index, 1)}
            size={'small'}
            style={{ color }}
          />
        ), ];

          return {
            id: `node-option-config-${index}`,
            name: entry.name,
            options,
            style: { padding: '.5em' },
            type: CONFIGURATION_COMPONENT_TYPE.BUTTON_GROUP,
          };
        },
      ),
    ),
  });

  protected handleAxisClick = (e: BioblocksChartEvent) => {
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
  };

  protected handleAxisEnter = (e: BioblocksChartEvent) => {
    const { addHoveredSecondaryStructure, hoveredSecondaryStructures, data } = this.props;

    for (const secondaryStructure of data.secondaryStructures) {
      for (const section of secondaryStructure) {
        if (
          section.contains(...e.selectedPoints) &&
          !hoveredSecondaryStructures.find(secStruct => section.isEqual(secStruct))
        ) {
          addHoveredSecondaryStructure(section);
        }
      }
    }
  };

  protected handleAxisLeave = (e: BioblocksChartEvent) => {
    const { data, hoveredSecondaryStructures, removeHoveredSecondaryStructure } = this.props;

    for (const secondaryStructure of data.secondaryStructures) {
      for (const section of secondaryStructure) {
        const searchResult = hoveredSecondaryStructures.find(secStruct => section.isEqual(secStruct));
        if (section.contains(...e.selectedPoints) && searchResult) {
          removeHoveredSecondaryStructure(searchResult);
        }
      }
    }
  };

  protected onMouseClick = (cb: (residues: LockedResiduePair) => void) => (e: BioblocksChartEvent) => {
    if (e.isAxis()) {
      this.handleAxisClick(e);
    } else {
      cb({ [e.selectedPoints.sort().toString()]: e.selectedPoints });
    }
  };

  protected onMouseEnter = (cb: (residue: RESIDUE_TYPE[]) => void) => (e: BioblocksChartEvent) => {
    if (e.isAxis()) {
      this.handleAxisEnter(e);
    } else {
      cb(e.selectedPoints);
    }
  };

  protected onMouseLeave = (cb?: (residue: RESIDUE_TYPE[]) => void) => (e: BioblocksChartEvent) => {
    if (e.isAxis()) {
      this.handleAxisLeave(e);
    } else if (cb) {
      cb(e.selectedPoints);
    }
  };

  protected onMouseSelect = (cb?: (residues: RESIDUE_TYPE[]) => void) => (e: BioblocksChartEvent) => {
    if (cb) {
      // For the contact map, all the x/y values are mirrored and correspond directly with i/j values.
      // Thus, all the residue numbers can be obtained by getting either all x or values from ths selected points.
      cb(e.selectedPoints.map(point => point));
    }
  };

  protected renderContactMapChart(pointsToPlot: IContactMapChartData[]) {
    const {
      addHoveredResidues,
      configurations,
      data,
      height,
      isDataLoading,
      onBoxSelection,
      removeHoveredResidues,
      secondaryStructureColors,
      selectedSecondaryStructures,
      showConfigurations,
      toggleLockedResiduePair,
      width,
    } = this.props;

    const range = data.couplingScores.totalContacts >= 1 ? data.couplingScores.residueIndexRange.max : undefined;

    return (
      <ComponentCard
        componentName={'Contact Map'}
        dockItems={this.getDockConfigs()}
        isDataReady={data.couplingScores.allContacts.length >= 1}
        menuItems={this.getMenuConfigs(configurations, pointsToPlot)}
      >
        <ContactMapChart
          contactData={pointsToPlot}
          height={height}
          isDataLoading={isDataLoading}
          onClickCallback={this.onMouseClick(toggleLockedResiduePair)}
          onHoverCallback={this.onMouseEnter(addHoveredResidues)}
          onSelectedCallback={this.onMouseSelect(onBoxSelection)}
          onUnHoverCallback={this.onMouseLeave(removeHoveredResidues)}
          range={range}
          secondaryStructures={data.secondaryStructures ? data.secondaryStructures : []}
          secondaryStructureColors={secondaryStructureColors}
          selectedSecondaryStructures={[selectedSecondaryStructures]}
          showConfigurations={showConfigurations}
          width={width}
        />
      </ComponentCard>
    );
  }

  protected setupPointsToPlot(couplingContainer: CouplingContainer) {
    const { data, lockedResiduePairs, hoveredResidues, formattedPoints, observedColor, highlightColor } = this.props;

    const chartNames = {
      selected: 'Selected Residue Pair',
      structure: `${data.pdbData ? (data.pdbData.experimental ? 'X-ray' : 'Inferred') : 'Unknown'} Structure Contact`,
    };

    const observedContactPoints = couplingContainer
      .getObservedContacts()
      .sort((pointA, pointB) => (pointA.dist && pointB.dist ? pointB.dist - pointA.dist : 0));
    const result = new Array<IContactMapChartData>(
      generateChartDataEntry(
        'text',
        { start: observedColor, end: 'rgb(247,251,255)' },
        `Structure Contact (${data.couplingScores.isDerivedFromCouplingScores ? 'Coupling Scores' : 'PDB'})`,
        chartNames.structure,
        4,
        observedContactPoints,
        {
          text: observedContactPoints.map(generateCouplingScoreHoverText),
        },
      ),
      ...formattedPoints,
    );

    const chartPoints = new Array<IContactMapChartPoint>();

    chartPoints.push(...this.generateHoveredResiduePairs(hoveredResidues));
    chartPoints.push(...this.generateLockedResiduePairs(lockedResiduePairs));

    result.push(this.generateSelectedResiduesChartData(highlightColor, chartNames.selected, 4, chartPoints));

    this.setState({
      ...this.state,
      pointsToPlot: result.map(this.applySavedNodeOptions),
    });
  }
}
