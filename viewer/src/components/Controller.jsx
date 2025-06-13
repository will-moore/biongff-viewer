import React from 'react';

export const Controller = ({ layers, resetViewState }) => {
  return (
    <div className="viewer-controller">
      <p>Layers</p>
      <ul>
        {layers.map((layer) => {
          return <li key={layer.props.id}>{layer.props.id}</li>;
        })}
      </ul>
      <button type="button" className="btn" onClick={resetViewState}>
        Reset
      </button>
    </div>
  );
};
