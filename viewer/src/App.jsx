import React from 'react';

import './App.css';
import { Viewer } from './components/Viewer.jsx';

function App() {
  const url = new URL(window.location.href);

  const source = url.searchParams.get('source');
  const channelAxis = url.searchParams.get('channelAxis');
  const isLabel = !!parseInt(url.searchParams.get('isLabel', 0));

  return (
    <>
      <Viewer source={source} channelAxis={channelAxis} isLabel={isLabel} />
    </>
  );
}

export default App;
