import { Body, Subtitle } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback, useMemo } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector, useDispatch } from 'react-redux';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import type { FileData } from 'react-diff-view';

import type { AppDispatch, RootState } from '../store/store';
import { generateSuggestions, setStatus } from '../store/codebase';
import { InputContainer } from '../components/input-container';
import CancelLoader from '../components/cancel-loader';

const containerStyles = css({
  padding: spacing[3],
});

const diffContainer = css({
  marginTop: spacing[3],
});

const cardStyles = css({
  marginTop: spacing[3],
});

const FileDiff: React.FunctionComponent<FileData> = ({
  oldRevision,
  newRevision,
  type,
  hunks,
  newPath,
  oldPath,
}) => (
  <div key={oldRevision + '-' + newRevision}>
    <Body weight="medium">
      {type === 'modify' && `Modify "${newPath}"`}
      {type === 'add' && `+ Add file "${newPath}"`}
      {type === 'rename' && `~ Rename file "${oldPath}" -> "${newPath}"`}
      {type === 'delete' && `- Delete file "${oldPath}"`}
    </Body>
    <Diff
      key={oldRevision + '-' + newRevision}
      viewType="split"
      diffType={type}
      hunks={hunks}
    >
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  </div>
);

const ViewSuggestions: React.FunctionComponent = () => {
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

  const diffFiles = useMemo(() => {
    if (diffChanges) {
      return parseDiff(diffChanges);
    }
  }, [diffChanges]);

  // console.log('diffFiles', diffFiles);

  return (
    <div className={containerStyles}>
      <Button onClick={onClickBack}>Back</Button>
      {codebaseStatus === 'generating-suggestions' && (
        <CancelLoader
          progressText="Generating suggestions"
          cancelText="Cancel"
          onCancel={onClickBack} // TODO: Cancel the actual event.
        />
      )}
      {diffChanges && (
        <>
          <Card className={cardStyles}>
            <Body>
              Here are the suggested changes. Description:{' '}
              {descriptionOfChanges}
            </Body>
            <div className={diffContainer}>{diffFiles.map(FileDiff)}</div>
          </Card>
          <InputContainer>
            <Button onClick={() => dispatch(generateSuggestions())}>
              Regenerate
            </Button>
          </InputContainer>
        </>
      )}
      {!!errorMessage && (
        <div>
          <Body>An error occured.</Body>
          <Button onClick={() => dispatch(generateSuggestions())}>Retry</Button>
        </div>
      )}
    </div>
  );
};

export { ViewSuggestions };
