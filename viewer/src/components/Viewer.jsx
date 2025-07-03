import React, { useMemo, useRef, useState, useCallback } from 'react';

import { ImageLayer, MultiscaleImageLayer } from '@hms-dbmi/viv';
import { initLayerStateFromSource } from '@hms-dbmi/vizarr/src/io';
import { GridLayer } from '@hms-dbmi/vizarr/src/layers/grid-layer';
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

const LayerStateMap = {
  image: ImageLayer,
  grid: GridLayer,
  multiscale: MultiscaleImageLayer,
};

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
          new LayerStateMap[layerState.kind]({
            ...layerState.layerProps,
            pickable: false,
          }),
          ...(layerState.labels?.length
            ? layerState.labels?.map((label) => {
                return new LabelLayer({
                  ...label.layerProps,
                  selection: layerState.labels[0].transformSourceSelection(
                    layerState.layerProps.selections[0],
                  ),
                  pickable: true,
                });
              })
            : []),
        ];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [isLabel, sourceData]);

  const resetViewState = useCallback(() => {
    const { deck } = deckRef.current;
    setViewState(
      fitImageToViewport({
        image: getLayerSize(layers[0]),
        viewport: deck,
        padding: deck.width < 400 ? 10 : deck.width < 600 ? 30 : 50,
        matrix: layers[0].props.modelMatrix,
      }),
    );
  }, [layers]);

  if (deckRef.current?.deck && !viewState && layers?.[0]) {
    resetViewState();
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
        <Controller layers={layers} resetViewState={resetViewState} />
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
