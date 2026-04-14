import React from "react";
import { registerRoot, Composition } from "remotion";
import {
  FacecamVideo,
  calculateFacecamMetadata,
  DEFAULT_PROPS,
} from "./FacecamVideo";

const Root: React.FC = () => (
  <>
    <Composition
      id="FacecamVideo"
      component={FacecamVideo}
      calculateMetadata={calculateFacecamMetadata}
      defaultProps={DEFAULT_PROPS}
    />
  </>
);

registerRoot(Root);
