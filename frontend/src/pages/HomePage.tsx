// import { useEffect, useState, type FormEvent } from "react";
// import { useNavigate } from "react-router";
// import { Crown, Loader2, MapPin, Search } from "lucide-react";

// import HeroSection from "@/components/shadcn-studio/blocks/hero-section-01/hero-section-01";
// import Header, { type NavigationSection } from "@/components/layout/header";
// import Footer from "@/components/layout/footer";
// import WorkshopCard from "@/components/WorkshopCard";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Separator } from "@/components/ui/separator";

// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "@/components/ui/carousel";

// import { workshopService } from "@/services/workshopService";

// type WorkshopListItem = {
//   _id: string;
//   title: string;
//   category: string;
//   description: string;
//   price: number;
//   duration: string;
//   level: string;
//   sponsored?: boolean;

//   thumbnail?: {
//     url: string;
//     publicId: string;
//     resourceType: "image";
//   };

//   host?: {
//     displayName: string;
//     avatarUrl?: string;
//   };

//   location: {
//     address: string;
//     coordinates: {
//       type: "Point";
//       coordinates: [number, number];
//     };
//   };
// };

// const navigationData: NavigationSection[] = [
//   {
//     title: "Tìm workshop",
//     href: "/workshops",
//   },
//   // {
//   //   title: "Sản phẩm",
//   //   href: "#",
//   // },
//   // {
//   //   title: "Về chúng tôi",
//   //   href: "#",
//   // },
//   // {
//   //   title: "Liên hệ",
//   //   href: "#",
//   // },
//   {
//     title: "Tạo workshop",
//     href: "/workshops/create",
//   },
// ];

// const workshopTags = ["Làm Gốm", "Vẽ Tranh", "Làm Nến", "Cắm Hoa"];

// const HomePage = () => {
//   const navigate = useNavigate();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchDistrict, setSearchDistrict] = useState("");

//   const [sponsoredWorkshops, setSponsoredWorkshops] = useState<
//     WorkshopListItem[]
//   >([]);

//   const [latestWorkshops, setLatestWorkshops] = useState<WorkshopListItem[]>(
//     [],
//   );

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadHomeWorkshops = async () => {
//       try {
//         setLoading(true);

//         const [sponsoredData, latestData] = await Promise.all([
//           workshopService.getWorkshops({
//             sponsored: true,
//             limit: 6,
//           }),
//           workshopService.getWorkshops({
//             limit: 6,
//           }),
//         ]);

//         setSponsoredWorkshops(sponsoredData.workshops ?? []);

//         setLatestWorkshops(latestData.workshops ?? []);
//       } catch (error) {
//         console.error("Không thể tải workshop trang chủ:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     void loadHomeWorkshops();
//   }, []);

//   const handleSearch = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     const params = new URLSearchParams();

//     if (searchQuery.trim()) {
//       params.set("search", searchQuery.trim());
//     }

//     if (searchDistrict.trim()) {
//       params.set("address", searchDistrict.trim());
//     }

//     const query = params.toString();

//     navigate(query ? `/workshops?${query}` : "/workshops");
//   };

//   const handleTagClick = (tag: string) => {
//     navigate(`/workshops?category=${encodeURIComponent(tag)}`);
//   };

//   return (
//     <div className="min-h-screen w-full overflow-x-hidden">
//       <Header navigationData={navigationData} />

//       <main className="flex w-full flex-col">
//         <HeroSection />

//         <section
//           id="priority"
//           className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8"
//         >
//           <div className="mb-5 flex items-center gap-2">
//             <Crown className="size-5 shrink-0 text-primary" />

//             <h2 className="font-display text-xl font-bold sm:text-2xl">
//               Workshop được tài trợ
//             </h2>
//           </div>

//           {loading ? (
//             <div className="flex min-h-56 items-center justify-center">
//               <Loader2 className="size-8 animate-spin text-primary" />
//             </div>
//           ) : sponsoredWorkshops.length > 0 ? (
//             <Carousel
//               opts={{
//                 align: "start",
//                 loop: sponsoredWorkshops.length > 3,
//               }}
//               className="w-full"
//             >
//               <CarouselContent className="-ml-4">
//                 {sponsoredWorkshops.map((workshop) => (
//                   <CarouselItem
//                     key={workshop._id}
//                     className="basis-full pl-4 md:basis-1/2 lg:basis-1/3"
//                   >
//                     <WorkshopCard workshop={workshop} />
//                   </CarouselItem>
//                 ))}
//               </CarouselContent>

//               <CarouselPrevious className="hidden sm:flex" />
//               <CarouselNext className="hidden sm:flex" />
//             </Carousel>
//           ) : (
//             <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
//               Hiện chưa có workshop được tài trợ.
//             </p>
//           )}

//           <section className="mt-12">
//             <h2 className="font-display text-xl font-bold sm:text-2xl">
//               Khám phá tất cả workshop
//             </h2>

//             <form
//               onSubmit={handleSearch}
//               className="mt-5 flex w-full min-w-0 flex-col gap-3 rounded-xl bg-background/95 p-3 shadow-xl backdrop-blur md:flex-row md:items-center"
//             >
//               <div className="relative min-w-0 flex-1">
//                 <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                 <Input
//                   type="search"
//                   value={searchQuery}
//                   onChange={(event) => setSearchQuery(event.target.value)}
//                   placeholder="Bạn muốn học gì hôm nay?"
//                   className="w-full border-0 pl-9 shadow-none focus-visible:ring-0"
//                 />
//               </div>

//               <Separator
//                 orientation="vertical"
//                 className="hidden h-8 shrink-0 md:block"
//               />

//               <div className="relative min-w-0 md:w-56 md:shrink-0">
//                 <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                 <Input
//                   value={searchDistrict}
//                   onChange={(event) => setSearchDistrict(event.target.value)}
//                   placeholder="Quận / Huyện"
//                   className="w-full border-0 pl-9 shadow-none focus-visible:ring-0"
//                 />
//               </div>

//               <Button type="submit" size="lg" className="shrink-0">
//                 Tìm kiếm
//               </Button>
//             </form>

//             <div className="my-5 flex flex-wrap gap-2">
//               {workshopTags.map((tag) => (
//                 <button
//                   key={tag}
//                   type="button"
//                   onClick={() => handleTagClick(tag)}
//                   className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
//                 >
//                   {tag}
//                 </button>
//               ))}
//             </div>

//             {loading ? (
//               <div className="flex min-h-64 items-center justify-center">
//                 <Loader2 className="size-8 animate-spin text-primary" />
//               </div>
//             ) : latestWorkshops.length > 0 ? (
//               <>
//                 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
//                   {latestWorkshops.map((workshop) => (
//                     <WorkshopCard key={workshop._id} workshop={workshop} />
//                   ))}
//                 </div>

//                 <div className="mt-8 flex justify-center">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => navigate("/workshops")}
//                   >
//                     Xem tất cả workshop
//                   </Button>
//                 </div>
//               </>
//             ) : (
//               <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
//                 Chưa có workshop nào được đăng.
//               </p>
//             )}
//           </section>
//         </section>
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default HomePage;
