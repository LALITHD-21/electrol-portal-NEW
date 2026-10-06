'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  MouseEventHandler,
  UIEvent,
} from 'react';
import { motion, useInView } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index?: number;
  threshold?: number;
  className?: string;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index = 0,
  threshold = 0.25,
  className = '',
  onMouseEnter,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: threshold, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.88, opacity: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('cursor-pointer will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};

export interface AnimatedListProps<T = any> {
  items?: T[];
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  maxHeight?: string | number;
  gradientVariant?: 'dark' | 'light' | 'slate';
  gradientColor?: string;
}

const DEFAULT_ITEMS = [
  'Item 1',
  'Item 2',
  'Item 3',
  'Item 4',
  'Item 5',
  'Item 6',
  'Item 7',
  'Item 8',
  'Item 9',
  'Item 10',
  'Item 11',
  'Item 12',
  'Item 13',
  'Item 14',
  'Item 15',
];

export function AnimatedList<T = any>({
  items = DEFAULT_ITEMS as unknown as T[],
  renderItem,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  maxHeight = '400px',
  gradientVariant = 'dark',
  gradientColor,
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;

    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;

      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  // Determine gradient color styling
  const getGradientFromClass = () => {
    if (gradientColor) return '';
    if (gradientVariant === 'light') return 'from-white';
    if (gradientVariant === 'slate') return 'from-slate-50';
    return 'from-[#060010]';
  };

  const gradientFromClass = getGradientFromClass();

  return (
    <div className={cn('relative w-full max-w-[500px]', className)}>
      <div
        ref={listRef}
        className={cn(
          'overflow-y-auto p-4 transition-all',
          displayScrollbar
            ? gradientVariant === 'dark'
              ? '[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#060010] [&::-webkit-scrollbar-thumb]:bg-[#222] [&::-webkit-scrollbar-thumb]:rounded-[4px]'
              : '[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-[4px]'
            : 'scrollbar-hide'
        )}
        onScroll={handleScroll}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
          scrollbarColor:
            gradientVariant === 'dark' ? '#222 #060010' : '#cbd5e1 #f1f5f9',
        }}
      >
        {items.map((item, index) => {
          const isSelected = selectedIndex === index;

          return (
            <AnimatedItem
              key={index}
              delay={Math.min(index * 0.03, 0.15)}
              index={index}
              className="mb-3"
              onMouseEnter={() => handleItemMouseEnter(index)}
              onClick={() => handleItemClick(item, index)}
            >
              {renderItem ? (
                renderItem(item, index, isSelected)
              ) : (
                <div
                  className={cn(
                    'p-3.5 rounded-xl transition-all duration-200 select-none border',
                    gradientVariant === 'dark'
                      ? isSelected
                        ? 'bg-[#222] border-white/20 text-white shadow-md'
                        : 'bg-[#111] border-white/5 text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
                      : isSelected
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
                    itemClassName
                  )}
                >
                  <p className="m-0 text-sm font-medium">
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </p>
                </div>
              )}
            </AnimatedItem>
          );
        })}
      </div>

      {showGradients && (
        <>
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-[45px] bg-gradient-to-b to-transparent pointer-events-none transition-opacity duration-300 ease-out z-10',
              gradientFromClass
            )}
            style={{
              opacity: topGradientOpacity,
              background: gradientColor
                ? `linear-gradient(to bottom, ${gradientColor}, transparent)`
                : undefined,
            }}
          />
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t to-transparent pointer-events-none transition-opacity duration-300 ease-out z-10',
              gradientFromClass
            )}
            style={{
              opacity: bottomGradientOpacity,
              background: gradientColor
                ? `linear-gradient(to top, ${gradientColor}, transparent)`
                : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}

export interface AnimatedScrollContainerProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string | number;
  showGradients?: boolean;
  gradientVariant?: 'dark' | 'light' | 'slate';
  gradientColor?: string;
  displayScrollbar?: boolean;
}

export function AnimatedScrollContainer({
  children,
  className = '',
  maxHeight,
  showGradients = true,
  gradientVariant = 'light',
  gradientColor,
  displayScrollbar = true,
}: AnimatedScrollContainerProps) {
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 40, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 40, 1));
  };

  const getGradientFromClass = () => {
    if (gradientColor) return '';
    if (gradientVariant === 'dark') return 'from-[#060010]';
    if (gradientVariant === 'slate') return 'from-slate-50';
    return 'from-white';
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'overflow-y-auto transition-all',
          displayScrollbar
            ? '[&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full'
            : 'scrollbar-hide'
        )}
        onScroll={handleScroll}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
        }}
      >
        {children}
      </div>

      {showGradients && (
        <>
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-[36px] bg-gradient-to-b to-transparent pointer-events-none transition-opacity duration-300 ease-out z-10',
              getGradientFromClass()
            )}
            style={{
              opacity: topGradientOpacity,
              background: gradientColor
                ? `linear-gradient(to bottom, ${gradientColor}, transparent)`
                : undefined,
            }}
          />
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-[48px] bg-gradient-to-t to-transparent pointer-events-none transition-opacity duration-300 ease-out z-10',
              getGradientFromClass()
            )}
            style={{
              opacity: bottomGradientOpacity,
              background: gradientColor
                ? `linear-gradient(to top, ${gradientColor}, transparent)`
                : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}

export default AnimatedList;
