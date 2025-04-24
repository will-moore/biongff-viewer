import React from 'react';

import './App.css';
import { Viewer } from './components/Viewer.jsx';

function App() {
  const url = new URL(window.location.href);

  const source = url.searchParams.get('source');

  return (
    <>
      <Viewer source={source} />
    </>
  );
}

export default App;
