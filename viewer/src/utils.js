import { open } from 'zarrita';

export async function getZarrJson(location, path = '') {
  const jsonUrl = `${location.replace(/\/?$/, '/')}${path ? path.replace(/\/?$/, '/') : ''}zarr.json`;
  let zarrJson;
  try {
    zarrJson = await (await fetch(jsonUrl)).json();
  } catch {}
  return zarrJson;
}

export async function getZarrMetadata(location) {
  const metadataUrl = `${location.replace(/\/?$/, '/')}.zmetadata`;
  let metadata;
  try {
    metadata = (await (await fetch(metadataUrl)).json()).metadata;
  } catch {}
  return metadata;
}

export async function findSeries(location, node, zarrVersion) {
  // separate "multiscales" images MUST be stored in consecutively numbered groups starting from 0
  let s = 0;
  let series = [];
  while (true) {
    let seriesNode;
    try {
      seriesNode = await open(node.resolve(`${s}`), {
        kind: 'group',
      });
    } catch {
      break;
    }
    let attrs;
    if (zarrVersion === 3) {
      try {
        attrs = (await getZarrJson(location, s.toString()))?.attributes?.ome;
      } catch {}
    } else {
      attrs = seriesNode.attrs;
    }
    if (attrs?.['multiscales']) {
      series.push(`${s}`);
    } else break;
    s++;
  }
  return series;
}
