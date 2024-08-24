import { FC, ReactNode, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useState } from "react";

export const CopyToClipboard: FC<{
  text: string;
  children: (handleClick: () => void) => ReactNode;
}> = ({ children, text }) => {
  const notify = useCallback(() => {
    // @ts-ignore
    if (navigator.share) {
      toast("Copied to clipboard", {
        className: "bg-blue-500 text-white",
        bodyClassName: "text-sm font-medium",
      });
    } else if (navigator.clipboard) {
      toast("Copied to clipboard", {
        className: "bg-blue-500 text-white",
        bodyClassName: "text-sm font-medium",
      });
    }
  }, []);
  const handleClick = useCallback(() => {
    notify();
    if (navigator.share) {
      navigator.share({
        title: "Share this",
        url: text,
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }, [notify, text]);

  return (
    <>
      {children(handleClick)}
      <ToastContainer position="bottom-center" autoClose={3000} />
    </>
  );
};
