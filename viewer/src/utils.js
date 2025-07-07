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

// Following ome-ngff-validator approach https://github.com/ome/ome-ngff-validator/blob/d29a48d930b68c21f2ee931ef0f681f695e70d1a/src/utils.js#L110
export async function getXmlDom(location) {
  const url = `${location.replace(/\/?$/, '/')}OME/METADATA.ome.xml`;
  let xmlString;
  try {
    xmlString = await (await fetch(url)).text();
  } catch {}
  if (!xmlString) {
    return null;
  }
  const parser = new DOMParser();
  const dom = parser.parseFromString(xmlString, 'text/xml');
  return dom;
}

// From ome-ngff-validator https://github.com/ome/ome-ngff-validator/blob/d29a48d930b68c21f2ee931ef0f681f695e70d1a/src/Bioformats2rawLayout/index.svelte#L70
export function parseXml(dom) {
  const root = dom.documentElement;

  let rsp = { images: [] };
  let index = 0;
  for (const child of root.children) {
    if (child.tagName === 'Image') {
      const dimensionOrder = child
        .getElementsByTagName('Pixels')?.[0]
        ?.getAttribute('DimensionOrder');
      rsp.images.push({
        name: child.getAttribute('Name'),
        id: child.getAttribute('ID'),
        path: '' + index++,
        ...(dimensionOrder && { dimensionOrder }),
      });
    }
    // error handling - parsererror gives html doc
    if (child.tagName === 'body') {
      if (child.firstElementChild.tagName === 'parsererror') {
        rsp.errors = [...child.firstElementChild.children].map(
          (el) => el.innerHTML,
        );
      }
    }
  }
  return rsp;
}
