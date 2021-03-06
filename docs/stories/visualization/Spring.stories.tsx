import { storiesOf } from '@storybook/react';
import * as React from 'react';

import { SpringContainer, SpringContainerClass } from '~bioblocks-viz~/container';

const stories = storiesOf('visualization/SPRING', module).addParameters({
  component: SpringContainerClass,
});

stories.add('HPC - Full', () => <SpringContainer datasetLocation={'../datasets/hpc_sf2/full'} />, {
  info: { inline: true },
});
