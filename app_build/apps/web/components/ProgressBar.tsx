'use client';

import { motion, useScroll } from 'framer-motion';

export default function ProgressBar() {
  // By not passing a target to useScroll, it defaults to tracking the whole page window
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-1 bg-amber-600 z-50 origin-left drop-shadow-md"
      // scaleX transforms the width of the element from 0 to 1 based on scroll progress
      style={{ scaleX: scrollYProgress }}
    />
  );
}
