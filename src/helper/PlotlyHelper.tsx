import * as plotly from 'plotly.js';
import * as React from 'react';

export interface IPlotlyChartProps {
  config?: Partial<plotly.Config>;
  data: Array<Partial<plotly.ScatterData>>;
  layout?: Partial<plotly.Layout>;
  onClickCallback?: (event: plotly.PlotMouseEvent) => void;
  onHoverCallback?: (event: plotly.PlotMouseEvent) => void;
  onSelectedCallback?: (event: plotly.PlotSelectionEvent) => void;
  onUnHoverCallback?: (event: plotly.PlotMouseEvent) => void;
}

/***
 * Usage:
 *  <PlotlyChart data={toJS(this.model_data)}
 *               layout={layout}
 *               onClick={({points, event}) => console.log(points, event)}>
 */
export class PlotlyChart extends React.Component<IPlotlyChartProps, any> {
  public container: plotly.PlotlyHTMLElement | null = null;

  public attachListeners() {
    if (this.props.onClickCallback) {
      this.container!.on('plotly_click', this.props.onClickCallback);
    }
    if (this.props.onSelectedCallback) {
      this.container!.on('plotly_selected', this.props.onSelectedCallback);
    }

    this.container!.on('plotly_hover', this.onHover);
    this.container!.on('plotly_unhover', this.onUnHover);

    window.addEventListener('resize', this.resize);
  }

  public resize = () => {
    if (this.container) {
      plotly.Plots.resize(this.container);
    }
  };

  public draw = async (props: IPlotlyChartProps) => {
    const { data, layout, config } = props;
    if (this.container) {
      // plotly.react will not destroy the old plot: https://plot.ly/javascript/plotlyjs-function-reference/#plotlyreact
      this.container = await plotly.react(this.container, data, Object.assign({}, layout), config);
    }
  };

  public componentWillReceiveProps(nextProps: IPlotlyChartProps) {
    this.draw(nextProps);
  }

  public componentDidMount() {
    this.draw(this.props);
  }

  public componentWillUnmount() {
    if (this.container) {
      plotly.purge(this.container);
    }
    window.removeEventListener('resize', this.resize);
  }

  public render() {
    const {
      data,
      layout,
      config,
      onClickCallback,
      onHoverCallback,
      onSelectedCallback,
      onUnHoverCallback,
      ...other
    } = this.props;
    return (
      <div
        {...other}
        ref={async node => {
          if (node && !this.container) {
            this.container = await plotly.react(node, data as any, Object.assign({}, layout), config);
            this.attachListeners();
          }
        }}
      />
    );
  }

  protected onHover = (event: plotly.PlotMouseEvent) => {
    console.log('Plotly onHover called');
    const { onHoverCallback } = this.props;
    if (onHoverCallback) {
      onHoverCallback(event);
    }
  };

  protected onUnHover = (event: plotly.PlotMouseEvent) => {
    console.log('Plotly onUnHover called');
    const { onUnHoverCallback } = this.props;
    if (onUnHoverCallback) {
      onUnHoverCallback(event);
    }
  };
}

export const defaultLayout: Partial<Plotly.Layout> = {
  height: 440,
  legend: {},
  showlegend: false,
  title: '',
  width: 440,
  xaxis: {},
  yaxis: {
    autorange: 'reversed',
  },
};

export const defaultConfig: Partial<Plotly.Config> = {
  displayModeBar: true,
  // modeBarButtons: [['zoomOut2d', 'zoomIn2d'], ['resetScale2d', 'autoScale2d'], ['select2d', 'pan2d']],
};
