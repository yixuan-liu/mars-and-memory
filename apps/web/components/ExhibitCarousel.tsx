'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CarouselItem } from '@/lib/model/data';

interface ExhibitCarouselProps {
  title: string;
  subtitle?: string;
  items: CarouselItem[];
}

export default function ExhibitCarousel({ title, subtitle, items }: ExhibitCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 1. 核心改变：左右导航箭头位于轮播图的左右两侧 (绝对定位覆盖在轨道上)
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // 获取卡片宽度（包含 gap），确保平移距离是一个完整的卡片
      const cards = carouselRef.current.getElementsByTagName('article');
      if (cards.length === 0) return;

      const cardWidth = cards[0].offsetWidth;
      const gapWidth = 24; // 对应 tailwind 'gap-6' (6 * 4px)
      const scrollStep = cardWidth + gapWidth;

      const { scrollLeft } = carouselRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - scrollStep : scrollLeft + scrollStep;

      carouselRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth',
      });
    }
  };

  // 监听滚动状态，控制按钮的显示/隐藏（可选，但能提升UX）
  const checkScrollStatus = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;

    // 增加一些像素的容差 (例如 2px)
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  // 绑定滚动事件
  useEffect(() => {
    checkScrollStatus();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollStatus);
      // 同时监听窗口大小改变
      window.addEventListener('resize', checkScrollStatus);
    }
    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', checkScrollStatus);
        window.removeEventListener('resize', checkScrollStatus);
      }
    };
  }, []);

  return (
    <section className="bg-neutral-950 py-24 md:py-32 border-t border-neutral-900 relative z-10 overflow-hidden">

      {/* 头部标题区 */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 mb-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-2xl mx-auto w-full"
        >
          <h2 className="text-center text-3xl md:text-4xl font-sans text-white mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-center text-xl text-gray-400 font-light">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>

      {/* 2. 核心改变：居中显示与侧边箭头 */}
      {/* 新建立一个 relative 的容器，作为箭头和轨道的共同基准 */}
      <div className="w-full relative group">

        {/* === 侧边导航箭头 (绝对定位) === */}
        {/* 左箭头 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-10 md:left-14 top-1/2 -translate-y-1/2 p-3 rounded-full border border-neutral-700 bg-black/50 hover:bg-neutral-900 text-neutral-400 hover:text-amber-500 hover:border-amber-500 transition-all duration-300 backdrop-blur-sm shadow-xl z-20 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        {/* 右箭头 */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-10 md:right-14 top-1/2 -translate-y-1/2 p-3 rounded-full border border-neutral-700 bg-black/50 hover:bg-neutral-900 text-neutral-400 hover:text-amber-500 hover:border-amber-500 transition-all duration-300 backdrop-blur-sm shadow-xl z-20 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        {/* === 横向滚动轨道 === */}
        {/* 核心改变：利用大 Padding 和 snap-center 实现居中 */}
        <div
          ref={carouselRef}
          // px-12 md:px-24 确保两侧的卡片有足够的呼吸空间可以呈现在视口中央
          className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-12 md:px-24 pb-12 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              // 核心改变：snap-center 强制每一帧都锁定在卡片中心
              className="relative flex-none w-[85vw] md:w-[400px] snap-center group cursor-pointer"
            >
              {/* 图片容器保持不变 */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 mb-6">
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 85vw, 400px"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>

              {/* 文本内容保持不变 */}
              <div className="border-l-2 border-transparent group-hover:border-amber-500 pl-4 transition-colors duration-300">
                <h3 className="text-2xl font-sans text-white mb-2 group-hover:text-amber-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
