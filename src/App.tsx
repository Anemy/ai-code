import React from 'react';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';
import { Provider } from 'react-redux';

import { store } from './store/store';
import { Root } from './routes/root';

const App: React.FunctionComponent = () => {
  return (
    <LeafyGreenProvider>
      <Provider store={store}>
        <Root />
      </Provider>
    </LeafyGreenProvider>
  );
};

export { App };
