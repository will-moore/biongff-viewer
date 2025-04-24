import { useEffect, useState } from 'react';

import { createSourceData } from '@hms-dbmi/vizarr/src/io';
import { FetchStore, open } from 'zarrita';

import { isBioformats2Raw } from './utils';

export const useSourceData = (config) => {
  const [sourceData, setSourceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metadataUrl = `${config.source}${config.source.slice(-1) === '/' ? '' : '/'}.zmetadata`;
        const { metadata } = await (await fetch(metadataUrl)).json();

        if ('.zattrs' in metadata) {
          const store = new FetchStore(config.source);
          const node = await open(store, { kind: 'group' });

          if (isBioformats2Raw(node)) {
            // https://ngff.openmicroscopy.org/0.4/#bf2raw-details
            if (node.attrs['bioformats2raw.layout'] !== 3) {
              setError(new Error('Unsupported bioformats2raw layout'));
              return;
            }
            let series;
            if ('OME/.zattrs' in metadata) {
              const ome = await open(node.resolve('OME'), { kind: 'group' });
              series = ome.attrs.series;
            } else {
              const multiscaleKeys = Object.keys(metadata).filter(
                (key) =>
                  key.endsWith('/.zattrs') && 'multiscales' in metadata[key],
              );
              series = multiscaleKeys.map((key) => key.split('/')[0]);
            }
            const seriesUrl = `${config.source}${config.source.slice(-1) === '/' ? '' : '/'}${series?.[0] || ''}`;
            const data = await createSourceData({ source: seriesUrl });
            setSourceData(data);
            return;
          } else {
            const data = await createSourceData(config);
            setSourceData(data);
            return;
          }
        }
        setSourceData(null);
        setError(new Error('No attrs found in metadata'));
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
