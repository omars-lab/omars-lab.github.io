import React from 'react';
import Carousel from '@site/src/components/Carousel';
import { getReferences } from '@site/src/data/references';

export interface CategoryCarouselProps {
  // Topic key, e.g. "learning-resources" (matches a file in src/data/references).
  topic: string;
  // Category within that topic, e.g. "books".
  category: string;
  // Hide the prev/next controls if desired.
  controls?: boolean;
  // Optional fallback rendered when the category has no references yet.
  emptyFallback?: React.ReactNode;
}

// Renders a horizontally-scrollable carousel of reference cards for one
// (topic, category), reading its data from src/data/references. Posts use this
// instead of embedding card data inline, so refreshing a post means editing the
// JSON, never the post body.
const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  topic,
  category,
  controls = true,
  emptyFallback = null,
}) => {
  const items = getReferences(topic, category);
  if (!items.length) return <>{emptyFallback}</>;
  return <Carousel items={items} controls={controls} />;
};

export default CategoryCarousel;
