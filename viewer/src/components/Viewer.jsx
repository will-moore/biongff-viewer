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
import { LabelLayer } from '../layers/label-layer';

export const Viewer = ({ source, channelAxis = null, isLabel = false }) => {
  const deckRef = useRef(null);
  const [viewState, setViewState] = useState(null);
  const [config] = useState({
    source: source || null,
    ...(channelAxis ? { channel_axis: parseInt(channelAxis) } : {}),
  });

  const { sourceData, error: sourceError } = useSourceData(config);

  const layers = useMemo(() => {
    if (sourceData) {
      if (isLabel) {
        // To load standalone label, replicate in source and nest in labels
        // Needs source ImageLayer, LabelLayer has no loader
        const layerState = initLayerStateFromSource({
          id: 'raw',
          ...sourceData,
          on: false,
          labels: [
            {
              name: 'labels',
              modelMatrix: sourceData.model_matrix,
              loader: sourceData.loader,
            },
          ],
        });
        return [
          new MultiscaleImageLayer({
            ...layerState.layerProps,
            visible: false,
          }),
          new LabelLayer({
            ...layerState.labels[0].layerProps,
            selection: layerState.labels[0].transformSourceSelection(
              layerState.layerProps.selections[0],
            ),
            pickable: true,
          }),
        ];
      }
      const layerState = initLayerStateFromSource({ id: 'raw', ...sourceData });
      if (layerState?.layerProps?.loader) {
        return [
          new MultiscaleImageLayer({
            ...layerState.layerProps,
          }),
        ];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [isLabel, sourceData]);

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

  const getTooltip = ({ layer, index, value }) => {
    if (!layer || !index) {
      return null;
    }
    return {
      text: value,
    };
  };

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
          getTooltip={getTooltip}
        />
      </div>
    );
  }
};

// from vizarr Viewer
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
