import React from 'react';

import ArrowCircleDownOutlinedIcon from '@mui/icons-material/ArrowCircleDownOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import Rotate90DegreesCcwOutlinedIcon from '@mui/icons-material/Rotate90DegreesCcwOutlined';
import Rotate90DegreesCwOutlinedIcon from '@mui/icons-material/Rotate90DegreesCwOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';

export const Controller = ({
  layerState,
  resetViewState,
  toggleVisibility,
  rotate90,
  translate,
  setIdentityMatrix,
}) => {
  if (!layerState) {
    return <></>;
  }
  return (
    <div className="viewer-controller">
      <Stack spacing={2}>
        <p>Layers</p>
        <FormGroup>
          {
            <FormControlLabel
              key={layerState.layerProps.id}
              label={layerState.layerProps.id}
              control={
                <Checkbox
                  label={layerState.id}
                  checked={layerState.on}
                  icon={<VisibilityOffIcon />}
                  checkedIcon={<VisibilityIcon />}
                  onChange={() => toggleVisibility()}
                />
              }
            />
          }
          {layerState.labels?.map((label) => (
            <FormControlLabel
              key={label.layerProps.id}
              label={`${label.layerProps.id} (label)`}
              control={
                <Checkbox
                  label={label.layerProps.id}
                  checked={label.on}
                  icon={<VisibilityOffIcon />}
                  checkedIcon={<VisibilityIcon />}
                  onChange={() => toggleVisibility(label.layerProps.id)}
                />
              }
            />
          ))}
        </FormGroup>
        <button type="button" className="btn" onClick={resetViewState}>
          Reset view
        </button>
        <button type="button" className="btn" onClick={setIdentityMatrix}>
          Reset matrix
        </button>
        <Stack direction="row" spacing={2}>
          <button type="button" className="btn">
            <Rotate90DegreesCcwOutlinedIcon onClick={() => rotate90(true)} />
          </button>
          <button type="button" className="btn">
            <Rotate90DegreesCwOutlinedIcon onClick={() => rotate90()} />
          </button>
        </Stack>
        <Stack direction="row" spacing={2}>
          <button type="button" className="btn">
            <ArrowCircleLeftOutlinedIcon onClick={() => translate(-100, 0)} />
          </button>
          <button type="button" className="btn">
            <ArrowCircleRightOutlinedIcon onClick={() => translate(100, 0)} />
          </button>
        </Stack>
        <Stack direction="row" spacing={2}>
          <button type="button" className="btn">
            <ArrowCircleDownOutlinedIcon onClick={() => translate(0, 100)} />
          </button>
          <button type="button" className="btn">
            <ArrowCircleUpOutlinedIcon onClick={() => translate(0, -100)} />
          </button>
        </Stack>
      </Stack>
    </div>
  );
};
