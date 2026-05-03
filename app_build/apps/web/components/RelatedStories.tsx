'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { relatedData } from '@/lib/model/data';


export default function RelatedStories() {
  return (
    <section className="bg-neutral-950 py-32 border-t border-neutral-900 relative z-10">

      {/* 1. STORIES GRID SECTION (Moved to the top) */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-center text-2xl md:text-3xl text-white border-b border-neutral-800 pb-6">
            More from the {relatedData.partner}
          </h2>
        </motion.div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {relatedData.stories.slice(0, 6).map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
            >
              <Link href={story.url} className="group block h-full">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-neutral-900 border border-neutral-800">
                  <Image
                    src={story.thumbnail}
                    alt={story.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                <div className="absolute top-4 left-4 opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-10">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-neutral-700/50 text-xs font-medium text-amber-500 uppercase tracking-wider rounded-full shadow-lg">
                    {story.type}
                  </span>
                </div>
                </div>
                <h3 className="text-xl text-white group-hover:text-amber-500 transition-colors line-clamp-2 mb-2">
                  {story.title}
                </h3>
                {story.subtitle && (
                  <p className="text-md text-gray-400 line-clamp-2 leading-relaxed">
                    {story.subtitle}
                  </p>
                )}
              </Link>
            </motion.article>
          ))}
        </div>
      </div>

      {/* 2. EXPLORE MORE HEADING (Non-interactive, moved above the hero) */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-center text-2xl md:text-3xl text-white border-b border-neutral-800 pb-6">
            Explore more
          </h2>
        </motion.div>
      </div>

      {/* 3. FEATURED RELATED THEME (Smaller Hero Overlay Style) */}
      {relatedData.theme && (
        <div className="max-w-7xl mx-auto px-8 md:px-16 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="relative w-full aspect-[4/3] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl group block"
          >
            <Link href={relatedData.theme.url}>
              <Image
                src={relatedData.theme.thumbnail}
                alt={relatedData.theme.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-500 group-hover:from-black" />

              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                <h3 className="text-sm font-medium text-amber-500 uppercase tracking-widest mb-3">
                  Related theme
                </h3>
                <h2 className="text-3xl md:text-5xl text-white mb-4 leading-tight drop-shadow-lg max-w-3xl">
                  {relatedData.theme.title}
                </h2>
                {relatedData.theme.subtitle && (
                  <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl drop-shadow-md">
                    {relatedData.theme.subtitle}
                  </p>
                )}
                <span className="inline-block px-8 py-3 mt-2 w-fit border border-white/40 rounded-2xl text-white font-medium tracking-wide transition-all duration-300 group-hover:border-amber-500 group-hover:text-amber-500 group-hover:bg-amber-500/10 backdrop-blur-sm">
                  View theme
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      )}

    </section>
  );
}
