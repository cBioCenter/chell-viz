import * as plotly from 'plotly.js-gl2d-dist';

module.exports = {
  ...plotly,
  Plots: {
    resize: () => jest.fn(),
  },
  newPlot: (...args: any[]) => mockCanvas,
  purge: jest.fn(),
  react: (...args: any[]) => mockCanvas,
};

export interface IMockPlotlyCanvas {
  dispatchEvent(event: Event, data: Partial<plotly.PlotScatterDataPoint> | plotly.SelectionRange): boolean;
}

export class MockPlotlyHTMLElement implements IMockPlotlyCanvas {
  protected callbacks = new Map<string, (...args: any[]) => void>();

  public on = (event: string, callback: (...args: any[]) => void) => {
    this.callbacks.set(event, callback);
  };

  public dispatchEvent(event: Event, data: Partial<plotly.PlotScatterDataPoint>): boolean {
    const cb = this.callbacks.get(event.type);
    if (cb) {
      switch (event.type) {
        case 'plotly_click':
        case 'plotly_hover':
        case 'plotly_unhover':
        case 'plotly_selected':
          cb({ points: [{ ...data }] });
          break;
        default:
          cb();
      }
    }

    return true;
  }
}

const mockCanvas = new MockPlotlyHTMLElement();