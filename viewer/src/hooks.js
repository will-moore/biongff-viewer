import { useEffect, useState } from 'react';

import { createSourceData } from '@hms-dbmi/vizarr/src/io';
import {
  isBioformats2rawlayout,
  guessZarrVersion,
} from '@hms-dbmi/vizarr/src/utils';
import { FetchStore, open } from 'zarrita';

import { findSeries, getZarrJson, getZarrMetadata } from './utils';

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

        const zarrJson = zarrVersion === 3 ? await getZarrJson(base) : null;
        let ome = zarrJson?.attributes?.ome || node.attrs?.OME || null;

        if (!isBioformats2rawlayout(ome || node.attrs)) {
          // use Vizarr's createSourceData with source as is
          const data = await createSourceData(config);
          setSourceData(data);
          return;
        }

        // load bioformats2raw.layout
        // https://ngff.openmicroscopy.org/0.4/#bf2raw

        // get b2f metadata from ome key in metadata or node attributes
        const b2fl =
          ome?.['bioformats2raw.layout'] ||
          node.attrs?.['bioformats2raw.layout'];
        if (b2fl !== 3) {
          setError(new Error('Unsupported bioformats2raw layout'));
          return;
        }

        // Try to load .zmetadata if present
        const metadata = await getZarrMetadata(base);

        // Try to load OME group at root if present and not in v3 zarr metadata
        if (!ome) {
          try {
            ome = await open(node.resolve('OME'), { kind: 'group' });
          } catch {}
        }

        // @TODO: add plates
        // @TODO: use OME/METADATA.ome.XML (https://github.com/ome/ome-ngff-validator/blob/d29a48d930b68c21f2ee931ef0f681f695e70d1a/src/Bioformats2rawLayout/index.svelte#L70)
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
            series = await findSeries(base, node, zarrVersion);
          }
        }

        // @TODO: return all series
        const seriesUrl = `${base.replace(/\/?$/, '/')}${series?.[0] || ''}`;
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
