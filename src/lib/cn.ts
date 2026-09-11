import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind merge only knows the font sizes Tailwind ships with. Without this, it reads
 * our custom `text-p4` as a text COLOUR and deletes `text-white` sitting next
 * to it, which is how a dark button ended up with invisible text.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["h1", "p1", "p2", "p3", "p4", "p5"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
