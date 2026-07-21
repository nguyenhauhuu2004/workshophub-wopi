import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Trash2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

export type UploadedMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

type Props = {
  accept: "image" | "video";
  multiple?: boolean;
  value: UploadedMedia[];
  onChange: (media: UploadedMedia[]) => void;
};

const WorkshopMediaUploader = ({
  accept,
  multiple = false,
  value,
  onChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setUploading(true);

      const { data } = await api.post("/workshops/upload-media", formData);

      const uploaded = data.media as UploadedMedia[];

      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));
    } catch (error) {
      console.error("Upload media thất bại:", error);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeMedia = (publicId: string) => {
    onChange(value.filter((item) => item.publicId !== publicId));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple={multiple}
        accept={accept === "image" ? "image/*" : "video/*"}
        onChange={handleUpload}
      />

      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : accept === "image" ? (
          <ImagePlus className="mr-2 size-4" />
        ) : (
          <Video className="mr-2 size-4" />
        )}

        {uploading
          ? "Đang tải lên..."
          : accept === "image"
            ? "Chọn hình ảnh"
            : "Chọn video"}
      </Button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((media) => (
          <div
            key={media.publicId}
            className="group relative overflow-hidden rounded-xl border"
          >
            {media.resourceType === "video" ? (
              <video
                src={media.url}
                controls
                className="aspect-video w-full object-cover"
              />
            ) : (
              <img
                src={media.url}
                alt=""
                className="aspect-square w-full object-cover"
              />
            )}

            <button
              type="button"
              onClick={() => removeMedia(media.publicId)}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkshopMediaUploader;
