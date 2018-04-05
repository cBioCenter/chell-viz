import * as React from 'react';

import { Dropdown, DropdownItemProps } from 'semantic-ui-react';

import { ProteinViewer } from '../container/ProteinViewer';
import { SpringContainer } from '../container/SpringContainer';
import { TContainer } from '../container/TContainer';

export enum VIZ_TYPE {
  NGL = 'NGL',
  SPRING = 'SPRING',
  'T-SNE' = 'T-SNE',
}

export interface IVizSelectorPanelProps {
  initialViz?: VIZ_TYPE;
}

export interface IVizSelectorPanelState {
  selectedViz: VIZ_TYPE;
}

/**
 * A single visualization panel allowing a user to select how they wish to view data.
 *
 * @export
 * @class VizSelectorPanel
 * @extends {React.Component<IVizSelectorPanelProps, IVizSelectorPanelState>}
 */
export class VizSelectorPanel extends React.Component<IVizSelectorPanelProps, IVizSelectorPanelState> {
  public static defaultParams: Partial<IVizSelectorPanelProps> = {
    initialViz: VIZ_TYPE['T-SNE'],
  };

  protected dropdownItems: DropdownItemProps[] = Object.keys(VIZ_TYPE).map(viz => ({
    key: viz,
    text: viz,
    value: viz,
  }));

  constructor(props: IVizSelectorPanelProps) {
    super(props);
    this.state = {
      selectedViz: props.initialViz ? props.initialViz : VIZ_TYPE.SPRING,
    };
  }

  public render() {
    const style = {
      width: 400,
    };
    return (
      <div className="VizSelectorPanel" style={style}>
        <Dropdown
          options={this.dropdownItems}
          placeholder={'Select a Visualization!'}
          fluid={true}
          onChange={this.onVizSelect}
        />
        {this.renderVizContainer(this.state.selectedViz)}
      </div>
    );
  }

  protected renderVizContainer(viz: VIZ_TYPE) {
    const dataDir = 'centroids';
    switch (viz) {
      case VIZ_TYPE['T-SNE']:
        return <TContainer dataDir={dataDir} />;
      case VIZ_TYPE.SPRING:
        return <SpringContainer dataDir={dataDir} />;
      case VIZ_TYPE.NGL:
        return <ProteinViewer />;
      default:
        throw new Error(`Unknown viz: ${viz}`);
    }
  }

  protected onVizSelect = (event: React.SyntheticEvent<any>, data: any) => {
    this.setState({
      selectedViz: data.value,
    });
  };
}