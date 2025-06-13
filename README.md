# BioNGFF Viewer

Monorepo while testing around

## Development

Clone repo and submodules

```sh
git clone git@github.com:BioNGFF/biongff-viewer.git
git submodule init
git submodule update
```

Install dependencies and run development server

```sh
pnpm i
pnpm run dev
```

Pass the resource to load through the URL source parameter
e.g. 
```
http://localhost:5173?source=https://haniffa.cog.sanger.ac.uk/breast-cancer/xenium/0.0.1/morphology_mip.zarr
```
