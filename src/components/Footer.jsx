import { Github, Linkedin, Mail } from "lucide-react";
import { memo } from "react";

// Social links data outside the component for efficiency
const socialLinks = [
  {
    href: "https://github.com/shashank2401",
    title: "GitHub",
    icon: Github,
  },
  {
    href: "https://www.linkedin.com/in/shashankraj2401/",
    title: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "mailto:shashankraj0124@gmail.com",
    title: "Email",
    icon: Mail,
  },
];

const Footer = memo(() => {
  return (
    <footer className="w-full bg-muted/30 border-t border-border pt-8 pb-10 mt-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center text-center gap-5">
        <div className="text-sm text-muted-foreground">
          © 2025 Shashank Raj. All rights reserved.
        </div>
        <div className="flex justify-center gap-6">
          {socialLinks.map(({ href, title, icon: Icon }) => (
            <a
              key={title}
              href={href}
              title={title}
              aria-label={title}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-transform duration-200 hover:scale-110"
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;