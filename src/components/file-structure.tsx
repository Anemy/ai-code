import { Body } from '@leafygreen-ui/typography';
import React, { useCallback, useEffect } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import type { FileDirectory } from '../ai-code/local-files';

const containerStyles = css({
  padding: spacing[3],
});

const Folder: React.FunctionComponent<{
  directory: FileDirectory;
}> = ({ directory }) => {
  return (
    <>
      {Object.entries(directory).map(([fileName, contents]) => (
        <div>
          <Body>
            {fileName}: {typeof contents === 'string' ? 'file' : 'folder'}
          </Body>
        </div>
      ))}
    </>
  );
};

const FileStructure: React.FunctionComponent<{
  fileStructure: FileDirectory | null;
}> = ({ fileStructure }) => {
  if (!fileStructure || Object.keys(fileStructure).length === 0) {
    return (
      <div className={containerStyles}>
        <Body>No files currently in the codebase.</Body>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <Folder directory={fileStructure} />
    </div>
  );
};

export { FileStructure };
