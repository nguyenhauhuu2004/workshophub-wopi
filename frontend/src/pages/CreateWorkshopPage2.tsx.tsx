import {
  useEffect,
  useMemo,
  useRef,
  useState,
  //   type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileVideo2,
  ImagePlus,
  Images,
  Info,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/data";
import { workshopService } from "@/services/workshopService";

export type WorkshopLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId?: string;
  notes: string;
};

type WorkshopLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

type ScheduleFormItem = {
  id: string;
  date: string;
  time: string;
  spotsLeft: number;
};

type LocalMedia = {
  id: string;
  file: File;
  previewUrl: string;
};

type WorkshopFormState = {
  title: string;
  category: string;
  description: string;
  highlights: string[];
  includes: string[];
  price: string;
  duration: string;
  seats: string;
  level: WorkshopLevel;
  thumbnail: LocalMedia | null;
  gallery: LocalMedia[];
  video: LocalMedia | null;
  schedules: ScheduleFormItem[];
  location: WorkshopLocation;
};

type Step = 0 | 1 | 2 | 3 | 4;

type StepDefinition = {
  title: string;
  shortTitle: string;
  description: string;
  icon: ReactNode;
};

type CreateWorkshopResponse = {
  _id?: string;
  workshop?: {
    _id?: string;
  };
};

const STEPS: StepDefinition[] = [
  {
    title: "Thông tin cơ bản",
    shortTitle: "Cơ bản",
    description: "Tên, danh mục, mô tả và hình ảnh workshop.",
    icon: <Info className="size-4" />,
  },
  {
    title: "Nội dung & học phí",
    shortTitle: "Nội dung",
    description: "Quyền lợi, thời lượng, số chỗ và mức độ.",
    icon: <BookOpen className="size-4" />,
  },
  {
    title: "Lịch tổ chức",
    shortTitle: "Lịch",
    description: "Thiết lập ngày, giờ và số chỗ còn lại.",
    icon: <CalendarDays className="size-4" />,
  },
  {
    title: "Địa điểm",
    shortTitle: "Địa điểm",
    description: "Chọn vị trí chính xác trên bản đồ.",
    icon: <MapPin className="size-4" />,
  },
  {
    title: "Kiểm tra & đăng",
    shortTitle: "Xem trước",
    description: "Kiểm tra toàn bộ thông tin trước khi đăng.",
    icon: <Eye className="size-4" />,
  },
];

const LEVEL_OPTIONS: Array<{
  label: string;
  value: WorkshopLevel;
  description: string;
}> = [
  {
    label: "Người mới",
    value: "Beginner",
    description: "Không cần kinh nghiệm trước đó.",
  },
  {
    label: "Trung cấp",
    value: "Intermediate",
    description: "Đã có kiến thức hoặc trải nghiệm cơ bản.",
  },
  {
    label: "Nâng cao",
    value: "Advanced",
    description: "Dành cho người đã có nền tảng tốt.",
  },
  {
    label: "Mọi cấp độ",
    value: "All Levels",
    description: "Nội dung phù hợp với nhiều trình độ.",
  },
];

const MAX_GALLERY_FILES = 8;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createSchedule = (spotsLeft = 0): ScheduleFormItem => ({
  id: createId(),
  date: "",
  time: "10:00",
  spotsLeft,
});

const createLocalMedia = (file: File): LocalMedia => ({
  id: createId(),
  file,
  previewUrl: URL.createObjectURL(file),
});

const getTodayInputValue = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatPrice = (value: string) => {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "Chưa thiết lập";
  }

  return `${price.toLocaleString("vi-VN")}đ / người`;
};

const getFileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const initialFormState: WorkshopFormState = {
  title: "",
  category: CATEGORIES[0]?.name ?? "Khác",
  description: "",
  highlights: [""],
  includes: [""],
  price: "",
  duration: "",
  seats: "",
  level: "Beginner",
  thumbnail: null,
  gallery: [],
  video: null,
  schedules: [createSchedule()],
  location: {
    address: "",
    latitude: null,
    longitude: null,
    placeId: "",
    notes: "",
  },
};

export function CreateWorkshopPage() {
  //   const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);
  const [highestVisitedStep, setHighestVisitedStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [createdWorkshopId, setCreatedWorkshopId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<WorkshopFormState>(initialFormState);

  const mediaSnapshotRef = useRef({
    thumbnail: form.thumbnail,
    gallery: form.gallery,
    video: form.video,
  });

  mediaSnapshotRef.current = {
    thumbnail: form.thumbnail,
    gallery: form.gallery,
    video: form.video,
  };

  useEffect(() => {
    return () => {
      const media = mediaSnapshotRef.current;

      if (media.thumbnail) {
        URL.revokeObjectURL(media.thumbnail.previewUrl);
      }

      media.gallery.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });

      if (media.video) {
        URL.revokeObjectURL(media.video.previewUrl);
      }
    };
  }, []);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const completedFields = useMemo(() => {
    const checks = [
      Boolean(form.title.trim()),
      Boolean(form.description.trim()),
      Boolean(form.thumbnail),
      Number(form.price) >= 0 && form.price !== "",
      Boolean(form.duration.trim()),
      Number(form.seats) >= 1,
      form.schedules.some((item) => item.date && item.time),
      Boolean(form.location.address),
      form.location.latitude !== null,
      form.location.longitude !== null,
    ];

    return checks.filter(Boolean).length;
  }, [form]);

  const setField = <K extends keyof WorkshopFormState>(
    key: K,
    value: WorkshopFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateListItem = (
    field: "highlights" | "includes",
    index: number,
    value: string,
  ) => {
    setForm((current) => {
      const nextItems = [...current[field]];
      nextItems[index] = value;

      return {
        ...current,
        [field]: nextItems,
      };
    });
  };

  const addListItem = (field: "highlights" | "includes") => {
    setForm((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));
  };

  const removeListItem = (field: "highlights" | "includes", index: number) => {
    setForm((current) => {
      const nextItems = current[field].filter(
        (_, currentIndex) => currentIndex !== index,
      );

      return {
        ...current,
        [field]: nextItems.length ? nextItems : [""],
      };
    });
  };

  const updateSchedule = <K extends keyof ScheduleFormItem>(
    scheduleId: string,
    key: K,
    value: ScheduleFormItem[K],
  ) => {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule) =>
        schedule.id === scheduleId
          ? {
              ...schedule,
              [key]: value,
            }
          : schedule,
      ),
    }));
  };

  const addSchedule = () => {
    setForm((current) => ({
      ...current,
      schedules: [
        ...current.schedules,
        createSchedule(Number(current.seats) || 0),
      ],
    }));
  };

  const removeSchedule = (scheduleId: string) => {
    setForm((current) => {
      const schedules = current.schedules.filter(
        (schedule) => schedule.id !== scheduleId,
      );

      return {
        ...current,
        schedules: schedules.length
          ? schedules
          : [createSchedule(Number(current.seats) || 0)],
      };
    });
  };

  const setThumbnailFile = (file: File | null) => {
    setForm((current) => {
      if (current.thumbnail) {
        URL.revokeObjectURL(current.thumbnail.previewUrl);
      }

      return {
        ...current,
        thumbnail: file ? createLocalMedia(file) : null,
      };
    });
  };

  const setVideoFile = (file: File | null) => {
    setForm((current) => {
      if (current.video) {
        URL.revokeObjectURL(current.video.previewUrl);
      }

      return {
        ...current,
        video: file ? createLocalMedia(file) : null,
      };
    });
  };

  const addGalleryFiles = (files: File[]) => {
    setForm((current) => {
      const existingKeys = new Set(
        current.gallery.map((item) => getFileKey(item.file)),
      );

      const availableSlots = MAX_GALLERY_FILES - current.gallery.length;

      const acceptedFiles = files
        .filter((file) => file.type.startsWith("image/"))
        .filter((file) => !existingKeys.has(getFileKey(file)))
        .slice(0, availableSlots);

      if (acceptedFiles.length < files.length && availableSlots > 0) {
        toast.info("Một số ảnh bị bỏ qua do trùng lặp hoặc sai định dạng");
      }

      if (availableSlots <= 0) {
        toast.error(`Chỉ được chọn tối đa ${MAX_GALLERY_FILES} ảnh`);
        return current;
      }

      return {
        ...current,
        gallery: [...current.gallery, ...acceptedFiles.map(createLocalMedia)],
      };
    });
  };

  const removeGalleryFile = (mediaId: string) => {
    setForm((current) => {
      const removedItem = current.gallery.find((item) => item.id === mediaId);

      if (removedItem) {
        URL.revokeObjectURL(removedItem.previewUrl);
      }

      return {
        ...current,
        gallery: current.gallery.filter((item) => item.id !== mediaId),
      };
    });
  };

  const validateStep = (stepToValidate: Step, showToast = true) => {
    const fail = (message: string) => {
      if (showToast) {
        toast.error(message);
      }

      return false;
    };

    if (stepToValidate === 0) {
      if (form.title.trim().length < 5) {
        return fail("Tên workshop phải có ít nhất 5 ký tự");
      }

      if (!form.category) {
        return fail("Vui lòng chọn danh mục workshop");
      }

      if (form.description.trim().length < 30) {
        return fail("Mô tả workshop phải có ít nhất 30 ký tự");
      }

      if (!form.thumbnail) {
        return fail("Vui lòng chọn ảnh đại diện workshop");
      }
    }

    if (stepToValidate === 1) {
      const price = Number(form.price);
      const seats = Number(form.seats);

      if (!Number.isFinite(price) || price < 0) {
        return fail("Học phí workshop không hợp lệ");
      }

      if (!form.duration.trim()) {
        return fail("Vui lòng nhập thời lượng workshop");
      }

      if (!Number.isInteger(seats) || seats < 1) {
        return fail("Số lượng học viên phải là số nguyên lớn hơn 0");
      }
    }

    if (stepToValidate === 2) {
      const validSchedules = form.schedules.filter(
        (schedule) => schedule.date && schedule.time,
      );

      if (!validSchedules.length) {
        return fail("Vui lòng thêm ít nhất một lịch tổ chức");
      }

      if (
        validSchedules.some(
          (schedule) =>
            !Number.isInteger(Number(schedule.spotsLeft)) ||
            Number(schedule.spotsLeft) < 1,
        )
      ) {
        return fail("Số chỗ của mỗi lịch phải lớn hơn 0");
      }
    }

    if (stepToValidate === 3) {
      if (
        !form.location.address.trim() ||
        form.location.latitude === null ||
        form.location.longitude === null
      ) {
        return fail("Vui lòng chọn địa điểm chính xác trên bản đồ");
      }
    }

    return true;
  };

  const validateAllSteps = () => {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const currentStep = index as Step;

      if (!validateStep(currentStep, true)) {
        setStep(currentStep);
        return false;
      }
    }

    return true;
  };

  const goToNextStep = () => {
    if (!validateStep(step)) {
      return;
    }

    const nextStep = Math.min(step + 1, STEPS.length - 1) as Step;

    setStep(nextStep);
    setHighestVisitedStep((current) => Math.max(current, nextStep) as Step);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToPreviousStep = () => {
    setStep((current) => Math.max(current - 1, 0) as Step);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToStep = (targetStep: Step) => {
    if (targetStep <= highestVisitedStep) {
      setStep(targetStep);
    }
  };

  const handlePublish = async () => {
    if (saving || !validateAllSteps() || !form.thumbnail) {
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();

      payload.append("title", form.title.trim());
      payload.append("category", form.category);
      payload.append("description", form.description.trim());
      payload.append("price", String(Number(form.price)));
      payload.append("duration", form.duration.trim());
      payload.append("seatsTotal", String(Number(form.seats)));
      payload.append("level", form.level);
      payload.append("status", "published");

      payload.append(
        "highlights",
        JSON.stringify(
          form.highlights.map((item) => item.trim()).filter(Boolean),
        ),
      );

      payload.append(
        "includes",
        JSON.stringify(
          form.includes.map((item) => item.trim()).filter(Boolean),
        ),
      );

      payload.append(
        "schedules",
        JSON.stringify(
          form.schedules
            .filter((schedule) => schedule.date && schedule.time)
            .map(({ id: _id, ...schedule }) => ({
              ...schedule,
              spotsLeft: Number(schedule.spotsLeft) || Number(form.seats),
            })),
        ),
      );

      payload.append(
        "location",
        JSON.stringify({
          address: form.location.address.trim(),
          placeId: form.location.placeId ?? "",
          notes: form.location.notes.trim(),
          coordinates: {
            type: "Point",
            coordinates: [form.location.longitude, form.location.latitude],
          },
        }),
      );

      payload.append("thumbnail", form.thumbnail.file);

      form.gallery.forEach((item) => {
        payload.append("gallery", item.file);
      });

      if (form.video) {
        payload.append("video", form.video.file);
      }

      const result = (await workshopService.createWorkshop(
        payload,
      )) as CreateWorkshopResponse;

      const newWorkshopId = result.workshop?._id ?? result._id ?? null;

      setCreatedWorkshopId(newWorkshopId);
      toast.success("Đăng workshop thành công");
    } catch (error) {
      console.error("Create workshop error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Không thể tạo workshop. Vui lòng thử lại.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (createdWorkshopId !== null) {
    return (
      <SuccessState
        workshopId={createdWorkshopId}
        onCreateAnother={() => {
          setCreatedWorkshopId(null);
          setForm(initialFormState);
          setStep(0);
          setHighestVisitedStep(0);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] pt-16 text-[#183c2b]">
      <section className="border-b border-[#e4e9e2] bg-[#fffefa]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/host"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#65756b] transition hover:text-[#214c36]"
          >
            <ArrowLeft className="size-4" />
            Quay lại trang quản lý
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#edf4e9] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#315d43]">
                <Sparkles className="size-3.5" />
                Không gian dành cho người tổ chức
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#173d2b] sm:text-4xl">
                Tạo workshop mới
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078] sm:text-base">
                Hoàn thiện từng bước. Hình ảnh và video chỉ được tải lên khi bạn
                bấm nút đăng workshop ở bước cuối.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e0e7de] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-8 text-sm">
                <span className="font-medium text-[#68776e]">
                  Mức độ hoàn thiện
                </span>
                <span className="font-bold text-[#214c36]">
                  {completedFields}/10
                </span>
              </div>

              <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-[#edf0eb]">
                <motion.div
                  className="h-full rounded-full bg-[#2f6b49]"
                  animate={{ width: `${completedFields * 10}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-[#e2e8e0] bg-white p-5 shadow-[0_12px_35px_rgba(31,67,45,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#849087]">
                  Tiến độ
                </p>
                <p className="mt-1 text-sm font-semibold text-[#284936]">
                  Bước {step + 1} trên {STEPS.length}
                </p>
              </div>

              <span className="rounded-full bg-[#edf4e9] px-3 py-1 text-sm font-bold text-[#315d43]">
                {progress}%
              </span>
            </div>

            <div className="space-y-2">
              {STEPS.map((item, index) => {
                const currentStep = index as Step;
                const isCurrent = step === currentStep;
                const isCompleted = step > currentStep;
                const canVisit = currentStep <= highestVisitedStep;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => goToStep(currentStep)}
                    disabled={!canVisit}
                    className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                      isCurrent
                        ? "bg-[#edf4e9]"
                        : canVisit
                          ? "hover:bg-[#f6f8f4]"
                          : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition ${
                        isCompleted
                          ? "border-[#2f6b49] bg-[#2f6b49] text-white"
                          : isCurrent
                            ? "border-[#315d43] bg-white text-[#315d43]"
                            : "border-[#dce3da] bg-[#f8faf7] text-[#87938a]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-4" strokeWidth={3} />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-bold ${
                          isCurrent ? "text-[#214c36]" : "text-[#526359]"
                        }`}
                      >
                        {item.title}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#89948d]">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-[#173f2d] p-4 text-white">
              <p className="text-sm font-bold">Lưu ý khi đăng</p>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Kiểm tra kỹ học phí, lịch tổ chức và địa điểm. Media chỉ tải lên
                một lần ở bước cuối.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <MobileStepper
            step={step}
            highestVisitedStep={highestVisitedStep}
            onStepChange={goToStep}
          />

          <form
            onSubmit={(event) => event.preventDefault()}
            className="overflow-hidden rounded-3xl border border-[#e1e7df] bg-white shadow-[0_18px_50px_rgba(30,65,43,0.07)]"
          >
            <div className="border-b border-[#edf0eb] px-5 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4e9] text-[#315d43]">
                  {STEPS[step].icon}
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a968e]">
                    Bước {step + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#183c2b] sm:text-2xl">
                    {STEPS[step].title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#758179]">
                    {STEPS[step].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 0 && (
                    <BasicInformationStep
                      form={form}
                      setField={setField}
                      updateListItem={updateListItem}
                      addListItem={addListItem}
                      removeListItem={removeListItem}
                      setThumbnailFile={setThumbnailFile}
                      setVideoFile={setVideoFile}
                      addGalleryFiles={addGalleryFiles}
                      removeGalleryFile={removeGalleryFile}
                    />
                  )}

                  {step === 1 && (
                    <WorkshopDetailsStep
                      form={form}
                      setField={setField}
                      updateListItem={updateListItem}
                      addListItem={addListItem}
                      removeListItem={removeListItem}
                    />
                  )}

                  {step === 2 && (
                    <ScheduleStep
                      schedules={form.schedules}
                      seats={form.seats}
                      updateSchedule={updateSchedule}
                      addSchedule={addSchedule}
                      removeSchedule={removeSchedule}
                    />
                  )}

                  {step === 3 && (
                    <LocationStep
                      location={form.location}
                      onChange={(location) => setField("location", location)}
                    />
                  )}

                  {step === 4 && <PreviewStep form={form} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[#edf0eb] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={step === 0 || saving}
                className="rounded-xl border-[#dce3da]"
              >
                <ArrowLeft className="mr-2 size-4" />
                Quay lại
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-xl bg-[#214c36] px-6 text-white hover:bg-[#183c2b]"
                >
                  Tiếp tục
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="min-w-40 rounded-xl bg-[#214c36] px-6 text-white hover:bg-[#183c2b]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 size-4" />
                      Đăng workshop
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

type BasicInformationStepProps = {
  form: WorkshopFormState;
  setField: <K extends keyof WorkshopFormState>(
    key: K,
    value: WorkshopFormState[K],
  ) => void;
  updateListItem: (
    field: "highlights" | "includes",
    index: number,
    value: string,
  ) => void;
  addListItem: (field: "highlights" | "includes") => void;
  removeListItem: (field: "highlights" | "includes", index: number) => void;
  setThumbnailFile: (file: File | null) => void;
  setVideoFile: (file: File | null) => void;
  addGalleryFiles: (files: File[]) => void;
  removeGalleryFile: (mediaId: string) => void;
};

function BasicInformationStep({
  form,
  setField,
  updateListItem,
  addListItem,
  removeListItem,
  setThumbnailFile,
  setVideoFile,
  addGalleryFiles,
  removeGalleryFile,
}: BasicInformationStepProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          label="Tên workshop"
          description="Tên rõ ràng, dễ hiểu và thể hiện đúng nội dung."
          required
          className="md:col-span-2"
        >
          <Input
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Ví dụ: Làm gốm thủ công dành cho người mới"
            maxLength={120}
            className="h-12 rounded-xl border-[#dfe5dd]"
          />

          <CharacterCount current={form.title.length} maximum={120} />
        </FormField>

        <FormField
          label="Danh mục"
          description="Chọn danh mục phù hợp nhất với workshop."
          required
          className="md:col-span-2"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((category) => {
              const selected = form.category === category.name;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setField("category", category.name)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-[#315d43] bg-[#edf4e9] text-[#214c36] shadow-sm"
                      : "border-[#e1e6df] bg-white text-[#65756b] hover:border-[#aebcaf] hover:bg-[#f8faf7]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{category.name}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField
          label="Mô tả workshop"
          description="Nêu trải nghiệm, nội dung chính và đối tượng phù hợp."
          required
          className="md:col-span-2"
        >
          <textarea
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Mô tả những gì người tham gia sẽ được học, thực hành và mang về..."
            rows={6}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-[#dfe5dd] bg-white px-4 py-3 text-sm leading-6 text-[#203d2d] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#315d43] focus:ring-4 focus:ring-[#315d43]/10"
          />

          <CharacterCount current={form.description.length} maximum={2000} />
        </FormField>
      </div>

      <section className="rounded-2xl border border-[#e3e8e1] bg-[#fafbf8] p-5">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e9] text-[#315d43]">
            <Images className="size-5" />
          </span>

          <div>
            <h3 className="font-bold text-[#244331]">Hình ảnh và video</h3>
            <p className="mt-1 text-sm leading-6 text-[#7b877f]">
              File chỉ được giữ tạm trong trình duyệt và tải lên một lần khi bấm
              “Đăng workshop”.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <SingleMediaPicker
            label="Ảnh đại diện"
            description="Ảnh ngang tỷ lệ 16:9, rõ nét và thể hiện đúng workshop."
            accept="image/*"
            media={form.thumbnail}
            onChange={setThumbnailFile}
            icon={<ImagePlus className="size-6" />}
            required
          />

          <GalleryPicker
            items={form.gallery}
            onAdd={addGalleryFiles}
            onRemove={removeGalleryFile}
          />

          <SingleMediaPicker
            label="Video giới thiệu"
            description="Không bắt buộc. Nên dùng video ngắn, dung lượng phù hợp."
            accept="video/*"
            media={form.video}
            onChange={setVideoFile}
            icon={<FileVideo2 className="size-6" />}
          />
        </div>
      </section>

      <DynamicTextList
        title="Điểm nổi bật"
        description="Những giá trị hoặc trải nghiệm đáng chú ý của workshop."
        items={form.highlights}
        placeholder="Ví dụ: Tự tay hoàn thiện một sản phẩm mang về"
        onChange={(index, value) => updateListItem("highlights", index, value)}
        onAdd={() => addListItem("highlights")}
        onRemove={(index) => removeListItem("highlights", index)}
      />
    </div>
  );
}

type WorkshopDetailsStepProps = {
  form: WorkshopFormState;
  setField: <K extends keyof WorkshopFormState>(
    key: K,
    value: WorkshopFormState[K],
  ) => void;
  updateListItem: (
    field: "highlights" | "includes",
    index: number,
    value: string,
  ) => void;
  addListItem: (field: "highlights" | "includes") => void;
  removeListItem: (field: "highlights" | "includes", index: number) => void;
};

function WorkshopDetailsStep({
  form,
  setField,
  updateListItem,
  addListItem,
  removeListItem,
}: WorkshopDetailsStepProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-3">
        <FormField
          label="Học phí mỗi người"
          description="Nhập 0 nếu workshop miễn phí."
          required
        >
          <div className="relative">
            <Banknote className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#849087]" />
            <Input
              type="number"
              min={0}
              step={10_000}
              value={form.price}
              onChange={(event) => setField("price", event.target.value)}
              placeholder="450000"
              className="h-12 rounded-xl border-[#dfe5dd] pl-10 pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#708078]">
              VNĐ
            </span>
          </div>
        </FormField>

        <FormField
          label="Thời lượng"
          description="Ví dụ: 2 giờ 30 phút."
          required
        >
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#849087]" />
            <Input
              value={form.duration}
              onChange={(event) => setField("duration", event.target.value)}
              placeholder="2 giờ"
              className="h-12 rounded-xl border-[#dfe5dd] pl-10"
            />
          </div>
        </FormField>

        <FormField
          label="Số học viên tối đa"
          description="Tổng số chỗ của workshop."
          required
        >
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#849087]" />
            <Input
              type="number"
              min={1}
              value={form.seats}
              onChange={(event) => setField("seats", event.target.value)}
              placeholder="12"
              className="h-12 rounded-xl border-[#dfe5dd] pl-10"
            />
          </div>
        </FormField>
      </div>

      <FormField
        label="Mức độ phù hợp"
        description="Giúp người tham gia chọn workshop phù hợp với kinh nghiệm."
        required
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVEL_OPTIONS.map((option) => {
            const selected = form.level === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setField("level", option.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-[#315d43] bg-[#edf4e9] shadow-sm"
                    : "border-[#e1e6df] hover:border-[#aebcaf] hover:bg-[#f8faf7]"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[#294936]">
                    {option.label}
                  </span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      selected
                        ? "border-[#315d43] bg-[#315d43] text-white"
                        : "border-[#cdd5cf]"
                    }`}
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                </span>

                <span className="mt-2 block text-sm leading-5 text-[#7b877f]">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </FormField>

      <DynamicTextList
        title="Workshop bao gồm"
        description="Liệt kê vật liệu, dụng cụ, đồ uống hoặc các quyền lợi đã gồm trong học phí."
        items={form.includes}
        placeholder="Ví dụ: Toàn bộ nguyên vật liệu thực hành"
        onChange={(index, value) => updateListItem("includes", index, value)}
        onAdd={() => addListItem("includes")}
        onRemove={(index) => removeListItem("includes", index)}
      />
    </div>
  );
}

type ScheduleStepProps = {
  schedules: ScheduleFormItem[];
  seats: string;
  updateSchedule: <K extends keyof ScheduleFormItem>(
    scheduleId: string,
    key: K,
    value: ScheduleFormItem[K],
  ) => void;
  addSchedule: () => void;
  removeSchedule: (scheduleId: string) => void;
};

function ScheduleStep({
  schedules,
  seats,
  updateSchedule,
  addSchedule,
  removeSchedule,
}: ScheduleStepProps) {
  const today = getTodayInputValue();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#dfe8dc] bg-[#f4f8f1] p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-[#315d43]" />
          <div>
            <p className="text-sm font-bold text-[#284936]">
              Có thể thêm nhiều buổi tổ chức
            </p>
            <p className="mt-1 text-sm leading-6 text-[#718078]">
              Mỗi lịch có ngày, giờ và số chỗ riêng. Số chỗ mặc định lấy từ tổng
              số học viên của workshop.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule, index) => (
          <div
            key={schedule.id}
            className="rounded-2xl border border-[#e1e7df] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf4e9] text-sm font-black text-[#315d43]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-[#294936]">
                    Lịch tổ chức {index + 1}
                  </p>
                  <p className="text-xs text-[#87938b]">
                    Chọn ngày, giờ bắt đầu và số chỗ.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeSchedule(schedule.id)}
                className="flex size-9 items-center justify-center rounded-xl text-[#9a6b67] transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Xóa lịch ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Ngày tổ chức" required>
                <Input
                  type="date"
                  min={today}
                  value={schedule.date}
                  onChange={(event) =>
                    updateSchedule(schedule.id, "date", event.target.value)
                  }
                  className="h-12 rounded-xl border-[#dfe5dd]"
                />
              </FormField>

              <FormField label="Giờ bắt đầu" required>
                <Input
                  type="time"
                  value={schedule.time}
                  onChange={(event) =>
                    updateSchedule(schedule.id, "time", event.target.value)
                  }
                  className="h-12 rounded-xl border-[#dfe5dd]"
                />
              </FormField>

              <FormField label="Số chỗ" required>
                <Input
                  type="number"
                  min={1}
                  max={Number(seats) || undefined}
                  value={schedule.spotsLeft || ""}
                  onChange={(event) =>
                    updateSchedule(
                      schedule.id,
                      "spotsLeft",
                      Number(event.target.value),
                    )
                  }
                  placeholder={seats || "12"}
                  className="h-12 rounded-xl border-[#dfe5dd]"
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSchedule}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cbd6cb] bg-[#fafbf8] px-4 py-4 text-sm font-bold text-[#42624f] transition hover:border-[#6f8c76] hover:bg-[#f1f6ee]"
      >
        <Plus className="size-4" />
        Thêm lịch tổ chức
      </button>
    </div>
  );
}

type LocationStepProps = {
  location: WorkshopLocation;
  onChange: (location: WorkshopLocation) => void;
};

function LocationStep({ location, onChange }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#f0e1c9] bg-[#fff9ef] p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#9a6c2f]" />
          <div>
            <p className="text-sm font-bold text-[#76552b]">
              Chọn đúng vị trí tổ chức
            </p>
            <p className="mt-1 text-sm leading-6 text-[#8c7659]">
              Địa chỉ và tọa độ được dùng để tìm kiếm workshop gần người dùng.
            </p>
          </div>
        </div>
      </div>

      <LocationPicker
        value={{ ...location, placeId: location.placeId ?? "" }}
        onChange={onChange}
      />
    </div>
  );
}

function PreviewStep({ form }: { form: WorkshopFormState }) {
  const validHighlights = form.highlights
    .map((item) => item.trim())
    .filter(Boolean);

  const validIncludes = form.includes
    .map((item) => item.trim())
    .filter(Boolean);

  const validSchedules = form.schedules.filter(
    (schedule) => schedule.date && schedule.time,
  );

  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-3xl border border-[#e1e7df] bg-white shadow-sm">
        <div className="relative aspect-[16/8] overflow-hidden bg-[#e9eee7]">
          {form.thumbnail ? (
            <img
              src={form.thumbnail.previewUrl}
              alt={form.title || "Ảnh đại diện workshop"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#7f8c84]">
              <ImagePlus className="size-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#214c36] backdrop-blur">
              {form.category}
            </span>
            <h3 className="mt-3 max-w-3xl text-2xl font-black sm:text-3xl">
              {form.title || "Tên workshop"}
            </h3>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h4 className="font-bold text-[#294936]">Giới thiệu</h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#6f7e75]">
              {form.description || "Chưa có mô tả."}
            </p>

            {validHighlights.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-[#294936]">Điểm nổi bật</h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {validHighlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 rounded-xl bg-[#f5f8f3] px-3 py-2.5 text-sm text-[#526359]"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3f7654]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validIncludes.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-[#294936]">Đã bao gồm</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {validIncludes.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#dce5da] bg-white px-3 py-1.5 text-xs font-semibold text-[#5d6e63]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl bg-[#f7f9f5] p-4">
            <PreviewInfoRow
              icon={<Banknote className="size-4" />}
              label="Học phí"
              value={formatPrice(form.price)}
            />
            <PreviewInfoRow
              icon={<Clock3 className="size-4" />}
              label="Thời lượng"
              value={form.duration || "Chưa thiết lập"}
            />
            <PreviewInfoRow
              icon={<Users className="size-4" />}
              label="Số học viên"
              value={form.seats ? `${form.seats} người` : "Chưa thiết lập"}
            />
            <PreviewInfoRow
              icon={<BookOpen className="size-4" />}
              label="Trình độ"
              value={
                LEVEL_OPTIONS.find((item) => item.value === form.level)
                  ?.label ?? form.level
              }
            />
            <PreviewInfoRow
              icon={<CalendarDays className="size-4" />}
              label="Lịch tổ chức"
              value={`${validSchedules.length} lịch`}
            />
            <PreviewInfoRow
              icon={<MapPin className="size-4" />}
              label="Địa điểm"
              value={form.location.address || "Chưa chọn địa điểm"}
            />
          </div>
        </div>
      </div>

      {form.gallery.length > 0 && (
        <section>
          <h3 className="font-bold text-[#294936]">Thư viện ảnh</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.gallery.map((item) => (
              <img
                key={item.id}
                src={item.previewUrl}
                alt={item.file.name}
                className="aspect-square rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-[#dce6d9] bg-[#f2f7ef] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#356e4a]" />
          <div>
            <p className="text-sm font-bold text-[#284936]">
              Sẵn sàng đăng workshop
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6f7e75]">
              Khi bấm “Đăng workshop”, toàn bộ dữ liệu và file media sẽ được gửi
              trong một request duy nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function FormField({
  label,
  description,
  required,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <div className="mb-2">
        <label className="text-sm font-bold text-[#314d3b]">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {description && (
          <p className="mt-1 text-xs leading-5 text-[#87938b]">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
}

function CharacterCount({
  current,
  maximum,
}: {
  current: number;
  maximum: number;
}) {
  return (
    <p className="mt-1 text-right text-xs text-[#909a93]">
      {current}/{maximum}
    </p>
  );
}

type DynamicTextListProps = {
  title: string;
  description: string;
  items: string[];
  placeholder: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

function DynamicTextList({
  title,
  description,
  items,
  placeholder,
  onChange,
  onAdd,
  onRemove,
}: DynamicTextListProps) {
  return (
    <section className="rounded-2xl border border-[#e3e8e1] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#294936]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#7b877f]">{description}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="shrink-0 rounded-xl border-[#dce3da]"
        >
          <Plus className="mr-1 size-4" />
          Thêm
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f7f2] text-sm font-bold text-[#65756b]">
              {index + 1}
            </span>

            <Input
              value={item}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={placeholder}
              className="h-11 rounded-xl border-[#dfe5dd]"
            />

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[#9a6b67] transition hover:bg-red-50 hover:text-red-600"
              aria-label={`Xóa mục ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

type SingleMediaPickerProps = {
  label: string;
  description: string;
  accept: string;
  media: LocalMedia | null;
  onChange: (file: File | null) => void;
  icon: ReactNode;
  required?: boolean;
};

function SingleMediaPicker({
  label,
  description,
  accept,
  media,
  onChange,
  icon,
  required,
}: SingleMediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file?: File) => {
    if (!file) {
      return;
    }

    if (accept.startsWith("image") && !file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng hình ảnh");
      return;
    }

    if (accept.startsWith("video") && !file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn đúng định dạng video");
      return;
    }

    onChange(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-bold text-[#314d3b]">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#87938b]">{description}</p>
      </div>

      {media ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white">
          {media.file.type.startsWith("video/") ? (
            <video
              src={media.previewUrl}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          ) : (
            <img
              src={media.previewUrl}
              alt={media.file.name}
              className="aspect-video w-full object-cover"
            />
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[#edf0eb] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#344f3e]">
                {media.file.name}
              </p>
              <p className="text-xs text-[#8a958e]">
                {(media.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl"
              >
                Thay file
              </Button>

              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex size-9 items-center justify-center rounded-xl text-[#9a6b67] transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Xóa ${label}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbd6cb] bg-white px-5 py-8 text-center transition hover:border-[#75907a] hover:bg-[#f8faf7]"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4e9] text-[#315d43]">
            {icon}
          </span>

          <p className="mt-3 text-sm font-bold text-[#344f3e]">
            Kéo thả file vào đây
          </p>
          <p className="mt-1 text-xs text-[#8a958e]">hoặc chọn từ thiết bị</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-xl border-[#d6ded4]"
          >
            Chọn file
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

type GalleryPickerProps = {
  items: LocalMedia[];
  onAdd: (files: File[]) => void;
  onRemove: (mediaId: string) => void;
};

function GalleryPicker({ items, onAdd, onRemove }: GalleryPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    onAdd(Array.from(fileList));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    processFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#314d3b]">Thư viện ảnh</p>
          <p className="mt-1 text-xs leading-5 text-[#87938b]">
            Tối đa {MAX_GALLERY_FILES} ảnh. Có thể chọn nhiều ảnh cùng lúc.
          </p>
        </div>

        <span className="rounded-full bg-[#f1f5ef] px-3 py-1 text-xs font-bold text-[#5b6e62]">
          {items.length}/{MAX_GALLERY_FILES}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-[#e0e6de] bg-white"
            >
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
              />

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-100 shadow-sm backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Xóa ảnh ${item.file.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbd6cb] bg-white px-5 py-6 text-center transition hover:border-[#75907a] hover:bg-[#f8faf7]"
      >
        <Images className="size-6 text-[#42624f]" />
        <p className="mt-2 text-sm font-bold text-[#344f3e]">
          Thêm ảnh vào thư viện
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={items.length >= MAX_GALLERY_FILES}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-xl border-[#d6ded4]"
        >
          <Plus className="mr-1 size-4" />
          Chọn ảnh
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

type MobileStepperProps = {
  step: Step;
  highestVisitedStep: Step;
  onStepChange: (step: Step) => void;
};

function MobileStepper({
  step,
  highestVisitedStep,
  onStepChange,
}: MobileStepperProps) {
  return (
    <div className="mb-5 overflow-x-auto lg:hidden">
      <div className="flex min-w-max gap-2 rounded-2xl border border-[#e2e8e0] bg-white p-2">
        {STEPS.map((item, index) => {
          const currentStep = index as Step;
          const isCurrent = currentStep === step;
          const canVisit = currentStep <= highestVisitedStep;

          return (
            <button
              key={item.title}
              type="button"
              disabled={!canVisit}
              onClick={() => onStepChange(currentStep)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                isCurrent
                  ? "bg-[#214c36] text-white"
                  : canVisit
                    ? "bg-[#f4f7f2] text-[#5e6f64]"
                    : "cursor-not-allowed text-[#a4aca6]"
              }`}
            >
              <span>{index + 1}</span>
              <span>{item.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4e9] text-[#315d43]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[#8a958e]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-bold text-[#344f3e]">
          {value}
        </p>
      </div>
    </div>
  );
}

function SuccessState({
  workshopId,
  onCreateAnother,
}: {
  workshopId: string;
  onCreateAnother: () => void;
}) {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-[#dfe6dd] bg-white p-7 text-center shadow-[0_24px_70px_rgba(31,67,45,0.12)] sm:p-10"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-[#214c36] text-white shadow-lg shadow-[#214c36]/20">
          <Check className="size-9" strokeWidth={3} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-[#183c2b]">
          Workshop đã được đăng
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#758179]">
          Dữ liệu và media đã được gửi thành công. Workshop hiện đã sẵn sàng để
          người dùng xem và đăng ký.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCreateAnother}
            className="h-11 rounded-xl border-[#dce3da]"
          >
            <Plus className="mr-2 size-4" />
            Tạo workshop khác
          </Button>

          <Button
            type="button"
            onClick={() => navigate(`/workshops/${workshopId}`)}
            className="h-11 rounded-xl bg-[#214c36] text-white hover:bg-[#183c2b]"
          >
            Xem workshop
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </motion.div>
    </main>
  );
}

export default CreateWorkshopPage;
