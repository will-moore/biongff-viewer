import { useEffect, useState } from 'react';

import { createSourceData } from '@hms-dbmi/vizarr/src/io';
import {
  isBioformats2rawlayout,
  guessZarrVersion,
} from '@hms-dbmi/vizarr/src/utils';
import { FetchStore, open } from 'zarrita';

export const useSourceData = (config) => {
  const [sourceData, setSourceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const base = config.source;

        const store = new FetchStore(base);
        let zarrVersion = await guessZarrVersion(store);
        let node;
        if (zarrVersion === 3) {
          node = await open.v3(store, { kind: 'group' });
        } else {
          node = await open.v2(store, { kind: 'group' });
        }

        const jsonUrl = `${base}${base.slice(-1) === '/' ? '' : '/'}zarr.json`;
        let zarrJson;
        try {
          zarrJson = await (await fetch(jsonUrl)).json();
        } catch {}

        let ome = zarrJson?.attributes?.ome || node.attrs?.OME || null;

        if (!isBioformats2rawlayout(ome || node.attrs)) {
          // use Vizarr's createSourceData with source as is
          const data = await createSourceData(config);
          setSourceData(data);
          return;
        }

        // load bioformats2raw.layout
        // https://ngff.openmicroscopy.org/0.4/#bf2raw
        const b2fl =
          ome?.['bioformats2raw.layout'] ||
          node.attrs?.['bioformats2raw.layout'];
        if (b2fl !== 3) {
          setError(new Error('Unsupported bioformats2raw layout'));
          return;
        }

        // Try to load .zmetadata if present
        const metadataUrl = `${base}${base.slice(-1) === '/' ? '' : '/'}.zmetadata`;
        let metadata;
        try {
          metadata = (await (await fetch(metadataUrl)).json()).metadata;
        } catch {}

        // Try to load OME group at root if present
        if (!ome) {
          try {
            ome = await open(node.resolve('OME'), { kind: 'group' });
          } catch {}
        }

        // @TODO: add plates
        let series;
        if (ome?.series) {
          series = ome.series;
        } else if (ome?.attrs?.series) {
          series = ome.attrs.series;
        } else {
          // https://ngff.openmicroscopy.org/0.4/#bf2raw-details
          if (metadata) {
            const multiscaleKeys = Object.keys(metadata).filter(
              (key) =>
                key.endsWith('/.zattrs') && 'multiscales' in metadata[key],
            );
            series = multiscaleKeys.map((key) => key.split('/')[0]);
          } else {
            console.warn(
              'No OME group or .zmetadata file. Attempting to find series.',
            );
            // separate "multiscales" images MUST be stored in consecutively numbered groups starting from 0
            let s = 0;
            series = [];
            while (true) {
              let seriesNode;
              try {
                seriesNode = await open(node.resolve(`${s}`), {
                  kind: 'group',
                });
              } catch {}
              if (seriesNode) {
                let attrs;
                if (zarrVersion === 3) {
                  const metadataUrl = `${base}${base.slice(-1) === '/' ? '' : '/'}${s}/zarr.json`;
                  try {
                    attrs = (await (await fetch(metadataUrl)).json())
                      ?.attributes?.ome;
                  } catch {}
                } else {
                  attrs = seriesNode.attrs;
                }
                if (attrs?.['multiscales']) {
                  series.push(`${s}`);
                } else break;
                s++;
              } else break;
            }
          }
        }

        // @TODO: return all series
        const seriesUrl = `${base}${base.slice(-1) === '/' ? '' : '/'}${series?.[0] || ''}`;
        const data = await createSourceData({
          ...config,
          source: seriesUrl,
        });
        setSourceData(data);
        return;
      } catch (err) {
        setError(err);
      }
    };

    if (!config?.source) {
      setSourceData(null);
      setError(new Error('No source provided'));
    } else {
      fetchData();
    }
  }, [config]);

  return { sourceData, error };
};
