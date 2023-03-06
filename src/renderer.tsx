import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './app';

// React 18
// import { createRoot } from 'react-dom/client';
// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);

// React 17
const container = document.getElementById('root');
ReactDOM.render(<App />, container);

console.log('Renderer loaded.');

if ((module as any).hot) {
  (module as any).hot.accept();
}
