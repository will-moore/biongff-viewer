import React, { useMemo, useRef, useState } from 'react';

import { MultiscaleImageLayer } from '@hms-dbmi/viv';
import { initLayerStateFromSource } from '@hms-dbmi/vizarr/src/io';
import {
  fitImageToViewport,
  isGridLayerProps,
  isInterleaved,
  resolveLoaderFromLayerProps,
} from '@hms-dbmi/vizarr/src/utils';
import DeckGL, { OrthographicView } from 'deck.gl';

import { useSourceData } from '../hooks';
import { Controller } from './Controller';

export const Viewer = ({ source }) => {
  const deckRef = useRef(null);
  const [viewState, setViewState] = useState(null);
  const [config] = useState({ source: source || null });

  const { sourceData, error: sourceError } = useSourceData(config);

  const layers = useMemo(() => {
    if (sourceData) {
      const layerState = initLayerStateFromSource({ id: 'raw', ...sourceData });
      if (layerState?.layerProps?.loader) {
        return [new MultiscaleImageLayer(layerState.layerProps)];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [sourceData]);

  if (deckRef.current?.deck && !viewState && layers?.[0]) {
    const { deck } = deckRef.current;
    setViewState(
      fitImageToViewport({
        image: getLayerSize(layers[0]),
        viewport: deck,
        padding: deck.width < 400 ? 10 : deck.width < 600 ? 30 : 50,
        matrix: layers[0].props.modelMatrix,
      }),
    );
  }

  if (sourceError) {
    return (
      <div className="alert alert-danger" role="alert">
        {sourceError.message}
      </div>
    );
  } else {
    return (
      <div>
        <Controller layers={layers} />
        <DeckGL
          ref={deckRef}
          layers={layers}
          viewState={viewState && { ortho: viewState }}
          onViewStateChange={(e) => setViewState(e.viewState)}
          views={[new OrthographicView({ id: 'ortho', controller: true })]}
        />
      </div>
    );
  }
};

const getLayerSize = ({ props }) => {
  const loader = resolveLoaderFromLayerProps(props);
  const [baseResolution, maxZoom] = Array.isArray(loader)
    ? [loader[0], loader.length]
    : [loader, 0];
  const interleaved = isInterleaved(baseResolution.shape);
  let [height, width] = baseResolution.shape.slice(interleaved ? -3 : -2);
  if (isGridLayerProps(props)) {
    // TODO: Don't hardcode spacer size. Probably best to inspect the deck.gl Layers rather than
    // the Layer Props.
    const spacer = 5;
    height = (height + spacer) * props.rows;
    width = (width + spacer) * props.columns;
  }
  return { height, width, maxZoom };
};
