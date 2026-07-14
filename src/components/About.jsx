import { Github, Linkedin, Mail, FileText, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, memo } from "react";

// Memoized social link component
const SocialLink = memo(({ href, icon, title, className }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
    title={title}
  >
    {icon}
  </a>
));
SocialLink.displayName = "SocialLink";

// Memoized tag component
const Tag = memo(({ tag }) => (
  <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all">
    {tag}
  </span>
));
Tag.displayName = "Tag";

const SOCIAL_LINKS = [
  {
    href: "https://github.com/shashank2401",
    icon: <Github className="w-5 h-5" />,
    title: "GitHub",
  },
  {
    href: "https://www.linkedin.com/in/shashankraj2401/",
    icon: <Linkedin className="w-5 h-5" />,
    title: "LinkedIn",
  },
  {
    href: "mailto:shashankraj0124@gmail.com",
    icon: <Mail className="w-5 h-5" />,
    title: "Email",
  },
];

const TAGS = [
  "Competitive Programming",
  "Data Structures",
  "Algorithms",
  "C++",
  "Problem Solving",
  "Web Development",
];

const RESUME_URL =
  "https://drive.google.com/file/d/1FIq3CNO73-M9GXjIhZAYo49gQGxgmudO/view?usp=sharing";

export default memo(function About() {
  const socialLinksElements = useMemo(
    () =>
      SOCIAL_LINKS.map(({ href, icon, title }) => (
        <SocialLink
          key={title}
          href={href}
          icon={icon}
          title={title}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-105 transition-all"
        />
      )),
    []
  );

  const tagElements = useMemo(
    () => TAGS.map((tag) => <Tag key={tag} tag={tag} />),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full min-h-[80vh] flex items-center justify-center"
    >
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-5xl px-4 py-12">
        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-md bg-neutral-200 dark:bg-neutral-800"
          tabIndex={0}
          aria-label="Profile photo of NGUYEN HAU HUU"
        >
          <img
            src="/assets/MyPhotograph.png"
            alt="NGUYEN HAU HUU"
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
            style={{ aspectRatio: "1/1" }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col items-center md:items-start"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-200/50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              About Me
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-3 text-foreground text-center md:text-left">
            Hi, I'm{" "}
            <span className="bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-600 dark:from-white dark:via-neutral-300 dark:to-neutral-400 bg-clip-text text-transparent">
              NGUYEN HAU HUU
            </span>
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>IIT (BHU) Varanasi</span>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-4 text-center md:text-left">
            I'm a passionate student with a strong interest in{" "}
            <span className="text-foreground font-medium">
              competitive programming
            </span>{" "}
            and tackling challenging problems. I love crafting efficient
            solutions and exploring new technologies. My journey in tech
            combines rigorous academic training with hands-on project
            experience.
          </p>

          <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
            {tagElements}
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {socialLinksElements}
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-105 transition-all"
            >
              <FileText className="w-4 h-4" />
              Resume
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});