import { FC, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Content } from "./Content";
import { useSwipeable } from "react-swipeable";
import { MAX_PAGE } from "./constants";
import { ScrollProvider } from "@/hooks/useScroll";

export const MobileThreeCanvas: FC<{}> = () => {
  const [page, setPage] = useState(0);
  const handlers = useSwipeable({
    onSwipedUp: () => {
      console.log("swiped up");
      setPage((prev) => Math.min(prev + 1, 6));
    },
    onSwipedDown: () => {
      console.log("swiped down");
      setPage((prev) => Math.max(prev - 1, 0));
    },
    touchEventOptions: {
      passive: false,
    },
    // ...(page === 0 ? {} : { preventDefaultTouchmoveEvent: true }),
  });
  return (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000");
      }}
      style={{ height: "100vh", width: "100vw" }}
      frameloop="always"
      {...handlers}
    >
      <ScrollProvider swipeOnly pages={MAX_PAGE}>
        <Content animatedToPage={page} />
      </ScrollProvider>
    </Canvas>
  );
};
