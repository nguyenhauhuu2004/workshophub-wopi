import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PlusCircle,
  Sparkles,
  Sun,
  TicketCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/stores/useAuthStore";
import ProfileDialog from "../ProfileDialog";
import { CATEGORIES } from "@/data";

export type NavigationSection = {
  title: string;
  href: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export const DEFAULT_NAVIGATION: NavigationSection[] = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Workshop",
    href: "/workshops",
  },
];

type HeaderProps = {
  navigationData?: NavigationSection[];
  className?: string;
};

const Header = ({
  navigationData = DEFAULT_NAVIGATION,
  className,
}: HeaderProps) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect scroll to apply floating glass style
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const isNavActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/70 bg-background/80 shadow-soft backdrop-blur-2xl py-2.5"
            : "border-b border-transparent bg-background/95 backdrop-blur-md py-3.5",
          className,
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="group flex items-center outline-none"
              aria-label="WoPi - Trang chủ"
            >
              <div className="h-12 relative flex items-center">
                <img
                  src="/logo.png"
                  alt="WoPi Logo"
                  className="w-32 object-cover"
                  onError={(e) => {
                    // Fallback to text logo if image fails
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Thanh điều hướng chính"
          >
            {[
              ...navigationData,
              ...(user?.role === "host"
                ? [
                    {
                      title: "Studio & Nghệ nhân",
                      href: "/host",
                    },
                    {
                      title: "Tạo workshop",
                      href: "/workshops/create",
                      badge: "Host",
                    },
                  ]
                : []),
            ].map((item) => {
              const active = isNavActive(item.href);
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "text-[hsl(25,100%,50%)] font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 rounded-full bg-accent/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[hsl(25,100%,50%)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(25,100%,50%)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Shortcut button */}

            {/* Theme Toggle Button */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    aria-label="Đổi giao diện"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                }
              />
              <DropdownMenuContent
                align="end"
                className="rounded-xl border-border/70 bg-popover/95 p-1 shadow-card backdrop-blur-xl"
              >
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Sun className="mr-2 size-3.5" /> Sáng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Moon className="mr-2 size-3.5" /> Tối
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Sparkles className="mr-2 size-3.5" /> Hệ thống
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logged in User Menu OR Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* My bookings quick icon */}
                <Link
                  to="/my-bookings"
                  className="hidden sm:inline-flex items-center justify-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Đơn đặt chỗ của tôi"
                >
                  <TicketCheck className="size-4" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="group relative flex items-center gap-2 rounded-full p-0.5 ring-2 ring-transparent transition-all hover:ring-[hsl(25,100%,50%)]/40 focus-visible:ring-[hsl(25,100%,50%)]"
                        aria-label="Menu người dùng"
                      >
                        <UserAvatar
                          name={user.displayName ?? user.username ?? "User"}
                          type="sidebar"
                          avatarUrl={user.avatarUrl}
                          className="size-8 text-xs border border-border"
                        />
                      </button>
                    }
                  />
                  <DropdownMenuContent
                    align="end"
                    className="w-64 rounded-2xl border-border/70 bg-popover/95 p-2 shadow-card backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 p-2.5">
                      <UserAvatar
                        name={user.displayName ?? user.username ?? "User"}
                        type="sidebar"
                        avatarUrl={user.avatarUrl}
                        className="size-10 text-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {user.displayName || user.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email || `@${user.username}`}
                        </p>
                        <span className="mt-1 inline-block rounded-md bg-[hsl(25,100%,50%)]/15 px-1.5 py-0.2 text-[10px] font-bold text-[hsl(25,100%,50%)] uppercase tracking-wider">
                          {user.role === "host"
                            ? "Nghệ nhân / Host"
                            : "Thành viên"}
                        </span>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => setProfileOpen(true)}
                        className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted"
                      >
                        <UserIcon className="mr-2 size-4 text-muted-foreground" />
                        Tài khoản & Hồ sơ
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/my-bookings")}
                        className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted"
                      >
                        <TicketCheck className="mr-2 size-4 text-muted-foreground" />
                        Vé & Lịch đã đặt
                      </DropdownMenuItem>

                      {user.role === "host" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => navigate("/host")}
                            className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted"
                          >
                            <LayoutDashboard className="mr-2 size-4 text-muted-foreground" />
                            Bảng điều khiển Host
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate("/workshops/create")}
                            className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted"
                          >
                            <PlusCircle className="mr-2 size-4 text-[hsl(25,100%,50%)]" />
                            Tạo workshop mới
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuItem
                        onClick={() => navigate("/chatapp")}
                        className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted"
                      >
                        <MessageSquare className="mr-2 size-4 text-muted-foreground" />
                        Tin nhắn trò chuyện
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 size-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/signin")}
                  className="rounded-full text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="rounded-full bg-[hsl(25,100%,50%)] px-4 text-xs font-bold text-white shadow-xs hover:bg-[hsl(25,100%,55%)] hover:shadow-glow"
                >
                  Đăng ký
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full md:hidden text-foreground hover:bg-muted"
              aria-label="Mở menu điều hướng di động"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-16 z-40 border-b border-border/80 bg-background/95 p-5 shadow-card backdrop-blur-2xl md:hidden"
          >
            <div className="space-y-4">
              {/* User overview if logged in */}
              {user && (
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-xs">
                  <UserAvatar
                    name={user.displayName ?? user.username ?? "User"}
                    type="sidebar"
                    avatarUrl={user.avatarUrl}
                    className="size-11 text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground">
                      {user.displayName || user.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email || `@${user.username}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="rounded-full text-xs"
                  >
                    Hồ sơ
                  </Button>
                </div>
              )}

              {/* Navigation items */}
              <nav className="flex flex-col gap-1">
                {navigationData.map((item) => {
                  const active = isNavActive(item.href);
                  return (
                    <Link
                      key={item.title}
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                        active
                          ? "bg-accent/10 text-[hsl(25,100%,50%)]"
                          : "text-foreground hover:bg-muted/60",
                      )}
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-[hsl(25,100%,50%)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(25,100%,50%)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {user && (
                  <Link
                    to="/my-bookings"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      location.pathname === "/my-bookings"
                        ? "bg-accent/10 text-[hsl(25,100%,50%)]"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <TicketCheck className="size-4 text-[hsl(25,100%,50%)]" />
                      Vé & Đơn đặt chỗ
                    </span>
                  </Link>
                )}
              </nav>

              {/* Quick Categories */}
              <div className="border-t border-border/60 pt-4">
                <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chủ đề thịnh hành
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {CATEGORIES.slice(0, 6).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/workshops?category=${encodeURIComponent(cat.name)}`,
                        )
                      }
                      className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-[hsl(25,100%,50%)]/40 hover:text-foreground"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Auth actions */}
              {user ? (
                <div className="border-t border-border/60 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/signin")}
                    className="rounded-xl text-xs font-bold"
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="rounded-xl bg-[hsl(25,100%,50%)] text-xs font-bold text-white hover:bg-[hsl(25,100%,55%)]"
                  >
                    Đăng ký ngay
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileDialog open={profileOpen} setOpen={setProfileOpen} />
    </>
  );
};

export default Header;
