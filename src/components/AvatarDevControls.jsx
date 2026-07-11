import { useEffect } from "react";
import { useControls } from "leva";
import {
  DESK_RIG_POSITION,
  DESK_RIG_SCALE,
} from "./CyberDesk";

const MODEL_POSITION = [0.45, 0.15, -0.1];
const MODEL_SCALE = 1;
const BASE_ROTATION_Y = -1.4;
const CAMERA_POSITION = [-0.6, 1.2, 4.9];
const CAMERA_FOV = 32;

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

  // Peripherals: independent of desk/avatar rig — these only move the
  // monitor/keyboard/mouse relative to the desk surface, for matching them
  // up against a reference screenshot without touching desk/avatar coords.
  const peripherals = useControls("Peripherals", {
    monX: { value: 0.01, min: -2, max: 2, step: 0.01 },
    monY: { value: 1.41, min: 0, max: 2, step: 0.01 },
    monZ: { value: 1.00, min: -1, max: 2, step: 0.01 },
    monScale: { value: 2.15, min: 0.3, max: 3, step: 0.05 },
    monTurnDeg: { value: -4, min: -180, max: 180, step: 1 },
    kbX: { value: 0.1, min: -1, max: 1, step: 0.01 },
    kbY: { value: 0.77, min: 0, max: 2, step: 0.01 },
    kbZ: { value: 0.00, min: -1, max: 1, step: 0.01 },
    mouseX: { value: -0.3, min: -1, max: 1, step: 0.01 },
    mouseY: { value: 0.76, min: 0, max: 2, step: 0.01 },
    mouseZ: { value: 0.00, min: -1, max: 1, step: 0.01 },
  });

  useEffect(() => {
    onChange({ ...avatar, ...desk, ...peripherals });
  }, [avatar, desk, peripherals, onChange]);

  return null;
}
