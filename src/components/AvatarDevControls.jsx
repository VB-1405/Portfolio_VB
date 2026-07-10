import { useEffect } from "react";
import { useControls } from "leva";
import {
  DESK_RIG_POSITION,
  DESK_RIG_SCALE,
} from "./CyberDesk";

const MODEL_POSITION = [0.4, 0.15, -0.1];
const MODEL_SCALE = 1;
const BASE_ROTATION_Y = -1.4;
const CAMERA_POSITION = [0, 1.35, 3.2];
const CAMERA_FOV = 30;

export default function AvatarDevControls({ onChange }) {
  const avatar = useControls("Avatar", {
    positionX: { value: MODEL_POSITION[0], min: -3, max: 3, step: 0.05 },
    positionY: { value: MODEL_POSITION[1], min: -3, max: 3, step: 0.05 },
    positionZ: { value: MODEL_POSITION[2], min: -3, max: 3, step: 0.05 },
    rotationY: { value: BASE_ROTATION_Y, min: -3.2, max: 3.2, step: 0.05 },
    scale: { value: MODEL_SCALE, min: 0.2, max: 3, step: 0.05 },
    cameraX: { value: CAMERA_POSITION[0], min: -5, max: 5, step: 0.05 },
    cameraY: { value: CAMERA_POSITION[1], min: -5, max: 5, step: 0.05 },
    cameraZ: { value: CAMERA_POSITION[2], min: -5, max: 5, step: 0.05 },
    fov: { value: CAMERA_FOV, min: 15, max: 60, step: 1 },
  });

  // deskRotationY removed: the desk now always shares the avatar's rotationY
  // (see AvatarScene.jsx), so they can't drift out of sync again.
  const desk = useControls("Desk Rig", {
    deskX: { value: DESK_RIG_POSITION[0], min: -3, max: 3, step: 0.05 },
    deskY: { value: DESK_RIG_POSITION[1], min: -3, max: 3, step: 0.05 },
    deskZ: { value: DESK_RIG_POSITION[2], min: -3, max: 3, step: 0.05 },
    deskScale: { value: DESK_RIG_SCALE, min: 0.2, max: 3, step: 0.05 },
  });

  useEffect(() => {
    onChange({ ...avatar, ...desk });
  }, [avatar, desk, onChange]);

  return null;
}
