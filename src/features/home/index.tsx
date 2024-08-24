"use client";
import "@react-three/fiber";
import { ThreeCanvas } from "@/features/home/Canvas";
import { MobileThreeCanvas } from "@/features/home/MobileCanvas";
import { useState, useEffect, FC, useCallback } from "react";
import { useDetectWebgl } from "@/hooks/useDetectWebgl";
import { redirect } from "next/navigation";
import { useNavigationEvent } from "@/hooks/useNavigationEvent";

const HomePage = () => {
  const isWebglSupported = useDetectWebgl();
  useEffect(() => {
    if (isWebglSupported === false) {
      redirect("/~/about");
    }
  }, [isWebglSupported]);
  const [loading, setLoading] = useState(false);

  useNavigationEvent(
    useCallback(() => {
      setLoading(false);
    }, []),
    useCallback(() => {
      setLoading(true);
    }, [])
  );

  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("only screen and (max-width: 768px)").matches;
  return (
    <>
      {loading ? (
        <div />
      ) : isMobile && isTouchDevice ? (
        <MobileThreeCanvas />
      ) : (
        <ThreeCanvas />
      )}
    </>
  );
};
export default HomePage;
