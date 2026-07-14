import React, { memo, useMemo } from "react";
import { ExternalLink, Swords } from "lucide-react";
import { motion } from "framer-motion";

// --- Animation Variants (The "Staggered Entrance" Pattern) ---
// Master container for the entire section
const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

// Nested container for lists/grids inside the section
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Single variant for all items that animate in
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};


// --- Child Components (Unchanged) ---
const PlatformCard = React.memo(({ platform }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow p-6 flex flex-col items-center text-center h-full"
  >
    <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-background shadow border border-border/60 mb-4">
      <img
        src={platform.logo}
        alt={`${platform.name} Logo`}
        className={`w-full h-full object-contain ${
          platform.name === "CodeChef" ? "dark:invert" : ""
        }`}
        loading="lazy"
      />
    </div>
    <div className="text-lg font-semibold text-foreground">{platform.name}</div>
    <div className="text-sm text-muted-foreground mt-1 mb-1">
      <span className="text-foreground/80">Handle:</span>{" "}
      <a href={platform.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline dark:hover:text-primary-foreground/70 transition">
        {platform.handle}
      </a>
    </div>
    <div className="flex flex-col gap-[2px] text-sm text-muted-foreground mb-3">
      {platform.stats.map((stat, i) => (
        <div key={i}>
          {stat.label}:{" "}
          <span className="font-medium text-foreground/80">{stat.value}</span>
        </div>
      ))}
    </div>
    <a href={platform.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 flex items-center gap-1 text-primary font-medium text-sm hover:underline dark:hover:text-primary-foreground/70 transition">
      <ExternalLink className="w-4 h-4" />
      View Profile
    </a>
  </motion.div>
));
PlatformCard.displayName = "PlatformCard";

const HighlightItem = React.memo(({ item }) => (
  <motion.li variants={itemVariants}>
    {item.text}
    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline dark:hover:text-primary-foreground/70 font-medium transition">
      {item.linkText}
    </a>
    {item.rest}
  </motion.li>
));
HighlightItem.displayName = "HighlightItem";


// --- Main Component ---
function CompetitiveProgrammingComponent() {
  const cpPlatforms = useMemo(() => [
    { name: "Codeforces", logo: "/assets/logos/codeforces.png", handle: "shashank2401", profileUrl: "https://codeforces.com/profile/shashank2401", stats: [{ label: "Max Rating", value: "1600" }, { label: "Rank", value: "Expert" }] },
    { name: "CodeChef", logo: "/assets/logos/codechef.svg", handle: "shashankraj24", profileUrl: "https://www.codechef.com/users/shashankraj24", stats: [{ label: "Max Rating", value: "1954" }, { label: "Rank", value: "4-Star" }] },
    { name: "LeetCode", logo: "/assets/logos/leetcode.png", handle: "shashank2401", profileUrl: "https://leetcode.com/u/shashank2401/", stats: [{ label: "Max Rating", value: "2022" }, { label: "Badge", value: "Knight" }] },
    { name: "AtCoder", logo: "/assets/logos/atcoder.png", handle: "shashank24", profileUrl: "https://atcoder.jp/users/shashank24", stats: [{ label: "Max Rating", value: "927" }, { label: "Rank", value: "6 Kyu" }] },
  ], []);

  const highlights = useMemo(() => [
    { text: "Solved over ", linkText: "900+ problems", href: "https://codolio.com/profile/shashank24", rest: " across multiple CP platforms, enhancing algorithmic thinking and coding efficiency." },
    { text: "Participated in more than ", linkText: "100 contests", href: "https://codolio.com/profile/shashank24", rest: ", consistently testing and improving my problem-solving skills." },
    { text: "Ranked among the top with a ", linkText: "Global Rank of 755", href: "https://codeforces.com/contest/2114/standings/participant/211255102#p211255102", rest: " in Codeforces Round 1027 (Div. 3)." },
    { text: "Achieved a notable ", linkText: "Global Rank of 849", href: "https://codeforces.com/contest/2090/standings/participant/206688395#p206688395", rest: " in Codeforces Round 1012 (Div. 2)." },
    { text: "Earned a ", linkText: "Top 100 finish (Rank 99)", href: "https://www.codechef.com/rankings/START154D?itemsPerPage=100&order=asc&page=1&sortBy=rank", rest: " in CodeChef Starters 154 (Div. 4)." },
    { text: "Demonstrated strong performance with a ", linkText: "Global Rank of 120", href: "https://www.codechef.com/rankings/START187B?itemsPerPage=100&order=asc&page=1&sortBy=rank", rest: " in CodeChef Starters 187 (Div. 2)." },
  ], []);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        variants={sectionContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center w-full space-y-16"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center max-w-2xl">
          {/* --- THIS IS THE FIXED HEADING --- */}
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight flex flex-col sm:flex-row items-center sm:items-baseline justify-center gap-2 sm:gap-4 text-foreground text-center">
            <Swords className="w-8 h-8 text-primary drop-shadow-sm flex-shrink-0" />
            <span>Competitive Programming</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            My competitive programming journey has been filled with challenging
            problems, thrilling contests, and constant learning. Here you’ll find my
            profiles, stats, and some highlights from major platforms.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-5xl">
          <motion.div
            variants={listContainerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {cpPlatforms.map((platform) => (
              <PlatformCard key={platform.name} platform={platform} />
            ))}
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-3xl">
          <div className="bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Key Highlights
            </h3>
            <p className="text-base text-muted-foreground mb-4">
              <a href="https://codolio.com/profile/shashank24" className="text-primary hover:underline dark:hover:text-primary-foreground/70 transition font-medium" target="_blank" rel="noopener noreferrer">
                View my Codolio Profile for more details
              </a>
            </p>
            <motion.ul
              variants={listContainerVariants}
              className="list-disc ml-5 space-y-2 text-base text-muted-foreground"
            >
              {highlights.map((item, index) => (
                <HighlightItem key={index} item={item} />
              ))}
            </motion.ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default React.memo(CompetitiveProgrammingComponent);