// import { useRef, useState, type ChangeEvent } from "react";
// import { ImagePlus, Loader2, Trash2, Video } from "lucide-react";
// import { toast } from "sonner";

// import { Button } from "@/components/ui/button";
// import { workshopService } from "@/services/workshopService";
// import type { WorkshopMedia } from "@/types/workshop";

// type Props = {
//   label: string;
//   accept: "image" | "video";
//   multiple?: boolean;
//   maxFiles?: number;
//   value: WorkshopMedia[];
//   onChange: (value: WorkshopMedia[]) => void;
// };

// const WorkshopMediaUploader = ({
//   label,
//   accept,
//   multiple = false,
//   maxFiles = 1,
//   value,
//   onChange,
// }: Props) => {
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [uploading, setUploading] = useState(false);

//   const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files ?? []);

//     if (!files.length) return;

//     if (value.length + files.length > maxFiles) {
//       toast.error(`Chỉ được tối đa ${maxFiles} file`);
//       event.target.value = "";
//       return;
//     }

//     try {
//       setUploading(true);

//       const uploaded = await workshopService.uploadMedia(files);

//       onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));

//       toast.success("Upload thành công");
//     } catch (error) {
//       console.error(error);
//       toast.error("Upload media thất bại");
//     } finally {
//       setUploading(false);
//       event.target.value = "";
//     }
//   };

//   return (
//     <div className="space-y-3">
//       <label className="label-style">{label}</label>

//       <input
//         ref={inputRef}
//         hidden
//         type="file"
//         multiple={multiple}
//         accept={
//           accept === "image"
//             ? "image/jpeg,image/png,image/webp,image/heic,image/heif"
//             : "video/mp4,video/webm,video/quicktime"
//         }
//         onChange={handleUpload}
//       />

//       <Button
//         type="button"
//         variant="outline"
//         disabled={uploading}
//         onClick={() => inputRef.current?.click()}
//       >
//         {uploading ? (
//           <Loader2 className="mr-2 size-4 animate-spin" />
//         ) : accept === "image" ? (
//           <ImagePlus className="mr-2 size-4" />
//         ) : (
//           <Video className="mr-2 size-4" />
//         )}

//         {uploading ? "Đang tải..." : label}
//       </Button>

//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//         {value.map((media) => (
//           <div
//             key={media.publicId}
//             className="group relative overflow-hidden rounded-2xl border"
//           >
//             {media.resourceType === "video" ? (
//               <video
//                 src={media.url}
//                 controls
//                 className="aspect-video w-full bg-black object-cover"
//               />
//             ) : (
//               <img
//                 src={media.url}
//                 alt=""
//                 className="aspect-square w-full object-cover"
//               />
//             )}

//             <button
//               type="button"
//               onClick={() =>
//                 onChange(
//                   value.filter((item) => item.publicId !== media.publicId),
//                 )
//               }
//               className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"
//             >
//               <Trash2 className="size-4" />
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default WorkshopMediaUploader;
