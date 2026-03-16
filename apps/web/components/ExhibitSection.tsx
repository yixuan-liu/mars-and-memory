'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

interface ExhibitProps {
  title: string;
  description: string;
  detailText?: string;
  imageSrc: string;
  index: number;
  isLast: boolean;
}

// Arrow bounce animation definition
const bounceTransition = {
  y: {
    duration: 1.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  }
} as const;

export default function ExhibitSection({ title, description, detailText, imageSrc, index, isLast }: ExhibitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirst = index === 0;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // 1. STANDARD ZOOM (Slower, continuous zoom compared to the pan)
  const imageScale = useTransform(scrollYProgress, [0, 0.75], [1, 1.2]);

  // 2. TEXT FADING
  // If it's the first section, start opacity at 1. Otherwise, start at 0.
  const text1Opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.3],
    [1, 1, 0]
  );

  const text2Opacity = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0, 1, 0]);

  // 3. ARROW OPACITY
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // 4. CLICK HANDLER to scroll to the next section
  const scrollToNextSection = () => {
    if (containerRef.current && containerRef.current.nextElementSibling) {
      containerRef.current.nextElementSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Click handler to scroll to the previous section
  const scrollToPreviousSection = () => {
    if (containerRef.current && containerRef.current.previousElementSibling) {
      containerRef.current.previousElementSibling.scrollIntoView({
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
      {/* Cloaking Edge Shadow */}
      {!isFirst && (
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none" />
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden shadow-2xl">

        <motion.div style={{ scale: imageScale }} className="absolute inset-0 w-full h-full">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover opacity-70"
            quality={75}
            sizes="100vw"
            priority={isFirst}
          />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* MAIN HEADING & SUBTITLE */}
          <motion.div
            style={{ opacity: text1Opacity }}
            className={
              isFirst
                ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-8 text-center"
                : "absolute bottom-32 left-8 md:left-16 max-w-2xl text-left z-30"
            }
          >
            <h2 className={`text-white mb-6 drop-shadow-lg ${isFirst ? 'text-5xl md:text-7xl' : 'text-4xl md:text-3xl'}`}>
              {title}
            </h2>
            <p className={`text-lg text-gray-300 drop-shadow-md ${!isFirst ? 'bg-black/50 p-5 rounded-xl backdrop-blur-md border-l-4 border-neutral-500 inline-block' : ''}`}>
              {description}
            </p>
          </motion.div>

          {/* CONDITIONAL RENDER: Only draw this box if detailText exists */}
          {detailText && (
            <motion.div style={{ opacity: text2Opacity }} className="absolute max-w-xl px-8 text-left bg-black/60 p-8 backdrop-blur-md border-l-4 border-amber-600">
              <p className="text-lg text-gray-200 leading-relaxed">
                {detailText}
              </p>
            </motion.div>
          )}
        </div>

        {/* CONDITIONAL SCROLL UP ARROW (Shows on all sections EXCEPT the first) */}
        {!isFirst && (
          <motion.div
            // Positioned at the top center
            className="absolute top-12 left-1/2 -translate-x-1/2 text-white/70 z-40 cursor-pointer"
            style={{ opacity: arrowOpacity }}
            // Bounce upwards
            animate={{ y: [0, -15] }}
            transition={bounceTransition}
            onClick={scrollToPreviousSection}
            whileHover={{ scale: 1.1, color: "white" }}
          >
             <ArrowUpCircleIcon className="w-10 h-10 md:w-6 md:h-6 drop-shadow-lg bg-black/20 rounded-full" />
          </motion.div>
        )}

        {/* DOWN ARROW: Condition removed. Now shows on ALL sections */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 z-40 cursor-pointer"
          style={{ opacity: arrowOpacity }}
          animate={{ y: [0, 15] }}
          transition={bounceTransition}
          onClick={scrollToNextSection}
          whileHover={{ scale: 1.1, color: "white" }}
        >
           <ArrowDownCircleIcon className="w-10 h-10 md:w-6 md:h-6 drop-shadow-lg bg-black/20 rounded-full" />
        </motion.div>

      </div>
    </section>
  );
}
