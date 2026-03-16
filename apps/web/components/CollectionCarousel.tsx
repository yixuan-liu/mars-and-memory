"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { CollectionCarouselItem, collectionCarouselData } from "@/lib/model/data";

interface CollectionCarouselProps {
  items?: CollectionCarouselItem[];
  onEnter3DViewer?: (item: CollectionCarouselItem) => void;
}

export default function CollectionCarousel({
  items = collectionCarouselData,
  onEnter3DViewer
}: CollectionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(1);

  // Left and right navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[700px] flex flex-col items-center justify-center overflow-hidden bg-transparent text-white font-sans">

      {/* Exhibition title area */}
      <div className="absolute top-6 text-center z-20 pointer-events-none">
        <h2 className="text-3xl font-serif tracking-widest text-white/90 uppercase">Mars & Memory</h2>
        <p className="text-sm text-white/50 mt-2 tracking-widest">Select an artifact to inspect</p>
      </div>

      {/* Left and right navigation arrows */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
        aria-label="Previous artifact"
      >
        <ChevronLeftIcon className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentIndex === items.length - 1}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
        aria-label="Next artifact"
      >
        <ChevronRightIcon className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
      </button>

      {/* Carousel main area */}
      <div className="relative w-full h-[500px] flex items-center justify-center mt-12">
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const offset = index - currentIndex;
            const isCenter = offset === 0;

            return (
              <motion.div
                key={item.id}
                className={`absolute rounded-xl shadow-2xl flex flex-col justify-end overflow-hidden cursor-pointer border border-white/10 ${item.color || "bg-gray-900"}`}
                onClick={() => setCurrentIndex(index)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: offset * 220,
                  scale: isCenter ? 1 : 0.75 - Math.abs(offset) * 0.1,
                  opacity: isCenter ? 1 : 0.4 - Math.abs(offset) * 0.15,
                  zIndex: 10 - Math.abs(offset),
                  rotateY: offset * -12,
                  width: isCenter ? 380 : 260,
                  height: isCenter ? 480 : 360,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                {/* Artifact image placeholder */}
                <div className="flex-grow w-full border-b border-white/10 flex items-center justify-center bg-white/5 relative">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full opacity-80" />
                  ) : (
                    <span className="text-white/20 font-serif italic">[ Artifact Model Render ]</span>
                  )}
                </div>

                {/* Details and interaction panel */}
                <motion.div
                  className="p-6 bg-black/60 backdrop-blur-md h-48 flex flex-col justify-between"
                  animate={{ opacity: isCenter ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-xl font-serif font-bold text-white/90 leading-tight">{item.title}</h3>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/80 whitespace-nowrap border border-white/5">{item.era}</span>
                    </div>
                    {isCenter && (
                      <p className="text-sm text-white/60 line-clamp-3 leading-relaxed mt-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {isCenter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEnter3DViewer) onEnter3DViewer(item);
                      }}
                      className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium tracking-wide border border-white/20"
                    >
                      Inspect in 3D
                    </button>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom navigation dot indicator */}
      <div className="absolute bottom-6 flex gap-3 z-20">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "bg-white w-8" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
