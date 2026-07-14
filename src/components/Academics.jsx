import React, { useMemo, memo } from "react";
import { GraduationCap } from "lucide-react";
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


// --- Child Component (No changes needed) ---
const EducationCard = memo(({ education }) => {
  const { logo, alt, title, link, program, year, scoreLabel, score } = education;

  return (
    // This card is now an item in the list's stagger animation
    <motion.div
      variants={itemVariants}
      className="bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow p-6 flex items-center gap-6"
    >
      <div className="w-16 h-16 flex-shrink-0 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shadow rounded-xl p-1 overflow-hidden">
        <img
          src={logo}
          alt={alt}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
          decoding="async"
          width={64}
          height={64}
          style={{ aspectRatio: "1/1" }}
        />
      </div>
      <div className="flex flex-col text-left gap-1">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline hover:text-foreground dark:hover:text-primary-foreground/70 font-medium transition-colors duration-200"
        >
          {program}
        </a>
        <div className="text-sm text-muted-foreground mt-2 space-y-1">
          <p>
            <span className="font-medium text-foreground/80">Year:</span> {year}
          </p>
          <p>
            <span className="font-medium text-foreground/80">{scoreLabel}:</span> {score}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
EducationCard.displayName = "EducationCard";


// --- Static Data (No changes needed) ---
const ACADEMICS_DATA = [
  {
    logo: "/assets/logos/iit_bhu.png",
    alt: "IIT BHU Logo",
    title: "Indian Institute of Technology (BHU) Varanasi",
    link: "https://iitbhu.ac.in/dept/civ",
    program: "B.Tech in Civil Engineering",
    year: "2023 – 2027",
    scoreLabel: "CGPA",
    score: "8.14 / 10",
  },
  {
    logo: "/assets/logos/sps_rohini.jpg",
    alt: "SPS Rohini Logo",
    title: "Sachdeva Public School, Rohini",
    link: "https://www.spsrohini.com/",
    program: "CBSE (Class XII - 2022, Class X - 2020)",
    year: "2022",
    scoreLabel: "Percentage",
    score: "Class XII - 92.80%, Class X - 97.00%",
  },
];


// --- Main Academics Component ---
const AcademicsComponent = memo(function Academics() {
  const educationCards = useMemo(
    () =>
      ACADEMICS_DATA.map((education, index) => (
        <EducationCard key={`${education.title}-${index}`} education={education} />
      )),
    []
  );

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
                <GraduationCap className="w-8 h-8 sm:w-11 sm:h-11 text-primary drop-shadow-sm" />
                Education
            </h2>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                My academic journey has been a blend of rigorous learning and practical
                application, spanning general academics and engineering. Here are the
                institutions and milestones that have shaped my foundation.
            </motion.p>
        </motion.div>

        {/* Item 2: The entire list of education cards */}
        <motion.div
          variants={containerVariants} // It's also a container for its own children
          className="w-full max-w-2xl flex flex-col gap-8"
        >
          {educationCards}
        </motion.div>
      </motion.div>
    </div>
  );
});

AcademicsComponent.displayName = "Academics";

export default AcademicsComponent;