import { Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback, useEffect } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { AppDispatch, RootState } from '../store/store';
import { generateSuggestions } from '../store/codebase';

const containerStyles = css({
  padding: spacing[3],
});

const cardStyles = css({
  marginTop: spacing[3],
});

const ViewDiff: React.FunctionComponent = () => {
  const directory = useSelector((state: RootState) => state.codebase.directory);
  const githubLink = useSelector(
    (state: RootState) => state.codebase.githubLink
  );
  const diffChanges = useSelector(
    (state: RootState) => state.codebase.diffChanges
  );
  const descriptionOfChanges = useSelector(
    (state: RootState) => state.codebase.descriptionOfChanges
  );
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const onClickBack = useCallback(async () => {
    navigate('/enter-prompt');
  }, []);

  return (
    <div className={containerStyles}>
      <Card className={cardStyles}>
        <Button onClick={onClickBack}>Back</Button>
        <Body>Show diff here + -</Body>
        {diffChanges && (
          <>
            <Body>Diff: {diffChanges}</Body>
            <Body>Descipription of changes: {descriptionOfChanges}</Body>
            <Button onClick={() => dispatch(generateSuggestions())}>
              Regenerate
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export { ViewDiff };
