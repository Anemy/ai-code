import Banner from '@leafygreen-ui/banner';
import React, { useCallback, useEffect } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const bannerStyles = css({
  marginTop: spacing[3],
});

const ErrorBanner: React.FunctionComponent<{
  errorMessage?: string;
}> = ({ errorMessage }) => {
  if (!errorMessage) {
    return null;
  }

  return (
    <Banner className={bannerStyles} variant="danger">
      {errorMessage}
    </Banner>
  );
};

export { ErrorBanner };
