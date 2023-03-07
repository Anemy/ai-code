import { Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import React, { useCallback, useMemo } from 'react';
import Card from '@leafygreen-ui/card';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useSelector, useDispatch } from 'react-redux';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import type { DiffType, HunkData } from 'react-diff-view';

import type { AppDispatch, RootState } from '../store/store';
import { generateSuggestions, setStatus } from '../store/codebase';
import { Loader } from '../components/loader';
import { InputContainer } from '../components/input-container';

const containerStyles = css({
  padding: spacing[3],
});

const diffContainer = css({
  // padding: spacing[3],
});

const renderFile: React.FunctionComponent<{
  oldRevision: string;
  newRevision: string;
  hunks: HunkData[];
  type: DiffType;
}> = ({ oldRevision, newRevision, type, hunks }) => (
  <Diff
    key={oldRevision + '-' + newRevision}
    viewType="split"
    diffType={type}
    hunks={hunks}
  >
    {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
  </Diff>
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

  return (
    <div className={containerStyles}>
      <Button onClick={onClickBack}>Back</Button>
      {codebaseStatus === 'generating-suggestions' && (
        <>
          <div>Loading suggestions...</div>
          <Loader />
        </>
      )}
      {diffChanges && (
        <>
          <Body>Diff:</Body>
          <Card className={diffContainer}>{diffFiles.map(renderFile)}</Card>
          <InputContainer>
            <Body>Description of changes: {descriptionOfChanges}</Body>
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
