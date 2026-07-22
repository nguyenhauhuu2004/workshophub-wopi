import { useState } from "react";
import { useParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Clock,
  DollarSign,
  Users,
  MapPin,
  BookOpen,
  Calendar,
  Eye,
} from "lucide-react";
import { WORKSHOPS, CATEGORIES } from "../data";
import WorkshopMediaUploader from "@/components/WorkshopMediaUploader";
import LocationPicker from "@/components/LocationPicker";
import { toast } from "sonner";
import type { WorkshopFormData } from "@/types/workshop";
import {
  workshopService,
  type WorkshopPayload,
} from "@/services/workshopService";

// type WorkshopMedia = {
//   url: string;
//   publicId: string;
//   resourceType: "image" | "video";
// };

export type WorkshopLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId?: string;
  notes: string;
};

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = ["Basics", "Details", "Schedule", "Location", "Preview"];

const GRADIENTS = [
  "from-violet-600 to-purple-700",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-violet-600",
];

interface Schedule {
  date: string;
  time: string;
  spotsLeft: number;
}

export function CreateWorkshopPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  // const existing = id ? WORKSHOPS.find((w) => w.id === Number(id)) : undefined;

  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  const [form, setForm] = useState<WorkshopFormData>({
    title: "",
    category: CATEGORIES[0].name,
    description: "",
    highlights: [""],
    gradient: GRADIENTS[0],
    price: "",
    duration: "",
    seats: "",
    level: "Beginner",
    includes: [""],

    thumbnail: null,
    gallery: [],
    video: null,

    schedules: [
      {
        date: "",
        time: "10:00",
        spotsLeft: 0,
      },
    ],

    location: {
      address: "",
      latitude: null,
      longitude: null,
      placeId: "",
      notes: "",
    },
  });

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateListItem(
    field: "highlights" | "includes",
    i: number,
    v: string,
  ) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[i] = v;
      return { ...f, [field]: arr };
    });
  }
  function addListItem(field: "highlights" | "includes") {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  }
  function removeListItem(field: "highlights" | "includes", i: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));
  }

  function updateSchedule(i: number, k: keyof Schedule, v: string | number) {
    setForm((f) => {
      const arr = [...f.schedules];
      arr[i] = { ...arr[i], [k]: v };
      return { ...f, schedules: arr };
    });
  }
  function addSchedule() {
    setForm((f) => ({
      ...f,
      schedules: [
        ...f.schedules,
        { date: "", time: "10:00 AM", spotsLeft: Number(f.seats) || 10 },
      ],
    }));
  }
  function removeSchedule(i: number) {
    setForm((f) => ({
      ...f,
      schedules: f.schedules.filter((_, idx) => idx !== i),
    }));
  }
  function validateCurrentStep() {
    if (step === 0) {
      if (!form.title.trim()) {
        toast.error("Vui lòng nhập tên workshop");
        return false;
      }

      if (!form.description.trim()) {
        toast.error("Vui lòng nhập mô tả");
        return false;
      }

      if (!form.thumbnail) {
        toast.error("Vui lòng upload ảnh đại diện");
        return false;
      }
    }

    if (step === 1) {
      if (Number(form.price) < 0) {
        toast.error("Giá workshop không hợp lệ");
        return false;
      }

      if (Number(form.seats) < 1) {
        toast.error("Số lượng học viên không hợp lệ");
        return false;
      }

      if (!form.duration.trim()) {
        toast.error("Vui lòng nhập thời lượng");
        return false;
      }
    }

    if (step === 2) {
      const validSchedules = form.schedules.filter(
        (schedule) => schedule.date && schedule.time,
      );

      if (!validSchedules.length) {
        toast.error("Vui lòng thêm lịch workshop");
        return false;
      }
    }

    if (step === 3) {
      if (
        !form.location.address ||
        form.location.latitude === null ||
        form.location.longitude === null
      ) {
        toast.error("Vui lòng chọn địa điểm trên bản đồ");

        return false;
      }
    }

    return true;
  }
  const handleNextStep = () => {
    if (!validateCurrentStep()) return;

    setStep((current) => Math.min(current + 1, 4) as Step);
  };

  async function handlePublish() {
    if (!validateCurrentStep()) return;

    if (
      !form.thumbnail ||
      form.location.longitude === null ||
      form.location.latitude === null
    ) {
      return;
    }

    try {
      setSaving(true);

      const payload: WorkshopPayload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        gradient: form.gradient,

        thumbnail: form.thumbnail,
        gallery: form.gallery,
        video: form.video,

        highlights: form.highlights.map((item) => item.trim()).filter(Boolean),

        includes: form.includes.map((item) => item.trim()).filter(Boolean),

        price: Number(form.price),
        duration: form.duration.trim(),
        seatsTotal: Number(form.seats),
        level: form.level,

        schedules: form.schedules
          .filter((schedule) => schedule.date && schedule.time)
          .map((schedule) => ({
            ...schedule,
            spotsLeft: schedule.spotsLeft || Number(form.seats),
          })),

        location: {
          address: form.location.address,
          placeId: form.location.placeId,
          notes: form.location.notes,

          coordinates: {
            type: "Point",
            coordinates: [form.location.longitude, form.location.latitude],
          },
        },
      };

      const result = isEdit
        ? await workshopService.updateWorkshop(id!, payload)
        : await workshopService.createWorkshop(payload);

      console.log("Workshop result:", result);

      setPublished(true);
    } catch (error) {
      console.error("Publish workshop error:", error);
      toast.error("Không thể lưu workshop");
    } finally {
      setSaving(false);
    }
  }

  if (published) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-300">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          <h1
            className="text-3xl font-black text-[#0D0D1A] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isEdit ? "Workshop Updated!" : "Workshop Published!"}
          </h1>
          <p className="text-gray-400 mb-8">
            Your workshop is now live and accepting bookings.
          </p>
          <div className="flex gap-3">
            <Link to="/host" className="flex-1">
              <button className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                Dashboard
              </button>
            </Link>
            <Link to={`/workshop/1`} className="flex-1">
              <button className="w-full bg-[#7C3AED] text-white font-bold py-3 rounded-2xl shadow-lg shadow-violet-200">
                View Workshop
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-16">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/host">
          <motion.span
            whileHover={{ x: -3 }}
            className="flex items-center gap-2 text-gray-500 hover:text-[#7C3AED] text-sm font-medium transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </motion.span>
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-[#0D0D1A] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {isEdit ? "Edit Workshop" : "Create Workshop"}
        </motion.h1>
        <p className="text-gray-400 mb-10">
          Share your skills and passion with the world.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i as Step)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === i ? "bg-[#7C3AED] text-white shadow-lg shadow-violet-200" : step > i ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"}`}
                >
                  {step > i ? <Check size={16} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block ${step === i ? "text-[#7C3AED]" : step > i ? "text-emerald-600" : "text-gray-400"}`}
                >
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > i ? "bg-emerald-400" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6"
          >
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#0D0D1A]">
                  Basic Information
                </h2>
                <div>
                  <label className="label-style">Workshop Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="e.g. Watercolor Landscape Painting for Beginners"
                    className="input-style w-full"
                  />
                </div>
                <div>
                  <label className="label-style">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setField("category", c.name)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.category === c.name ? "border-[#7C3AED] bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-style">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Describe what students will experience in your workshop..."
                    rows={5}
                    className="input-style w-full resize-none"
                  />
                </div>
                <div>
                  <label className="label-style">Visual Theme</label>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENTS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setField("gradient", g)}
                        className={`h-12 rounded-xl bg-gradient-to-br ${g} transition-all ${form.gradient === g ? "ring-3 ring-[#7C3AED] ring-offset-2 scale-105" : "hover:scale-105"}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-style">Workshop Highlights</label>
                  <div className="space-y-2">
                    {form.highlights.map((h, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={h}
                          onChange={(e) =>
                            updateListItem("highlights", i, e.target.value)
                          }
                          placeholder={`Highlight ${i + 1}`}
                          className="input-style flex-1"
                        />
                        {form.highlights.length > 1 && (
                          <button
                            onClick={() => removeListItem("highlights", i)}
                            className="text-red-400 hover:text-red-500 px-2"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem("highlights")}
                      className="flex items-center gap-1.5 text-sm text-[#7C3AED] font-semibold hover:underline"
                    >
                      <Plus size={14} /> Add highlight
                    </button>
                  </div>
                </div>
                <WorkshopMediaUploader
                  label="Ảnh đại diện workshop"
                  accept="image"
                  maxFiles={1}
                  value={form.thumbnail ? [form.thumbnail] : []}
                  onChange={(media) => setField("thumbnail", media[0] ?? null)}
                />

                <WorkshopMediaUploader
                  label="Thư viện hình ảnh"
                  accept="image"
                  multiple
                  maxFiles={8}
                  value={form.gallery}
                  onChange={(media) => setField("gallery", media)}
                />

                <WorkshopMediaUploader
                  label="Video giới thiệu"
                  accept="video"
                  maxFiles={1}
                  value={form.video ? [form.video] : []}
                  onChange={(media) => setField("video", media[0] ?? null)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#0D0D1A]">
                  Workshop Details
                </h2>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="label-style">
                      <DollarSign size={13} className="inline mr-1" />
                      Price per person ($)
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setField("price", e.target.value)}
                      placeholder="89"
                      min="0"
                      className="input-style w-full"
                    />
                  </div>
                  <div>
                    <label className="label-style">
                      <Clock size={13} className="inline mr-1" />
                      Duration
                    </label>
                    <input
                      value={form.duration}
                      onChange={(e) => setField("duration", e.target.value)}
                      placeholder="e.g. 3 hours"
                      className="input-style w-full"
                    />
                  </div>
                  <div>
                    <label className="label-style">
                      <Users size={13} className="inline mr-1" />
                      Max Group Size
                    </label>
                    <input
                      type="number"
                      value={form.seats}
                      onChange={(e) => setField("seats", e.target.value)}
                      placeholder="12"
                      min="1"
                      className="input-style w-full"
                    />
                  </div>
                  <div>
                    <label className="label-style">
                      <BookOpen size={13} className="inline mr-1" />
                      Level
                    </label>
                    <select
                      value={form.level}
                      onChange={(e) =>
                        setField("level", e.target.value as typeof form.level)
                      }
                      className="input-style w-full"
                    >
                      {" "}
                      {[
                        "Beginner",
                        "Intermediate",
                        "Advanced",
                        "All Levels",
                      ].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-style">What's Included</label>
                  <div className="space-y-2">
                    {form.includes.map((inc, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={inc}
                          onChange={(e) =>
                            updateListItem("includes", i, e.target.value)
                          }
                          placeholder={`Included item ${i + 1}`}
                          className="input-style flex-1"
                        />
                        {form.includes.length > 1 && (
                          <button
                            onClick={() => removeListItem("includes", i)}
                            className="text-red-400 hover:text-red-500 px-2"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem("includes")}
                      className="flex items-center gap-1.5 text-sm text-[#7C3AED] font-semibold hover:underline"
                    >
                      <Plus size={14} /> Add item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#0D0D1A]">
                  Schedule Sessions
                </h2>
                <p className="text-gray-400 text-sm">
                  Add the dates and times when your workshop will run.
                </p>
                <div className="space-y-3">
                  {form.schedules.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-center p-4 border-2 border-gray-100 rounded-2xl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <input
                        type="date"
                        value={s.date}
                        onChange={(e) =>
                          updateSchedule(i, "date", e.target.value)
                        }
                        className="input-style flex-1"
                      />
                      <input
                        type="text"
                        value={s.time}
                        onChange={(e) =>
                          updateSchedule(i, "time", e.target.value)
                        }
                        placeholder="10:00 AM"
                        className="input-style w-28"
                      />
                      {form.schedules.length > 1 && (
                        <button
                          onClick={() => removeSchedule(i)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addSchedule}
                  className="flex items-center gap-2 text-sm text-[#7C3AED] font-semibold border-2 border-dashed border-violet-200 rounded-2xl px-4 py-3 w-full justify-center hover:border-violet-400 hover:bg-violet-50/50 transition-all"
                >
                  <Plus size={16} /> Add Another Date
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-[#0D0D1A]">
                    Địa điểm workshop
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Tìm kiếm địa chỉ hoặc click trực tiếp lên bản đồ.
                  </p>
                </div>

                <LocationPicker
                  value={form.location}
                  onChange={(location) => setField("location", location)}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#0D0D1A]">
                  Preview & Publish
                </h2>
                {/* Mini preview card */}
                <div
                  className={`bg-gradient-to-br ${form.gradient} rounded-2xl p-6 relative overflow-hidden`}
                >
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-sm" />
                  <div className="absolute -left-4 bottom-4 w-20 h-20 rounded-full bg-black/10" />
                  <span className="bg-black/25 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {form.category}
                  </span>
                  <h3 className="text-white font-black text-xl mt-3 leading-snug">
                    {form.title || "Workshop Title"}
                  </h3>
                  <p className="text-white/70 text-sm mt-2 line-clamp-2">
                    {form.description || "Your workshop description..."}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-white/80 text-sm">
                    {form.price && (
                      <span className="font-bold">${form.price}/person</span>
                    )}
                    {form.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {form.duration}
                      </span>
                    )}
                    {form.seats && (
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {form.seats} max
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-2xl border">
                    {form.thumbnail ? (
                      <img
                        src={form.thumbnail.url}
                        alt={form.title}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex aspect-video items-center justify-center bg-gradient-to-br ${form.gradient}`}
                      >
                        <span className="text-white">Chưa có ảnh đại diện</span>
                      </div>
                    )}

                    <div className="p-5">
                      <span className="text-sm font-semibold text-violet-600">
                        {form.category}
                      </span>

                      <h3 className="mt-2 text-xl font-bold">
                        {form.title || "Workshop title"}
                      </h3>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {form.description || "Workshop description"}
                      </p>

                      <p className="mt-3 text-sm">
                        {form.location.address || "Chưa chọn địa điểm"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary list */}
                <div className="space-y-3">
                  {[
                    {
                      icon: <BookOpen size={15} />,
                      label: "Category",
                      value: form.category,
                    },
                    {
                      icon: <DollarSign size={15} />,
                      label: "Price",
                      value: form.price
                        ? `$${form.price} per person`
                        : "Not set",
                    },
                    {
                      icon: <Clock size={15} />,
                      label: "Duration",
                      value: form.duration || "Not set",
                    },
                    {
                      icon: <Users size={15} />,
                      label: "Group size",
                      value: form.seats
                        ? `Up to ${form.seats} students`
                        : "Not set",
                    },
                    {
                      icon: <Calendar size={15} />,
                      label: "Sessions",
                      value: `${form.schedules.filter((s) => s.date).length} scheduled`,
                    },
                    {
                      icon: <MapPin size={15} />,
                      label: "Location",
                      value: form.location.address || "Not set",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-2xl ${item.value === "Not set" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"}`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium w-24 shrink-0">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => step > 0 && setStep((step - 1) as Step)}
            disabled={step === 0}
            whileHover={step > 0 ? { scale: 1.02 } : {}}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 disabled:opacity-30 hover:border-gray-300 transition-all"
          >
            <ArrowLeft size={16} /> Previous
          </motion.button>

          {step < STEPS.length - 1 ? (
            <motion.button
              onClick={handleNextStep}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 12px 40px rgba(124,58,237,0.35)",
              }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-[#7C3AED] text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-violet-200"
            >
              Next <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              onClick={handlePublish}
              disabled={saving}
              whileHover={
                !saving
                  ? {
                      scale: 1.03,
                      boxShadow: "0 12px 40px rgba(124,58,237,0.4)",
                    }
                  : {}
              }
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-[#7C3AED] text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-violet-200 disabled:opacity-70"
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Eye size={16} />{" "}
                  {isEdit ? "Save Changes" : "Publish Workshop"}
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      <style>{`
        .label-style { display:block; font-size:0.7rem; font-weight:700; color:#9ca3af; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.5rem; }
        .input-style { border:1px solid #e5e7eb; border-radius:1rem; padding:0.75rem 1rem; font-size:0.875rem; color:#0D0D1A; outline:none; transition:all 0.15s; background:white; }
        .input-style:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,0.08); }
        select.input-style { appearance:auto; }
      `}</style>
    </div>
  );
}
