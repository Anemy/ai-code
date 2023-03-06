import { H2, Body, Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback, useEffect } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import TextInput from '@leafygreen-ui/text-input';
import { spacing } from '@leafygreen-ui/tokens';
import { dialog } from '@electron/remote';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  setDirectory,
  setGithubLink,
  setUseGithubLink,
} from '../store/codebase';
import type { RootState } from '../store/store';

const containerStyles = css({
  padding: spacing[3],
});

const cardStyles = css({
  marginTop: spacing[3],
});

const optionsContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[3],
});

const linkContainerStyles = css({
  flexGrow: 1,
});

const submitGithubLinkStyles = css({
  marginTop: spacing[2],
  display: 'flex',
  justifyContent: 'flex-end',
});

function openFolder() {
  return dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
}

const SelectCodebase: React.FunctionComponent = () => {
  const directory = useSelector((state: RootState) => state.codebase.directory);
  const githubLink = useSelector(
    (state: RootState) => state.codebase.githubLink
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // When the user has chosen a directory we navigate to the prompt entering.
    if (directory) {
      navigate('/enter-prompt');
    }
  }, [directory]);

  const onClickSelectFolder = useCallback(async () => {
    const folderPath = await openFolder();

    dispatch(
      setDirectory(
        folderPath.canceled || folderPath.filePaths.length === 0
          ? null
          : folderPath.filePaths[0]
      )
    );
  }, []);

  const onClickSubmitGithubLink = useCallback(() => {
    dispatch(setUseGithubLink(true));
    // TODO: Link validation.
    navigate('/enter-prompt');
  }, []);

  return (
    <div className={containerStyles}>
      {/* <H2>Code</H2> */}
      <Card className={cardStyles}>
        <div className={optionsContainerStyles}>
          <div>
            <Label htmlFor="select-folder-button">Select a local folder</Label>
            <div>
              <Button onClick={onClickSelectFolder} id="select-folder-button">
                Select folder...
              </Button>
            </div>
          </div>
          <div>
            <Body>or</Body>
          </div>
          <div className={linkContainerStyles}>
            <Label htmlFor="github-link-input" id="github-link-input-label">
              Enter a GitHub repository link
            </Label>
            <TextInput
              id="github-link-input"
              aria-labelledby="github-link-input-label"
              onChange={(e) => dispatch(setGithubLink(e.target.value))}
              value={githubLink}
              placeholder="https://github.com/mongodb-js/compass"
            />
            {githubLink === null && (
              <Button
                onClick={() =>
                  dispatch(setGithubLink('git@github.com:Anemy/gravity.git'))
                }
              >
                autofill
              </Button>
            )}
            {githubLink !== null && (
              <div className={submitGithubLinkStyles}>
                <Button variant="primary" onClick={onClickSubmitGithubLink}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export { SelectCodebase };
