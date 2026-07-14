import React, { useState, useCallback, useMemo, memo } from "react";
import { Code, Layers, Terminal, Sparkles, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

// --- Animation Variants (The "Staggered Entrance" Pattern) ---
// This container will orchestrate the animation for the whole page
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Time delay between each child animating in
    },
  },
};

// This variant will be used by each item in the container
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// --- Child Components (No changes needed) ---
const SkillTag = memo(({ tag, onMouseEnter, onMouseLeave, className }) => (
  <span
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${className} text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700`}
  >
    {tag}
  </span>
));
SkillTag.displayName = "SkillTag";

const SkillSection = memo(({ section, hoveredTag, onTagHover, onTagLeave }) => {
  const { icon, title, tags } = section;

  const tagElements = useMemo(
    () =>
      tags.map((tag, i) => {
        const tagId = `${title}-${i}`;
        const isHovered = hoveredTag === tagId;
        return (
          <SkillTag
            key={tag}
            tag={tag}
            className={
              isHovered
                ? "bg-neutral-200 dark:bg-neutral-700"
                : "bg-neutral-100 dark:bg-neutral-800"
            }
            onMouseEnter={() => onTagHover(tagId)}
            onMouseLeave={onTagLeave}
          />
        );
      }),
    [tags, title, hoveredTag, onTagHover, onTagLeave]
  );

  return (
    // This card is now an item in the grid's stagger animation
    <motion.div
      variants={itemVariants}
      className="rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 shadow p-6 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">{tagElements}</div>
    </motion.div>
  );
});
SkillSection.displayName = "SkillSection";

// --- Static Data (No changes needed) ---
const SKILLS_SECTIONS = [
    { icon: <Code className="w-6 h-6" />, title: "Programming Languages", tags: ["C", "C++", "Java", "JavaScript", "Python", "HTML", "CSS"] },
    { icon: <Layers className="w-6 h-6" />, title: "Frameworks & Libraries", tags: ["React", "Tailwind CSS", "SFML", "NumPy", "Pandas"] },
    { icon: <Terminal className="w-6 h-6" />, title: "Tools & Platforms", tags: ["Git", "GitHub", "VS Code", "Jupyter Notebook", "Sublime Text"] },
    { icon: <Sparkles className="w-6 h-6" />, title: "Interests", tags: ["Competitive Programming", "DSA", "Machine Learning", "Web Development"] },
];


// --- Main Skills Component ---
const SkillsComponent = memo(function Skills() {
  const [hoveredTag, setHoveredTag] = useState(null);
  const handleTagHover = useCallback((tagId) => setHoveredTag(tagId), []);
  const handleTagLeave = useCallback(() => setHoveredTag(null), []);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      {/* 1. This is the SINGLE animation container for the whole page. */}
      {/* It uses `animate`, not `whileInView`, for guaranteed execution. */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center w-full"
      >
        {/* Item 1: The header text block */}
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 flex items-center gap-4 text-foreground">
                <Settings2 className="w-8 h-8 sm:w-11 sm:h-11 text-primary drop-shadow-sm" />
                Skills & Interests
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Here you'll find a snapshot of my technical toolkit and passions. I
                believe in learning by doing, and my skills reflect a blend of academic
                depth and hands-on project work.
            </p>
        </motion.div>
        
        {/* Item 2: The entire skill card grid animates in as one block... */}
        <motion.div
          variants={containerVariants} // It's also a container for its own children
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {SKILLS_SECTIONS.map((section) => (
            <SkillSection
              key={section.title}
              section={section}
              hoveredTag={hoveredTag}
              onTagHover={handleTagHover}
              onTagLeave={handleTagLeave}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
});

SkillsComponent.displayName = "Skills";

export default SkillsComponent;