import { useEffect, useCallback, memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  BrainCircuit,
  GraduationCap,
  FolderKanban,
  Swords,
  Mail,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Move static data outside component
const navLinks = [
  { to: "/about", icon: User, text: "About" },
  { to: "/skills", icon: BrainCircuit, text: "Skills" },
  { to: "/academics", icon: GraduationCap, text: "Education" },
  { to: "/projects", icon: FolderKanban, text: "Projects" },
  { to: "/cp", icon: Swords, text: "CP" },
  { to: "/contact", icon: Mail, text: "Contact" },
];

// Animation variants
const navVariants = {
  closed: {
    x: "100%",
    opacity: 0.5,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 30,
      mass: 0.8,
      when: "afterChildren",
    },
  },
  open: {
    x: "0%",
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 30,
      mass: 0.8,
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  closed: { y: 20, opacity: 0 },
  open: { y: 0, opacity: 1 },
};

const overlayVariants = {
  hidden: { opacity: 0, pointerEvents: "none" },
  visible: { opacity: 0.4, pointerEvents: "auto" },
};

// Memoized nav item component
const NavItem = memo(({ link, onNavClick, isActive }) => {
  const Icon = link.icon;
  return (
    <motion.li variants={itemVariants} className="w-full">
      <Link
        to={link.to}
        onClick={onNavClick}
        className={`flex flex-row items-center justify-start gap-4 text-lg font-medium transition-colors duration-200 py-2 w-full
          ${isActive ? "text-primary" : "text-foreground hover:text-primary"}
        `}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" style={{ display: 'inline-block' }} />
        <span className="leading-none" style={{ display: 'inline-block' }}>{link.text}</span>
      </Link>
    </motion.li>
  );
});
NavItem.displayName = "NavItem";

const SideNav = memo(({ open, onClose }) => {
  const location = useLocation();

  // Memoize event handlers
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  const handleClickOutside = useCallback((e) => {
    if (!e.target.closest(".side-nav-panel") && !e.target.closest(".hamburger")) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown, handleClickOutside]);

  // Memoize nav items to prevent recreation
  const navItems = useMemo(() =>
    navLinks.map((link) => (
      <NavItem
        key={link.to}
        link={link}
        onNavClick={onClose}
        isActive={location.pathname === link.to}
      />
    )), [onClose, location.pathname]
  );

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={false}
        animate={open ? "visible" : "hidden"}
        variants={overlayVariants}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black z-40 lg:hidden"
        onClick={onClose}
        style={{
          willChange: "opacity",
          transform: "translate3d(0, 0, 0)"
        }}
      />

      {/* Navigation Panel */}
      <motion.nav
        initial={false}
        animate={open ? "open" : "closed"}
        variants={navVariants}
        className="side-nav-panel fixed top-0 right-0 w-[270px] h-screen bg-card shadow-lg z-50 flex flex-col p-6 pt-8"
        aria-label="Main Navigation"
        style={{
          willChange: "transform, opacity",
          transform: "translate3d(0, 0, 0)"
        }}
      >
        {/* Close Button */}
        <motion.button
          variants={itemVariants}
          className="self-end text-muted-foreground hover:text-primary transition-all duration-300 hover:rotate-90 cursor-pointer p-2 -mr-2 mb-8 will-change-transform"
          aria-label="Close Menu"
          type="button"
          onClick={onClose}
        >
          <X className="w-7 h-7" />
        </motion.button>

        {/* Navigation Links */}
        <ul className="flex-1 space-y-6">
          {navItems}
        </ul>
      </motion.nav>
    </>
  );
});

SideNav.displayName = "SideNav";

export default SideNav;