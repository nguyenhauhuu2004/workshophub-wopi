import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";

import Logo from "@/assets/svg/logo";
import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/stores/useAuthStore";
import ProfileDialog from "../ProfileDialog";

export type NavigationSection = {
  title: string;
  href: string;
};

type HeaderProps = {
  navigationData: NavigationSection[];
  className?: string;
};

const Header = ({ navigationData, className }: HeaderProps) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const [profileOpen, setProfileOpen] = useState(false);

  const { setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-16 border-b transition-all duration-300",
          scrolled
            ? "bg-background/70 backdrop-blur-3xl border-border/50 shadow-sm"
            : "bg-background border-transparent",
          className,
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 text-lg font-semibold leading-none"
          >
            WOPY
            <Logo className="gap-3" />
          </a>

          {/* Navigation */}
          <NavigationMenu className="max-md:hidden">
            <NavigationMenuList className="flex-wrap justify-start gap-0">
              {navigationData.map((navItem) => (
                <NavigationMenuItem key={navItem.title}>
                  <NavigationMenuLink
                    href={navItem.href}
                    className="text-muted-foreground hover:text-primary bg-transparent! px-3 py-1.5 text-base! font-medium"
                  >
                    {navItem.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* theme Button */}
          <div className="hidden gap-4 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login Button */}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="rounded-full"
                      aria-label="Mở menu tài khoản"
                    />
                  }
                >
                  <UserAvatar
                    name={user.displayName}
                    type="sidebar"
                    avatarUrl={user.avatarUrl}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                      Tài khoản
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="lg"
                className="max-md:hidden"
                render={<a href="/signin" />}
                nativeButton={false}
              >
                Login
              </Button>
            )}
          </div>

          {/* Navigation for small screens */}
          <div className="flex gap-4 md:hidden">
            <Button
              size="lg"
              render={<a href="/signin" />}
              nativeButton={false}
            >
              Login
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon-lg" />}
              >
                <MenuIcon />
                <span className="sr-only">Menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {navigationData.map((item, index) => (
                  <DropdownMenuItem key={index}>
                    <a href={item.href}>{item.title}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <ProfileDialog open={profileOpen} setOpen={setProfileOpen} />
    </>
  );
};

export default Header;
