import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Search, Star, Clock, Users, SlidersHorizontal, X } from "lucide-react";
import { WORKSHOPS, CATEGORIES } from "@/data";
import WorkshopCard from "@/components/WorkshopCard";
import Header, { type NavigationSection } from "@/components/layout/header";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const

const navigationData: NavigationSection[] = [
  {
    title: 'Home',
    href: '#'
  },
  {
    title: 'Products',
    href: '#'
  },
  {
    title: 'About Us',
    href: '#'
  },
  {
    title: 'Contact Us',
    href: '#'
  }
]


export function WorkshopsPage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [priceMax, setPriceMax] = useState(200);
  const [level, setLevel] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return WORKSHOPS.filter((w) => {
      const matchSearch = w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.instructor.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || w.category === category;
      const matchPrice = w.price <= priceMax;
      const matchLevel = level === "All" || w.level === level;
      return matchSearch && matchCat && matchPrice && matchLevel;
    });
  }, [search, category, priceMax, level]);

  const cats = ["All", ...CATEGORIES.map((c) => c.name)];

  return (
<div className="relative">
          <Header navigationData={navigationData}  />

    <div className="min-h-screen bg-[#FAFAF7] pt-16">
      {/* Hero strip */}
      <div className="bg-[#0D0D1A] py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-900/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-fuchsia-900/20 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Explore <span className="text-[#7C3AED]">Workshops</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg mb-8">Discover {WORKSHOPS.length}+ creative experiences near you</motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workshops, instructors..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-gray-500 outline-none focus:border-violet-500 text-base transition-colors" />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Category pills */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-colors bg-white">
            <SlidersHorizontal size={15} /> Filters
          </button>
          {cats.map((c) => (
            <motion.button key={c} onClick={() => setCategory(c)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${category === c ? "bg-[#7C3AED] text-white shadow-lg shadow-violet-200" : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"}`}>
              {c}
            </motion.button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Max Price: ${priceMax}</label>
              <input type="range" min={20} max={200} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-violet-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$20</span><span>$200</span></div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">địa chỉ</label>
              <div className="flex flex-wrap gap-2">
                <Combobox items={frameworks}>
                    <ComboboxInput placeholder="Select a framework" />
                    <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                        {(item) => (
                            <ComboboxItem key={item} value={item}>
                            {item}
                            </ComboboxItem>
                        )}
                        </ComboboxList>
                    </ComboboxContent>
                    </Combobox>

              </div>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSearch(""); setCategory("All"); setPriceMax(200); setLevel("All"); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X size={14} /> Clear all filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-400 mb-8">
          Showing <span className="font-semibold text-[#0D0D1A]">{filtered.length}</span> workshops
          {category !== "All" && <span className="ml-1">in <span className="text-[#7C3AED] font-semibold">{category}</span></span>}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-[#0D0D1A] mb-2">No workshops found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or search term</p>
            <button onClick={() => { setSearch(""); setCategory("All"); setPriceMax(200); setLevel("All"); }}
              className="bg-[#7C3AED] text-white font-semibold px-6 py-3 rounded-full">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}>
                <WorkshopCard />    
                
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>

  );
}
