"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type VideoModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  videoUrl: string;
  title: string;
};

export default function VideoModal({ isOpen, setIsOpen, videoUrl, title }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl p-0 border-0 bg-black">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isOpen && (
          <video
            className="w-full h-auto rounded-lg"
            controls
            autoPlay
            src={videoUrl}
            onEnded={() => setIsOpen(false)}
          >
            Tu navegador no soporta la etiqueta de video.
          </video>
        )}
      </DialogContent>
    </Dialog>
  );
}
