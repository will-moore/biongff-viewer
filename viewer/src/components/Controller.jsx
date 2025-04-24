import React from 'react';

export const Controller = ({ layers }) => {
  return (
    <div className="viewer-controller">
      <p>Layers</p>
      <ul>
        {layers.map((layer) => {
          return <li key={layer.props.id}>{layer.props.id}</li>;
        })}
      </ul>
    </div>
  );
};
