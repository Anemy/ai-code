import React, { useCallback, useEffect, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector } from 'react-redux';

import { SelectCodebase } from './select-codebase';
import { EnterPrompt } from './enter-prompt';
import { ViewDiff } from './view-diff';
import { RootState } from '../store/store';
import { ErrorBanner } from '../components/error-banner';

const containerStyles = css({
  padding: spacing[3],
});

const historyStyles = css({
  opacity: 0.5,
});

// {
//   path: '/',
//   element: <SelectCodebase />,
// },
// {
//   path: '/enter-prompt',
//   element: <EnterPrompt />,
// },
// {
//   path: '/view-diff',
//   element: <ViewDiff />,
// },

const Home: React.FunctionComponent = () => {
  const codebaseStatus = useSelector(
    (state: RootState) => state.codebase.status
  );
  const errorMessage = useSelector(
    (state: RootState) => state.codebase.errorMessage
  );

  const showDiff =
    codebaseStatus === 'generating-suggestions' ||
    codebaseStatus !== 'suggested';

  const history = useMemo(() => {
    const pastForms = [];
    if (codebaseStatus !== 'initial') {
      pastForms.push(<SelectCodebase />);
    }
    if (
      codebaseStatus === 'generating-suggestions' ||
      codebaseStatus === 'suggested'
    ) {
      pastForms.push(<EnterPrompt />);
    }

    return pastForms;
  }, [codebaseStatus]);

  const present = useMemo(() => {
    if (codebaseStatus === 'initial') {
      return <SelectCodebase />;
    }
    if (codebaseStatus === 'loading' || codebaseStatus === 'loaded') {
      return <EnterPrompt />;
    }
    if (
      codebaseStatus === 'generating-suggestions' ||
      codebaseStatus === 'suggested'
    ) {
      return <ViewDiff />;
    }

    // Default case?
    return null;
  }, [codebaseStatus]);

  return (
    <div className={containerStyles}>
      <div className={historyStyles}>
        {history}
        {/* <SelectCodebase /> */}
      </div>
      {present}
      {/* {codebaseStatus !== 'initial' && <EnterPrompt />}
      {showDiff && <ViewDiff />} */}
      <ErrorBanner errorMessage={errorMessage} />
    </div>
  );
};

export { Home };
