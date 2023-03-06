import { H2, Body, Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback, useEffect } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import TextArea from '@leafygreen-ui/text-input';
import { spacing } from '@leafygreen-ui/tokens';
import { dialog } from '@electron/remote';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setPrompt } from '../store/prompt';
import type { RootState } from '../store/store';

const containerStyles = css({
  padding: spacing[3],
});

const cardStyles = css({
  marginTop: spacing[3],
});

const submitContainerStyles = css({
  marginTop: spacing[2],
  display: 'flex',
  justifyContent: 'flex-end',
});

const EnterPrompt: React.FunctionComponent = () => {
  const directory = useSelector((state: RootState) => state.codebase.directory);
  const githubLink = useSelector(
    (state: RootState) => state.codebase.githubLink
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClickBack = useCallback(async () => {
    navigate('/');
  }, []);

  const onClickSubmitPrompt = useCallback(() => {
    // TODO: Link validation.
    navigate('/enter-prompt');
  }, []);

  // TODO: Before prompt, load the directory/repo. Get the file structure.

  return (
    <div className={containerStyles}>
      <div>
        <Button onClick={onClickBack}>Back</Button>
      </div>
      <Card className={cardStyles}>
        <div>
          TODO: Visualize their mapping
        </div>
        <Label htmlFor="prompt-text-area" id="prompt-text-area-label">
          Enter something you'd like done to the codebase.
        </Label>
        <TextArea
          id="prompt-text-area"
          aria-labelledby="prompt-text-area-label"
          placeholder="Update javascript to typescript"
          onChange={(e) => dispatch(setPrompt(e.target.value))}
        />
        <div className={submitContainerStyles}>
          <Button variant="primary" onClick={onClickSubmitPrompt}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export { EnterPrompt };
