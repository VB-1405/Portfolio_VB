import { useEffect } from "react";
import { useControls } from "leva";

const MODEL_POSITION = [0, 0, 0];
const MODEL_SCALE = 1;
const BASE_ROTATION_Y = -0.6;
const CAMERA_POSITION = [0, 1.35, 3.2];
const CAMERA_FOV = 30;

export default function AvatarDevControls({ onChange }) {
  const controls = useControls(
    "Avatar",
    {
      positionX: { value: MODEL_POSITION[0], min: -3, max: 3, step: 0.05 },
      positionY: { value: MODEL_POSITION[1], min: -3, max: 3, step: 0.05 },
      positionZ: { value: MODEL_POSITION[2], min: -3, max: 3, step: 0.05 },
      rotationY: { value: BASE_ROTATION_Y, min: -3.2, max: 3.2, step: 0.05 },
      scale: { value: MODEL_SCALE, min: 0.2, max: 3, step: 0.05 },
      cameraX: { value: CAMERA_POSITION[0], min: -5, max: 5, step: 0.05 },
      cameraY: { value: CAMERA_POSITION[1], min: -5, max: 5, step: 0.05 },
      cameraZ: { value: CAMERA_POSITION[2], min: -5, max: 5, step: 0.05 },
      fov: { value: CAMERA_FOV, min: 15, max: 60, step: 1 },
    },
    { collapsed: false },
  );

  useEffect(() => {
    onChange(controls);
  }, [controls, onChange]);

  return null;
}
