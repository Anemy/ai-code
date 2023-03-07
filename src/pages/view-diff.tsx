import { Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector, useDispatch } from 'react-redux';

import type { AppDispatch, RootState } from '../store/store';
import { generateSuggestions, setStatus } from '../store/codebase';
import { Loader } from '../components/loader';

const containerStyles = css({
  padding: spacing[3],
});

const cardStyles = css({
  marginTop: spacing[3],
});

const ViewDiff: React.FunctionComponent = () => {
  const codebaseStatus = useSelector(
    (state: RootState) => state.codebase.status
  );
  const errorMessage = useSelector(
    (state: RootState) => state.codebase.errorMessage
  );
  const diffChanges = useSelector(
    (state: RootState) => state.codebase.diffChanges
  );
  const descriptionOfChanges = useSelector(
    (state: RootState) => state.codebase.descriptionOfChanges
  );
  const dispatch = useDispatch<AppDispatch>();

  const onClickBack = useCallback(async () => {
    // TODO: Cancel async reqs. Rn would move to the other view if fufilled after.

    dispatch(setStatus('loaded'));
  }, []);

  return (
    <div className={containerStyles}>
      <Card className={cardStyles}>
        <Button onClick={onClickBack}>Back</Button>
        {codebaseStatus === 'generating-suggestions' && (
          <>
            <div>Loading suggestions...</div>
            <Loader />
          </>
        )}
        {diffChanges && (
          <>
            <Body>We have a diff.</Body>
            <Body>Diff: {diffChanges}</Body>
            <Body>Description of changes: {descriptionOfChanges}</Body>
            <Button onClick={() => dispatch(generateSuggestions())}>
              Regenerate
            </Button>
          </>
        )}
        {!!errorMessage && (
          <div>
            <Body>An error occured.</Body>
            <Button onClick={() => dispatch(generateSuggestions())}>
              Retry
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export { ViewDiff };