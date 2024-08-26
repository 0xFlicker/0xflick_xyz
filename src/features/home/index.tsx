"use client";
import "@react-three/fiber";
import { ThreeCanvas } from "@/features/home/Canvas";
import { useEffect, FC } from "react";
import { useDetectWebgl } from "@/hooks/useDetectWebgl";
import { redirect } from "next/navigation";

const HomePage: FC<{
  isMobile: boolean;
}> = ({ isMobile }) => {
  const isWebglSupported = useDetectWebgl();
  useEffect(() => {
    if (isWebglSupported === false) {
      redirect("/~/about");
    }
  }, [isWebglSupported]);

  return <ThreeCanvas />;
};
export default HomePage;
