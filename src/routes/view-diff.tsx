import { Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { RootState } from '../store/store';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClickBack = useCallback(async () => {
    navigate('/enter-prompt');
  }, []);

  return (
    <div className={containerStyles}>
      <Card className={cardStyles}>
        <Button onClick={onClickBack}>Back</Button>
        <Body>Show diff here + -</Body>
      </Card>
    </div>
  );
};

export { ViewDiff };
