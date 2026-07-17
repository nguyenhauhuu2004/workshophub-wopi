import { motion } from "framer-motion";
import { Instagram, Twitter, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#0D0D1A] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
          <path d="M0,0 C360,80 1080,0 1440,60 L1440,0 Z" fill="#F5F0EA" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-violet-900/25 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>Wo<span className="text-[#7C3AED]">Py</span></h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">The world's most creative marketplace for handcrafted workshops and artistic experiences.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="flex-1 bg-white/8 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="bg-[#7C3AED] text-white text-sm font-semibold px-5 py-2.5 rounded-full">Join</motion.button>
            </div>
          </div>
          {/* {Object.entries("").map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-4">{group}</p>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l}><motion.a href="#" whileHover={{ color: "#7C3AED", x: 3 }} className="text-gray-500 text-sm inline-block">{l}</motion.a></li>
                ))}
              </ul>
            </div>
          ))} */}
        </div>
        <div className="border-t border-white/6 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">© 2025 WoPy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Instagram, Twitter, Youtube, Mail].map((Icon, i) => (
              <motion.a key={i} href="#" whileHover={{ scale: 1.2, color: "#7C3AED" }} whileTap={{ scale: 0.9 }} className="text-gray-600"><Icon size={18} /></motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}