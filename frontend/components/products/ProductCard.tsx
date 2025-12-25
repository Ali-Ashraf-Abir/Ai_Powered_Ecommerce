"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types"; // Assumes your mongoose schema is typed here

interface ProductCardProps {
  product: Product;
}

/** * UI-Specific type definition. 
 * We extend Partial<Product> to handle the loose nature of data passed to cards.
 */
type UIProduct = Partial<Product> & {
  _id: string;
  // Ensuring these exist for the UI logic, even if optional in Schema
  color?: string[]; 
  tags?: string[];
  metadata?: Record<string, any>;
};

// --- COLOR UTILITIES ---

const COLOR_MAP: Record<string, string> = {
  ivory: "#FFFFF0",
  beige: "#F5F5DC",
  black: "#222222", 
  white: "#FFFFFF",
  navy: "#0B2545",
  red: "#E11D48",
  emerald: "#046C4E",
  blush: "#F7D6D0",
  mustard: "#D4A017",
  coral: "#FF6B6B",
  olive: "#708238",
  lavender: "#B497BD",
  chocolate: "#7B3F00",
  pink: "#F472B6",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  brown: "#8B5E3C",
  teal: "#0D9488",
  burgundy: "#800020",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
};

function normalizeColor(name?: string): string {
  if (!name) return "#E2E8F0"; // Slate-200 default
  const k = String(name).toLowerCase().trim();
  
  // 1. Direct map match
  if (k in COLOR_MAP) return COLOR_MAP[k];
  
  // 2. Hex code check
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(k)) return k;
  
  // 3. Fallback: Generate a consistent pastel color from the string hash
  let hash = 0;
  for (let i = 0; i < k.length; i++) hash = k.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 80%)`; // Soft pastel fallback
}

// --- ICON SYSTEM ---

/**
 * Determines the specific visual silhouette based on Product Model fields.
 */
function inferIconType(p: UIProduct): string {
  // Combine all descriptive text fields for a robust keyword search
  const textCorpus = [
    p.category, 
    p.name, 
    p.style, 
    p.fit, 
    ...(p.tags || [])
  ].join(" ").toLowerCase();

  // 1. Dress Logic
  if (textCorpus.includes("dress") || p.category?.toLowerCase() === "dresses") {
    if (textCorpus.includes("gown") || textCorpus.includes("evening") || textCorpus.includes("formal")) return "gown";
    if (textCorpus.includes("maxi") || textCorpus.includes("long")) return "maxi-dress";
    if (textCorpus.includes("mini") || textCorpus.includes("short")) return "mini-dress";
    if (textCorpus.includes("kimono") || textCorpus.includes("wrap") || textCorpus.includes("kaftan")) return "kimono-dress";
    return "dress"; // Default A-line
  }

  // 2. Tops
  if (textCorpus.includes("top") || textCorpus.includes("shirt") || textCorpus.includes("blouse") || textCorpus.includes("tee")) return "tshirt";
  
  // 3. Outerwear
  if (textCorpus.includes("jacket") || textCorpus.includes("coat") || textCorpus.includes("blazer") || textCorpus.includes("cardigan")) return "jacket";
  
  // 4. Bottoms
  if (textCorpus.includes("pant") || textCorpus.includes("jean") || textCorpus.includes("trouser") || textCorpus.includes("legging") || textCorpus.includes("skirt")) return "pants";
  
  // 5. Footwear
  if (textCorpus.includes("shoe") || textCorpus.includes("boot") || textCorpus.includes("sneaker") || textCorpus.includes("sandal") || textCorpus.includes("heel")) return "shoes";

  return "accessory";
}

/**
 * A set of custom-drawn SVG paths for clothing silhouettes.
 * Designed on a 200x200 grid.
 */
function ClothingIcon({ kind, color, className }: { kind: string; color: string; className?: string }) {
  const stroke = "#1e293b"; // Slate-800 outline
  const strokeWidth = 2;
  
  const svgProps = {
    viewBox: "0 0 200 200",
    className: className,
    fill: color,
    stroke: stroke,
    strokeWidth: strokeWidth,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  switch (kind) {
    case "gown": // Mermaid style / Evening gown
      return (
        <svg {...svgProps}>
          <path d="M65 40 C65 40 75 55 100 55 C125 55 135 40 135 40 C140 60 135 80 125 90 C115 100 110 110 115 130 C120 150 150 170 160 190 L40 190 C50 170 80 150 85 130 C90 110 85 100 75 90 C65 80 60 60 65 40 Z" />
        </svg>
      );
    case "maxi-dress": // Long flowing
      return (
        <svg {...svgProps}>
          <path d="M70 30 L80 30 L85 50 C90 50 110 50 115 50 L120 30 L130 30 L135 60 C135 70 130 90 120 100 L140 190 L60 190 L80 100 C70 90 65 70 65 60 L70 30 Z" />
        </svg>
      );
    case "mini-dress": // Short, cute
      return (
        <svg {...svgProps}>
          <path d="M70 40 C80 50 120 50 130 40 L145 60 L135 80 L125 75 L130 130 L70 130 L75 75 L65 80 L55 60 Z" />
        </svg>
      );
    case "kimono-dress": // Wrap/Wide sleeves
      return (
        <svg {...svgProps}>
          <path d="M100 30 L140 50 L140 90 L120 100 L125 180 L75 180 L80 100 L60 90 L60 50 L100 30 Z M100 30 L100 100" />
        </svg>
      );
    case "dress": // Standard A-Line
      return (
        <svg {...svgProps}>
          <path d="M75 40 C80 40 90 40 125 40 L130 70 C130 80 125 90 115 100 L135 180 L65 180 L85 100 C75 90 70 80 70 70 L75 40 Z" />
        </svg>
      );
    case "jacket":
      return (
        <svg {...svgProps}>
          <path d="M70 40 L90 50 L110 50 L130 40 L145 60 L140 160 L120 170 L115 70 L85 70 L80 170 L60 160 L55 60 Z" />
        </svg>
      );
    case "pants":
      return (
        <svg {...svgProps}>
          <path d="M60 40 L140 40 L145 60 L135 180 L105 175 L100 80 L95 175 L65 180 L55 60 Z" />
        </svg>
      );
    case "shoes":
      return (
        <svg {...svgProps}>
          <path d="M50 120 C50 100 70 90 90 90 L120 90 C140 90 150 110 150 130 C150 145 150 160 140 170 L50 170 L50 120 Z M110 110 L150 140" />
        </svg>
      );
    default: // T-shirt / Generic Top
      return (
        <svg {...svgProps}>
          <path d="M70 30 C80 40 120 40 130 30 L160 50 L150 75 L135 70 L135 170 L65 170 L65 70 L50 75 L40 50 Z" />
        </svg>
      );
  }
}


// --- MAIN COMPONENT ---

export default function ProductCard({ product }: ProductCardProps) {
  const p = product as UIProduct;

  // 1. Color Logic: Try primary color from array -> metadata -> fallback
  const primaryColorName = (p.color && p.color.length > 0) ? p.color[0] : (p.metadata?.color || "gray");
  const fillHex = normalizeColor(primaryColorName);
  
  // 2. Icon Logic
  const iconKind = inferIconType(p);

  // 3. Badge Logic
  const isOutOfStock = p.stockQuantity === 0;
  const isLowStock = (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 5;
  
  // Check tags for keywords
  const tagList = p.tags || [];
  const isSustainable = tagList.some(t => /sustainable|organic|recycled/i.test(t));
  const isNew = (new Date().getTime() - new Date(p.createdAt || "").getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days old

  return (
    <Link href={`/products/${p._id}`} className="group block h-full">
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        
        {/* --- IMAGE / ICON AREA --- */}
        <div className="relative aspect-[4/5] bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
          
          {/* Main Icon */}
          <div className="relative w-full h-full max-w-[180px] max-h-[180px] flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
            <ClothingIcon 
              kind={iconKind} 
              color={fillHex} 
              className="w-full h-full drop-shadow-sm" 
            />
          </div>

          {/* Badges (Top Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {p.isFeatured && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-black text-white rounded-sm">
                Featured
              </span>
            )}
            {isSustainable && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 rounded-sm">
                Eco-Friendly
              </span>
            )}
            {isNew && !p.isFeatured && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 rounded-sm">
                New
              </span>
            )}
          </div>

          {/* Stock Status (Top Right) */}
          <div className="absolute top-3 right-3">
             {isOutOfStock ? (
               <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-md border border-gray-200">
                 Sold Out
               </span>
             ) : isLowStock ? (
               <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-2 py-1 rounded-md border border-orange-100">
                 Only {p.stockQuantity} Left
               </span>
             ) : null}
          </div>
        </div>

        {/* --- DETAILS AREA --- */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Category & Brand */}
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              {p.category}
            </span>
            {p.analytics?.averageRating ? (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-600">
                  {p.analytics.averageRating.toFixed(1)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {p.name}
          </h3>

          {/* AI Description Snippet (Optional) */}
          {p.aiDescription && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
              {p.aiDescription}
            </p>
          )}

          {/* Spacer to push price to bottom */}
          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                ${p.price.toFixed(2)}
              </span>
            </div>

            {/* Sizes Preview (if available) */}
            {p.sizes && p.sizes.length > 0 && (
               <div className="text-xs text-gray-400 font-medium">
                 {p.sizes.length} Sizes
               </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}