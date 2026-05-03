'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface PanExhibitProps {
  title: string;
  description: string;
  imageSrc: string;
  index: number;
}

const bounceTransition = {
  y: {
    duration: 1.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  }
} as const;

export default function PanExhibitSection({ title, description, imageSrc, index }: PanExhibitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirst = index === 0;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // 1. THE ZOOM & PAN
  const imageScale = useTransform(scrollYProgress, [0, 0.3, 0.75], [1, 2.5, 2.5]);
  const imageX = useTransform(scrollYProgress, [0, 0.3, 0.65], ["0%", "0%", "15%"]);
  const imageY = useTransform(scrollYProgress, [0, 0.3, 0.65], ["0%", "0%", "-25%"]);

  // 2. TEXT FADING
  const mainTextOpacity = useTransform(scrollYProgress, [0, 0.1, 0.25], [0, 1, 0]);
  const detail1Opacity = useTransform(scrollYProgress, [0.25, 0.35, 0.45], [0, 1, 0]);
  const detail2Opacity = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [0, 1, 0]);

  // 3. ARROW OPACITY
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // 4. CLICK HANDLER
  const scrollToNextSection = () => {
    if (containerRef.current && containerRef.current.nextElementSibling) {
      containerRef.current.nextElementSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const marginClass = isFirst ? 'mt-0' : '-mt-[100vh]';

  return (
    <section
      ref={containerRef}
      className={`relative h-[400vh] bg-neutral-950 ${marginClass}`}
      style={{ zIndex: index * 10 }}
    >
      {!isFirst && (
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none" />
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden shadow-2xl">

        <motion.div
          style={{
            scale: imageScale,
            x: imageX,
            y: imageY
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover opacity-70"
            quality={85}
            sizes="100vw"
            priority={isFirst}
          />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div style={{ opacity: mainTextOpacity }} className="absolute max-w-3xl px-8 text-center">
            <h2 className="text-5xl md:text-7xl text-white mb-6 drop-shadow-lg">
              {title}
            </h2>
            <p className="text-xl text-gray-300 drop-shadow-md">
              {description}
            </p>
          </motion.div>

          <motion.div style={{ opacity: detail1Opacity }} className="absolute top-1/4 left-1/4 max-w-sm px-6 py-4 text-left bg-black/60 backdrop-blur-md border-l-4 border-amber-600">
            <p className="text-lg text-gray-200">
              The intricate collar lace dimensions pinpoint the exact era of this piece.
            </p>
          </motion.div>

          <motion.div style={{ opacity: detail2Opacity }} className="absolute bottom-1/4 right-1/4 max-w-sm px-6 py-4 text-left bg-black/60 backdrop-blur-md border-l-4 border-amber-600">
            <p className="text-lg text-gray-200">
              The precise front button arrangement acts as a definitive identifier.
            </p>
          </motion.div>
        </div>

        {/* 5. CONDITIONAL CLICKABLE ARROW */}
        {isFirst && (
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 z-40 cursor-pointer"
            style={{ opacity: arrowOpacity }}
            animate={{ y: [0, 15] }}
            transition={bounceTransition}
            onClick={scrollToNextSection}
            whileHover={{ scale: 1.1, color: "white" }}
          >
             <ChevronDownIcon className="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg" />
          </motion.div>
        )}

      </div>
    </section>
  );
}
