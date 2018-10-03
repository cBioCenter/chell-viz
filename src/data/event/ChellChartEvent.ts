import { CHELL_CHART_EVENT_TYPE, CHELL_CHART_PIECE } from '~chell-viz~/data';

export class ChellChartEvent {
  public constructor(
    readonly type: CHELL_CHART_EVENT_TYPE,
    readonly chartPiece?: CHELL_CHART_PIECE,
    readonly selectedPoints: number[] = [],
  ) {}

  public isAxis() {
    return this.chartPiece === CHELL_CHART_PIECE.AXIS;
  }
}
