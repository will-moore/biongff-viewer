export const isBioformats2Raw = (node) => {
  return 'bioformats2raw.layout' in node.attrs;
};
