// import { useEffect, useMemo, useState, type ChangeEvent } from "react";
// import { useSearchParams } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
//   Search,
//   SlidersHorizontal,
//   X,
// } from "lucide-react";
// import { toast } from "sonner";

// import WorkshopCard from "@/components/WorkshopCard";
// import { workshopService } from "@/services/workshopService";
// import { CATEGORIES } from "@/data";

// import {
//   Combobox,
//   ComboboxContent,
//   ComboboxEmpty,
//   ComboboxInput,
//   ComboboxItem,
//   ComboboxList,
// } from "@/components/ui/combobox";

// type WorkshopMedia = {
//   url: string;
//   publicId: string;
//   resourceType: "image" | "video";
// };

// export type WorkshopListItem = {
//   _id: string;
//   title: string;
//   category: string;
//   description: string;

//   price: number;
//   duration: string;
//   seatsTotal?: number;

//   thumbnail?: WorkshopMedia;

//   host?: {
//     _id?: string;
//     username?: string;
//     displayName?: string;
//     avatarUrl?: string;
//   };

//   location: {
//     address: string;

//     coordinates: {
//       type: "Point";
//       coordinates: [number, number];
//     };
//   };

//   createdAt?: string;
//   updatedAt?: string;
// };

// type GetWorkshopsParams = {
//   search?: string;
//   category?: string;
//   maxPrice?: number;
//   address?: string;
//   page: number;
//   limit: number;
// };

// type GetWorkshopsResponse = {
//   workshops: WorkshopListItem[];
//   total: number;
//   page: number;
//   totalPages: number;
// };

// const ADDRESS_OPTIONS = [
//   "Quận 1, TP. Hồ Chí Minh",
//   "Quận 3, TP. Hồ Chí Minh",
//   "Quận 7, TP. Hồ Chí Minh",
//   "Quận Bình Thạnh, TP. Hồ Chí Minh",
//   "Thành phố Thủ Đức, TP. Hồ Chí Minh",
// ] as const;

// const MAX_PRICE = 2_000_000;
// const PAGE_SIZE = 8;

// /*
//  * Lưu các request đang chạy.
//  *
//  * React StrictMode có thể mount component hai lần trong development.
//  * Khi hai request có cùng query, request thứ hai sẽ dùng lại Promise
//  * của request đầu tiên thay vì gọi API thêm một lần.
//  */
// const inFlightRequests = new Map<string, Promise<GetWorkshopsResponse>>();

// const createRequestKey = (params: GetWorkshopsParams): string => {
//   return JSON.stringify({
//     search: params.search ?? "",
//     category: params.category ?? "",
//     maxPrice: params.maxPrice ?? "",
//     address: params.address ?? "",
//     page: params.page,
//     limit: params.limit,
//   });
// };

// const getWorkshopsOnce = (
//   params: GetWorkshopsParams,
// ): Promise<GetWorkshopsResponse> => {
//   const requestKey = createRequestKey(params);

//   const existingRequest = inFlightRequests.get(requestKey);

//   if (existingRequest) {
//     return existingRequest;
//   }

//   const request = workshopService
//     .getWorkshops(params)
//     .then((response) => response as GetWorkshopsResponse)
//     .finally(() => {
//       inFlightRequests.delete(requestKey);
//     });

//   inFlightRequests.set(requestKey, request);

//   return request;
// };

// const getInitialPage = (searchParams: URLSearchParams): number => {
//   const pageParam = searchParams.get("page");

//   if (!pageParam) {
//     return 1;
//   }

//   const parsedPage = Number(pageParam);

//   if (!Number.isInteger(parsedPage) || parsedPage < 1) {
//     return 1;
//   }

//   return parsedPage;
// };

// const getInitialPrice = (searchParams: URLSearchParams): number => {
//   /*
//    * Không viết:
//    *
//    * Number(searchParams.get("maxPrice"))
//    *
//    * vì Number(null) bằng 0, khiến lần đầu mở trang
//    * tự động lọc giá tối đa bằng 0.
//    */
//   const maxPriceParam = searchParams.get("maxPrice");

//   if (maxPriceParam === null || maxPriceParam === "") {
//     return MAX_PRICE;
//   }

//   const parsedPrice = Number(maxPriceParam);

//   if (
//     !Number.isFinite(parsedPrice) ||
//     parsedPrice < 0 ||
//     parsedPrice > MAX_PRICE
//   ) {
//     return MAX_PRICE;
//   }

//   return parsedPrice;
// };

// export function WorkshopsPage() {
//   const [searchParams, setSearchParams] = useSearchParams();

//   const [workshops, setWorkshops] = useState<WorkshopListItem[]>([]);

//   const [total, setTotal] = useState(0);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(true);

//   /*
//    * Chỉ đọc URL để tạo state ban đầu.
//    *
//    * Nếu truy cập:
//    * /workshops
//    *
//    * thì toàn bộ bộ lọc ở trạng thái mặc định.
//    *
//    * Nếu truy cập:
//    * /workshops?category=Làm%20gốm
//    *
//    * thì category mới được áp dụng.
//    */
//   const [search, setSearch] = useState(() => searchParams.get("search") ?? "");

//   const [category, setCategory] = useState(
//     () => searchParams.get("category") ?? "All",
//   );

//   const [priceMax, setPriceMax] = useState(() => getInitialPrice(searchParams));

//   const [address, setAddress] = useState(
//     () => searchParams.get("address") ?? "",
//   );

//   const [page, setPage] = useState(() => getInitialPage(searchParams));

//   const [showFilters, setShowFilters] = useState(false);

//   const categories = useMemo(
//     () => [
//       {
//         label: "Tất cả",
//         value: "All",
//       },

//       ...CATEGORIES.map((item) => ({
//         label: item.name,
//         value: item.name,
//       })),
//     ],
//     [],
//   );

//   /*
//    * Xác định người dùng hiện có bật bộ lọc hay không.
//    *
//    * Search cũng được tính là điều kiện tìm kiếm,
//    * nhưng không làm panel bộ lọc tự mở.
//    */
//   const hasActiveFilters =
//     category !== "All" || priceMax < MAX_PRICE || address.trim().length > 0;

//   /*
//    * Đồng bộ state lên URL.
//    *
//    * Tách khỏi effect tải dữ liệu để việc cập nhật URL
//    * không trực tiếp làm API bị gọi lặp.
//    */
//   useEffect(() => {
//     const nextParams = new URLSearchParams();

//     const normalizedSearch = search.trim();
//     const normalizedAddress = address.trim();

//     if (normalizedSearch) {
//       nextParams.set("search", normalizedSearch);
//     }

//     if (category !== "All") {
//       nextParams.set("category", category);
//     }

//     if (priceMax < MAX_PRICE) {
//       nextParams.set("maxPrice", String(priceMax));
//     }

//     if (normalizedAddress) {
//       nextParams.set("address", normalizedAddress);
//     }

//     if (page > 1) {
//       nextParams.set("page", String(page));
//     }

//     const currentQuery = searchParams.toString();
//     const nextQuery = nextParams.toString();

//     /*
//      * Không gọi setSearchParams khi URL không thay đổi.
//      */
//     if (currentQuery !== nextQuery) {
//       setSearchParams(nextParams, {
//         replace: true,
//       });
//     }
//   }, [
//     search,
//     category,
//     priceMax,
//     address,
//     page,
//     searchParams,
//     setSearchParams,
//   ]);

//   /*
//    * Tải danh sách workshop.
//    */
//   useEffect(() => {
//     let ignoreResult = false;

//     const timeoutId = window.setTimeout(async () => {
//       try {
//         setLoading(true);

//         const normalizedSearch = search.trim();
//         const normalizedAddress = address.trim();

//         const query: GetWorkshopsParams = {
//           search: normalizedSearch || undefined,

//           category: category === "All" ? undefined : category,

//           /*
//            * Khi thanh giá đang ở mức tối đa,
//            * không gửi maxPrice để tránh tạo bộ lọc không cần thiết.
//            */
//           maxPrice: priceMax < MAX_PRICE ? priceMax : undefined,

//           address: normalizedAddress || undefined,

//           page,
//           limit: PAGE_SIZE,
//         };

//         const data = await getWorkshopsOnce(query);

//         if (ignoreResult) {
//           return;
//         }

//         const receivedTotalPages = Math.max(data.totalPages ?? 1, 1);

//         /*
//          * Trường hợp URL chứa page lớn hơn tổng số trang.
//          */
//         if (page > receivedTotalPages) {
//           setPage(receivedTotalPages);
//           return;
//         }

//         setWorkshops(data.workshops ?? []);
//         setTotal(data.total ?? 0);
//         setTotalPages(receivedTotalPages);
//       } catch (error) {
//         if (ignoreResult) {
//           return;
//         }

//         console.error("Không thể tải workshop:", error);

//         setWorkshops([]);
//         setTotal(0);
//         setTotalPages(1);

//         toast.error("Không thể tải danh sách workshop");
//       } finally {
//         if (!ignoreResult) {
//           setLoading(false);
//         }
//       }
//     }, 400);

//     return () => {
//       ignoreResult = true;
//       window.clearTimeout(timeoutId);
//     };
//   }, [search, category, priceMax, address, page]);

//   const clearFilters = () => {
//     setSearch("");
//     setCategory("All");
//     setPriceMax(MAX_PRICE);
//     setAddress("");
//     setPage(1);
//     setShowFilters(false);
//   };

//   const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
//     setSearch(event.target.value);
//     setPage(1);
//   };

//   const handleCategoryChange = (value: string) => {
//     setCategory(value);
//     setPage(1);
//   };

//   const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
//     setPriceMax(Number(event.target.value));
//     setPage(1);
//   };

//   const handleAddressChange = (value: string | null) => {
//     setAddress(value ?? "");
//     setPage(1);
//   };

//   const goToPreviousPage = () => {
//     setPage((currentPage) => Math.max(currentPage - 1, 1));

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   const goToNextPage = () => {
//     setPage((currentPage) => Math.min(currentPage + 1, totalPages));

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   return (
//     <main className="min-h-screen bg-[#FAFAF7] pt-16">
//       <section className="relative overflow-hidden bg-[#0D0D1A] px-4 py-16 sm:px-6">
//         <div className="absolute inset-0">
//           <div className="absolute right-0 top-0 size-96 rounded-full bg-violet-900/30 blur-3xl" />

//           <div className="absolute bottom-0 left-0 size-64 rounded-full bg-fuchsia-900/20 blur-3xl" />
//         </div>

//         <div className="relative z-10 mx-auto max-w-4xl text-center">
//           <motion.h1
//             initial={{
//               opacity: 0,
//               y: 20,
//             }}
//             animate={{
//               opacity: 1,
//               y: 0,
//             }}
//             className="mb-4 text-4xl font-black text-white md:text-6xl"
//           >
//             Khám phá <span className="text-[#7C3AED]">workshop</span>
//           </motion.h1>

//           <motion.p
//             initial={{
//               opacity: 0,
//               y: 15,
//             }}
//             animate={{
//               opacity: 1,
//               y: 0,
//             }}
//             transition={{
//               delay: 0.1,
//             }}
//             className="mb-8 text-lg text-gray-400"
//           >
//             Tìm kiếm những trải nghiệm sáng tạo phù hợp với bạn.
//           </motion.p>

//           <motion.div
//             initial={{
//               opacity: 0,
//               y: 15,
//             }}
//             animate={{
//               opacity: 1,
//               y: 0,
//             }}
//             transition={{
//               delay: 0.2,
//             }}
//             className="relative mx-auto max-w-2xl"
//           >
//             <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-gray-400" />

//             <input
//               value={search}
//               onChange={handleSearchChange}
//               placeholder="Tìm theo tên hoặc mô tả workshop..."
//               className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 pl-12 pr-12 text-white outline-none backdrop-blur-md transition-colors placeholder:text-gray-500 focus:border-violet-500"
//             />

//             {search && (
//               <button
//                 type="button"
//                 aria-label="Xóa từ khóa tìm kiếm"
//                 onClick={() => {
//                   setSearch("");
//                   setPage(1);
//                 }}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
//               >
//                 <X className="size-5" />
//               </button>
//             )}
//           </motion.div>
//         </div>
//       </section>

//       <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
//         <div className="mb-6 flex flex-wrap items-center gap-3">
//           <button
//             type="button"
//             onClick={() => setShowFilters((current) => !current)}
//             className={
//               showFilters || hasActiveFilters
//                 ? "flex items-center gap-2 rounded-2xl border border-violet-500 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition-colors"
//                 : "flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-violet-400 hover:text-violet-600"
//             }
//           >
//             <SlidersHorizontal className="size-4" />
//             Bộ lọc
//             {hasActiveFilters && (
//               <span className="size-2 rounded-full bg-violet-600" />
//             )}
//           </button>

//           {categories.map((item) => (
//             <motion.button
//               key={item.value}
//               type="button"
//               onClick={() => handleCategoryChange(item.value)}
//               whileHover={{
//                 scale: 1.03,
//               }}
//               whileTap={{
//                 scale: 0.97,
//               }}
//               className={
//                 category === item.value
//                   ? "rounded-full bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200"
//                   : "rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-violet-300"
//               }
//             >
//               {item.label}
//             </motion.button>
//           ))}
//         </div>

//         <AnimatePresence initial={false}>
//           {showFilters && (
//             <motion.div
//               initial={{
//                 opacity: 0,
//                 height: 0,
//               }}
//               animate={{
//                 opacity: 1,
//                 height: "auto",
//               }}
//               exit={{
//                 opacity: 0,
//                 height: 0,
//               }}
//               className="mb-8 overflow-visible"
//             >
//               <div className="grid grid-cols-1 gap-6 rounded-3xl border border-gray-100 bg-white p-6 md:grid-cols-2 lg:grid-cols-3">
//                 <div>
//                   <label
//                     htmlFor="maximum-price"
//                     className="mb-3 block text-xs font-bold uppercase tracking-widest text-gray-500"
//                   >
//                     Giá tối đa: {priceMax.toLocaleString("vi-VN")}đ
//                   </label>

//                   <input
//                     id="maximum-price"
//                     type="range"
//                     min={0}
//                     max={MAX_PRICE}
//                     step={50_000}
//                     value={priceMax}
//                     onChange={handlePriceChange}
//                     className="w-full accent-violet-600"
//                   />

//                   <div className="mt-1 flex justify-between text-xs text-gray-400">
//                     <span>0đ</span>
//                     <span>2.000.000đ</span>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-gray-500">
//                     Địa chỉ
//                   </label>

//                   <Combobox
//                     items={ADDRESS_OPTIONS}
//                     value={address || null}
//                     onValueChange={handleAddressChange}
//                   >
//                     <ComboboxInput placeholder="Chọn khu vực" />

//                     <ComboboxContent>
//                       <ComboboxEmpty>Không tìm thấy khu vực.</ComboboxEmpty>

//                       <ComboboxList>
//                         {(item) => (
//                           <ComboboxItem key={item} value={item}>
//                             {item}
//                           </ComboboxItem>
//                         )}
//                       </ComboboxList>
//                     </ComboboxContent>
//                   </Combobox>
//                 </div>

//                 <div className="flex items-end">
//                   <button
//                     type="button"
//                     onClick={clearFilters}
//                     disabled={!hasActiveFilters && !search}
//                     className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     <X className="size-4" />
//                     Xóa tất cả bộ lọc
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
//           <p className="text-sm text-gray-400">
//             Tìm thấy{" "}
//             <span className="font-semibold text-[#0D0D1A]">{total}</span>{" "}
//             workshop
//             {category !== "All" && (
//               <span className="ml-1">
//                 trong danh mục{" "}
//                 <span className="font-semibold text-[#7C3AED]">{category}</span>
//               </span>
//             )}
//           </p>

//           {totalPages > 1 && (
//             <p className="text-sm text-gray-400">
//               Trang <span className="font-semibold text-[#0D0D1A]">{page}</span>
//               /{totalPages}
//             </p>
//           )}
//         </div>

//         {loading ? (
//           <div className="flex min-h-80 items-center justify-center">
//             <Loader2 className="size-8 animate-spin text-violet-600" />
//           </div>
//         ) : workshops.length === 0 ? (
//           <div className="py-20 text-center">
//             <p className="mb-4 text-5xl">🔍</p>

//             <h3 className="mb-2 text-xl font-bold text-[#0D0D1A]">
//               Không tìm thấy workshop
//             </h3>

//             <p className="mb-6 text-gray-400">
//               Hãy thử thay đổi từ khóa hoặc bộ lọc.
//             </p>

//             {(hasActiveFilters || search) && (
//               <button
//                 type="button"
//                 onClick={clearFilters}
//                 className="rounded-full bg-[#7C3AED] px-6 py-3 font-semibold text-white"
//               >
//                 Xóa bộ lọc
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {workshops.map((workshop, index) => (
//                 <motion.div
//                   key={workshop._id}
//                   initial={{
//                     opacity: 0,
//                     y: 30,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     y: 0,
//                   }}
//                   transition={{
//                     duration: 0.4,
//                     delay: Math.min(index * 0.05, 0.3),
//                   }}
//                 >
//                   <WorkshopCard workshop={workshop} />
//                 </motion.div>
//               ))}
//             </div>

//             {totalPages > 1 && (
//               <div className="mt-12 flex items-center justify-center gap-4">
//                 <button
//                   type="button"
//                   onClick={goToPreviousPage}
//                   disabled={page <= 1 || loading}
//                   className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-violet-400 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
//                 >
//                   <ChevronLeft className="size-4" />
//                   Trang trước
//                 </button>

//                 <span className="text-sm font-medium text-gray-500">
//                   {page} / {totalPages}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={goToNextPage}
//                   disabled={page >= totalPages || loading}
//                   className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-violet-400 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
//                 >
//                   Trang sau
//                   <ChevronRight className="size-4" />
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </main>
//   );
// }
