import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Plus,
  Save,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/data";
import { workshopService } from "@/services/workshopService";
import type {
  CreateWorkshopSchedulePayload,
  UpdateWorkshopPayload,
  Workshop,
} from "@/types/workshop";

type EditWorkshopForm = {
  title: string;
  categories: string[];
  description: string;
  highlightsText: string;
  includesText: string;
  price: string;
  duration: string;
  status: "draft" | "published" | "cancelled" | "archived";
  address: string;
  placeId: string;
  notes: string;
};

type NewScheduleForm = {
  startAt: string;
  seatsTotal: string;
};

const createInitialForm = (workshop: Workshop): EditWorkshopForm => ({
  title: workshop.title,
  categories: workshop.categories ?? [],
  description: workshop.description,
  highlightsText: (workshop.highlights ?? []).join("\n"),
  includesText: (workshop.includes ?? []).join("\n"),
  price: String(workshop.price),
  duration: workshop.duration ?? "",
  status: workshop.status ?? "published",
  address: workshop.location.address,
  placeId: workshop.location.placeId ?? "",
  notes: workshop.location.notes ?? "",
});

const splitLines = (value: string) => {
  return [
    ...new Set(
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const getMinimumDateTime = () => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatScheduleDate = (startAt: string) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "Thời gian không hợp lệ";
  }

  return date.toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price: number) => {
  return `${price.toLocaleString("vi-VN")}đ`;
};

export default function EditWorkshopPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [form, setForm] = useState<EditWorkshopForm | null>(null);
  const [newSchedule, setNewSchedule] = useState<NewScheduleForm>({
    startAt: "",
    seatsTotal: "1",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadWorkshop = async () => {
      try {
        setLoading(true);

        const data = await workshopService.getWorkshopById(id);

        if (!active) {
          return;
        }

        setWorkshop(data);
        setForm(createInitialForm(data));
      } catch (error) {
        console.error("Load workshop for edit error:", error);

        if (active) {
          toast.error("Không thể tải workshop cần chỉnh sửa");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadWorkshop();

    return () => {
      active = false;
    };
  }, [id]);

  const sortedSchedules = useMemo(() => {
    return [...(workshop?.schedules ?? [])].sort((first, second) => {
      return (
        new Date(first.startAt).getTime() - new Date(second.startAt).getTime()
      );
    });
  }, [workshop]);

  const setField = <K extends keyof EditWorkshopForm>(
    key: K,
    value: EditWorkshopForm[K],
  ) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
  };

  const toggleCategory = (category: string) => {
    if (!form) {
      return;
    }

    const selected = form.categories.includes(category);

    setField(
      "categories",
      selected
        ? form.categories.filter((item) => item !== category)
        : [...form.categories, category],
    );
  };

  const validateWorkshop = () => {
    if (!form) {
      return false;
    }

    if (form.title.trim().length < 5) {
      toast.error("Tên workshop phải có ít nhất 5 ký tự");
      return false;
    }

    if (form.categories.length === 0) {
      toast.error("Workshop phải có ít nhất một danh mục");
      return false;
    }

    if (form.description.trim().length < 30) {
      toast.error("Mô tả workshop phải có ít nhất 30 ký tự");
      return false;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Giá workshop không hợp lệ");
      return false;
    }

    if (!form.address.trim()) {
      toast.error("Địa chỉ workshop không được để trống");
      return false;
    }

    return true;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !form || !workshop || saving || !validateWorkshop()) {
      return;
    }

    const [longitude, latitude] = workshop.location.coordinates.coordinates;

    const payload: UpdateWorkshopPayload = {
      title: form.title.trim(),
      categories: form.categories,
      description: form.description.trim(),
      highlights: splitLines(form.highlightsText),
      includes: splitLines(form.includesText),
      price: Number(form.price),
      duration: form.duration.trim(),
      status: form.status,
      location: {
        address: form.address.trim(),
        placeId: form.placeId.trim(),
        notes: form.notes.trim(),
        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    };

    try {
      setSaving(true);

      const updatedWorkshop = await workshopService.updateWorkshop(id, payload);

      setWorkshop(updatedWorkshop);
      setForm(createInitialForm(updatedWorkshop));
      toast.success("Đã cập nhật workshop");
    } catch (error) {
      console.error("Update workshop error:", error);

      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật workshop",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || addingSchedule) {
      return;
    }

    const startDate = new Date(newSchedule.startAt);
    const seatsTotal = Number(newSchedule.seatsTotal);

    if (!newSchedule.startAt || Number.isNaN(startDate.getTime())) {
      toast.error("Vui lòng chọn ngày giờ hợp lệ");
      return;
    }

    if (startDate.getTime() <= Date.now()) {
      toast.error("Lịch mới phải nằm trong tương lai");
      return;
    }

    if (!Number.isInteger(seatsTotal) || seatsTotal < 1) {
      toast.error("Số chỗ phải là số nguyên lớn hơn 0");
      return;
    }

    const payload: CreateWorkshopSchedulePayload = {
      startAt: startDate.toISOString(),
      seatsTotal,
    };

    try {
      setAddingSchedule(true);

      const updatedWorkshop = await workshopService.addWorkshopSchedule(
        id,
        payload,
      );

      setWorkshop(updatedWorkshop);
      setNewSchedule({
        startAt: "",
        seatsTotal: "1",
      });

      toast.success("Đã thêm lịch mới");
    } catch (error) {
      console.error("Add workshop schedule error:", error);

      toast.error(
        error instanceof Error ? error.message : "Không thể thêm lịch mới",
      );
    } finally {
      setAddingSchedule(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <Loader2 className="size-9 animate-spin text-[#214c36]" />
      </main>
    );
  }

  if (!id || !workshop || !form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-4">
        <div className="max-w-md rounded-3xl border border-[#e1e7df] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-[#173d2b]">
            Không tìm thấy workshop
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            Workshop không tồn tại hoặc bạn không có quyền chỉnh sửa.
          </p>

          <Button
            type="button"
            className="mt-6 rounded-full"
            onClick={() => navigate("/host")}
          >
            Quay lại trang quản lý
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] pb-16 pt-16 text-[#183c2b]">
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
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#4f755d]">
                Chỉnh sửa workshop
              </span>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#173d2b] sm:text-4xl">
                {workshop.title}
              </h1>

              <p className="mt-2 text-sm text-[#718078]">
                Cập nhật nội dung và thêm lịch mới mà không ảnh hưởng booking
                cũ.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/workshops/${workshop._id}`)}
                className="rounded-full bg-white"
              >
                Xem trang workshop
              </Button>

              <Button
                type="submit"
                form="edit-workshop-form"
                disabled={saving}
                className="rounded-full px-6"
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <form
          id="edit-workshop-form"
          onSubmit={handleSave}
          className="space-y-6"
        >
          <section className="rounded-3xl border border-[#e1e7df] bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              title="Thông tin workshop"
              description="Các thông tin này được hiển thị trên trang chi tiết."
            />

            <div className="mt-6 space-y-5">
              <Field label="Tên workshop">
                <Input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Tên workshop"
                />
              </Field>

              <Field label="Danh mục">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => {
                    const selected = form.categories.includes(category.name);

                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          selected
                            ? "border-[#214c36] bg-[#214c36] text-white"
                            : "border-[#dce4dd] bg-white text-[#607068] hover:border-[#8aa092]"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Mô tả">
                <Textarea
                  rows={8}
                  value={form.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Mô tả trải nghiệm workshop"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Học phí">
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(event) => setField("price", event.target.value)}
                  />
                </Field>

                <Field label="Thời lượng">
                  <Input
                    value={form.duration}
                    onChange={(event) =>
                      setField("duration", event.target.value)
                    }
                    placeholder="Ví dụ: 2 giờ"
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Điểm nổi bật" hint="Mỗi dòng là một nội dung">
                  <Textarea
                    rows={6}
                    value={form.highlightsText}
                    onChange={(event) =>
                      setField("highlightsText", event.target.value)
                    }
                  />
                </Field>

                <Field label="Bao gồm" hint="Mỗi dòng là một nội dung">
                  <Textarea
                    rows={6}
                    value={form.includesText}
                    onChange={(event) =>
                      setField("includesText", event.target.value)
                    }
                  />
                </Field>
              </div>

              <Field label="Trạng thái">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setField(
                      "status",
                      event.target.value as EditWorkshopForm["status"],
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đang xuất bản</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="archived">Đã lưu trữ</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e1e7df] bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              title="Địa điểm"
              description="Phiên bản này giữ nguyên tọa độ hiện tại và cho phép sửa nội dung địa chỉ."
            />

            <div className="mt-6 space-y-5">
              <Field label="Địa chỉ">
                <Input
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                />
              </Field>

              <Field label="Ghi chú đường đi">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  placeholder="Tầng, phòng, chỗ gửi xe..."
                />
              </Field>
            </div>
          </section>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-3xl border border-[#dbe5dc] bg-[#edf4e9] p-5 shadow-sm">
            <SectionTitle
              title="Thêm lịch mới"
              description="Lịch mới luôn bắt đầu với số chỗ còn lại bằng tổng số chỗ."
            />

            <form onSubmit={handleAddSchedule} className="mt-5 space-y-4">
              <Field label="Ngày và giờ bắt đầu">
                <Input
                  type="datetime-local"
                  min={getMinimumDateTime()}
                  value={newSchedule.startAt}
                  onChange={(event) =>
                    setNewSchedule((current) => ({
                      ...current,
                      startAt: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Tổng số chỗ">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={newSchedule.seatsTotal}
                  onChange={(event) =>
                    setNewSchedule((current) => ({
                      ...current,
                      seatsTotal: event.target.value,
                    }))
                  }
                />
              </Field>

              <Button
                type="submit"
                disabled={addingSchedule}
                className="w-full rounded-xl"
              >
                {addingSchedule ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Thêm lịch
              </Button>
            </form>
          </section>

          <section className="rounded-3xl border border-[#e1e7df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-[#173d2b]">Lịch hiện tại</h2>
                <p className="mt-1 text-xs text-[#718078]">
                  {sortedSchedules.length} lịch tổ chức
                </p>
              </div>

              <CalendarDays className="size-5 text-[#4d755c]" />
            </div>

            {sortedSchedules.length > 0 ? (
              <div className="mt-5 space-y-3">
                {sortedSchedules.map((schedule) => {
                  const bookedSeats = Math.max(
                    0,
                    schedule.seatsTotal - schedule.spotsLeft,
                  );

                  const isPast =
                    new Date(schedule.startAt).getTime() < Date.now();

                  return (
                    <div
                      key={schedule._id ?? schedule.startAt}
                      className="rounded-2xl border border-[#e3e9e3] bg-[#fbfcfa] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#294936]">
                            {formatScheduleDate(schedule.startAt)}
                          </p>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#718078]">
                            <Users className="size-3.5" />
                            Đã đặt {bookedSeats} · Còn {schedule.spotsLeft}/
                            {schedule.seatsTotal} chỗ
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isPast
                              ? "bg-[#eeeeec] text-[#777a76]"
                              : schedule.spotsLeft > 0
                                ? "bg-[#e5f3e8] text-[#2f6842]"
                                : "bg-[#f8e5e2] text-[#9a4038]"
                          }`}
                        >
                          {isPast
                            ? "Đã qua"
                            : schedule.spotsLeft > 0
                              ? "Đang mở"
                              : "Hết chỗ"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[#dce4dd] p-6 text-center text-sm text-[#718078]">
                Workshop chưa có lịch.
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-[#173d2b] p-5 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
              Giá hiện tại
            </p>
            <p className="mt-2 text-2xl font-black">
              {formatPrice(workshop.price)}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Thêm lịch không làm thay đổi giá workshop hoặc các booking đã có.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

type SectionTitleProps = {
  title: string;
  description: string;
};

function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div>
      <h2 className="text-lg font-black text-[#173d2b]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#718078]">{description}</p>
    </div>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#294936]">
        {label}
        {hint && (
          <span className="text-xs font-normal text-[#869188]">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}
