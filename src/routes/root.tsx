import React from 'react';
import {
  // createBrowserRouter, // TODO: Based on env, use hash router or browser router.
  createHashRouter,
  RouterProvider,
} from 'react-router-dom';

import { SelectCodebase } from './select-codebase';
import { EnterPrompt } from './enter-prompt';
import { ViewDiff } from './view-diff';

const router = createHashRouter([
  {
    path: '/',
    element: <SelectCodebase />,
  },
  {
    path: '/enter-prompt',
    element: <EnterPrompt />,
  },
  {
    path: '/view-diff',
    element: <ViewDiff />,
  },
]);

const Root: React.FunctionComponent = () => {
  return <RouterProvider router={router} />;
};

export { Root };
