import { Reel, type ReelProps } from "../../templates/Reel";
import { HookScene } from "./scenes/HookScene";
import { MechanismScene } from "./scenes/MechanismScene";
import { PayoffScene } from "./scenes/PayoffScene";
import { SetupScene } from "./scenes/SetupScene";

export const Post02: React.FC<ReelProps> = (props) => {
  return (
    <Reel
      {...props}
      scenes={{
        hook: HookScene,
        setup: SetupScene,
        mechanism: MechanismScene,
        payoff: PayoffScene,
      }}
    />
  );
};
