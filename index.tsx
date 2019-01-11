import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Grid } from 'semantic-ui-react';

import { ChellContextProvider, SpringContainer, Store } from '~chell-viz~';

ReactDOM.render(
  <Provider store={Store}>
    <div id="ChellVizApp">
      <ChellContextProvider>
        <div style={{ padding: '20px' }}>
          <Grid centered={true} padded={true} style={{ width: '100vmin', height: '100%' }}>
            <SpringContainer isFullPage={true} datasetLocation={'hpc/full'} />
          </Grid>
        </div>
      </ChellContextProvider>
    </div>
  </Provider>,
  document.getElementById('app-root'),
);

if (module.hot) {
  module.hot.accept();
}
