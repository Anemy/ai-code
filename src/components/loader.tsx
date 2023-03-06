import { H2, Body, Label } from '@leafygreen-ui/typography';
import React, { useCallback, useEffect } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const containerStyles = css({
  padding: spacing[3],
});

const Loader: React.FunctionComponent = () => {
  return <div className={containerStyles}>TODO: loader</div>;
};

export { Loader };
