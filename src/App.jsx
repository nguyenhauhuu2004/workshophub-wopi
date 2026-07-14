import React, { useState, useEffect, useCallback, memo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";

// Import components
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

// Import pages
import About from "./components/About";
import Skills from "./components/Skills";
import Academics from "./components/Academics";
import Projects from "./components/Projects";
import CP from "./components/CP";
import Contact from "./components/Contact";


// --- NEW AWESOME BACKGROUND ---
// This new background uses layered CSS gradients to create a subtle, professional blueprint/grid effect.
// It's static, lightweight, and adapts to both light and dark modes.
export const StaticBackground = memo(({ theme }) => {
  // Define styles for both themes using HSL colors for easy adjustments
  const lightStyles = {
    backgroundColor: 'hsl(210, 40%, 98%)', // A very light, clean, off-white
    backgroundImage: `
      /* Faint, large radial gradients for a subtle glow effect */
      radial-gradient(ellipse at 10% 10%, hsla(210, 100%, 94%, 0.5), transparent),
      radial-gradient(ellipse at 90% 90%, hsla(240, 100%, 94%, 0.5), transparent),
      /* The main grid pattern */
      linear-gradient(hsl(210, 40%, 96%) 1.5px, transparent 1.5px),
      linear-gradient(to right, hsl(210, 40%, 96%) 1.5px, hsl(210, 40%, 98%) 1.5px)
    `,
    backgroundSize: '40px 40px',
  };

  const darkStyles = {
    backgroundColor: 'hsl(222, 47%, 11%)', // A deep, professional navy blue
    backgroundImage: `
      /* Faint, large radial gradients for a subtle glow effect */
      radial-gradient(ellipse at 10% 10%, hsla(212, 96%, 15%, 0.8), transparent),
      radial-gradient(ellipse at 90% 90%, hsla(260, 90%, 20%, 0.5), transparent),
      /* The main grid pattern */
      linear-gradient(hsla(222, 47%, 13%, 1) 1.5px, transparent 1.5px),
      linear-gradient(to right, hsla(222, 47%, 13%, 1) 1.5px, hsl(222, 47%, 11%) 1.5px)
    `,
    backgroundSize: '40px 40px',
  };

  // Select the appropriate styles based on the current theme
  const styles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <div
      className="fixed inset-0 -z-50 pointer-events-none transition-colors duration-500"
      style={styles}
    />
  );
});
StaticBackground.displayName = "StaticBackground";


// --- ANIMATION LOGIC ---
const pageVariants = { initial: { opacity: 0, y: 20 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 } };
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

// Memoize the routes to prevent re-calculation
const AnimatedRoutes = memo(() => {
    const location = useLocation();
    const routesConfig = [
        // THE FIX: Render the About component on the root path '/'
        { path: "/", Component: About },
        { path: "/about", Component: About },
        { path: "/skills", Component: Skills },
        { path: "/academics", Component: Academics },
        { path: "/projects", Component: Projects },
        { path: "/cp", Component: CP },
        { path: "/contact", Component: Contact },
    ];
    
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {routesConfig.map(({ path, Component }) => (
                  <Route key={path} path={path} element={
                    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                      <Component />
                    </motion.div>
                  }/>
                ))}
            </Routes>
        </AnimatePresence>
    );
});
AnimatedRoutes.displayName = 'AnimatedRoutes';


// --- THE FINAL APP COMPONENT (Using the Layout pattern) ---
function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [sideNavOpen, setSideNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Layout 
        theme={theme} 
        toggleTheme={toggleTheme} 
        sideNavOpen={sideNavOpen}
        setSideNavOpen={setSideNavOpen}
      >
        <AnimatedRoutes />
      </Layout>
      <Analytics />
    </Router>
  );
}

export default App;