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
  Flame,
  Loader2,
  Plus,
  Repeat,
  Save,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import RecurringScheduleModal, {
  type GeneratedSchedule,
} from "@/components/RecurringScheduleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/data";
import { workshopService } from "@/services/workshopService";
import type {
  BulkCreateWorkshopSchedulePayload,
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
  directDiscountEnabled: boolean;
  directDiscountType: "percentage" | "fixed";
  directDiscountValue: string;
  maxPayAtVenue: string;
  maxQrPayment: string;
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
  directDiscountEnabled: workshop.directDiscount?.isActive ?? false,
  directDiscountType: workshop.directDiscount?.type ?? "percentage",
  directDiscountValue: workshop.directDiscount?.value ? String(workshop.directDiscount.value) : "",
  maxPayAtVenue: workshop.maxPayAtVenue != null ? String(workshop.maxPayAtVenue) : "",
  maxQrPayment: workshop.maxQrPayment != null ? String(workshop.maxQrPayment) : "",
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
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [addingBulkSchedule, setAddingBulkSchedule] = useState(false);

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
      maxPayAtVenue: form.maxPayAtVenue !== "" ? Number(form.maxPayAtVenue) : null,
      maxQrPayment: form.maxQrPayment !== "" ? Number(form.maxQrPayment) : null,
      directDiscount:
        form.directDiscountEnabled && Number(form.directDiscountValue) > 0
          ? {
              type: form.directDiscountType,
              value: Number(form.directDiscountValue),
              isActive: true,
            }
          : {
              type: form.directDiscountType,
              value: 0,
              isActive: false,
            },
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

  const handleApplyRecurringSchedules = async (
    generated: GeneratedSchedule[],
  ) => {
    if (!id || !workshop || generated.length === 0 || addingBulkSchedule) {
      return;
    }

    try {
      setAddingBulkSchedule(true);
      const payload: BulkCreateWorkshopSchedulePayload = {
        schedules: generated.map((s) => ({
          startAt: new Date(s.startAt).toISOString(),
          seatsTotal: s.seatsTotal,
        })),
      };

      const updatedWorkshop = await workshopService.addWorkshopSchedule(
        id,
        payload,
      );

      setWorkshop(updatedWorkshop);
      setShowRecurringModal(false);
      toast.success(`Đã thêm thành công ${generated.length} buổi tổ chức!`);
    } catch (error) {
      console.error("Bulk add schedule error:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể thêm lịch lặp lại",
      );
    } finally {
      setAddingBulkSchedule(false);
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

              {/* Giảm giá trực tiếp (hiển thị trên Card) */}
              <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/60 to-orange-50/40 p-4.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
                      <Flame className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">
                        Giảm giá trực tiếp hiển thị trên Card
                      </p>
                      <p className="text-xs text-stone-500">
                        Tự động gạch ngang giá gốc và hiển thị huy hiệu giảm giá nổi bật
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={form.directDiscountEnabled}
                      onChange={(e) => setField("directDiscountEnabled", e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-stone-300 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {form.directDiscountEnabled && (
                  <div className="mt-4 grid gap-4 border-t border-rose-100 pt-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                        Hình thức giảm
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setField("directDiscountType", "percentage")}
                          className={`rounded-xl border py-2 text-xs font-medium transition ${
                            form.directDiscountType === "percentage"
                              ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          Theo phần trăm (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setField("directDiscountType", "fixed")}
                          className={`rounded-xl border py-2 text-xs font-medium transition ${
                            form.directDiscountType === "fixed"
                              ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          Số tiền cố định (đ)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                        Mức giảm giá
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={form.directDiscountType === "percentage" ? 100 : undefined}
                          value={form.directDiscountValue}
                          onChange={(e) => setField("directDiscountValue", e.target.value)}
                          placeholder={form.directDiscountType === "percentage" ? "VD: 20 (nghĩa là 20%)" : "VD: 50000"}
                          className="pr-12"
                        />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                          {form.directDiscountType === "percentage" ? "%" : "VNĐ"}
                        </span>
                      </div>
                      {Number(form.directDiscountValue) > 0 && Number(form.price) > 0 && (
                        <p className="mt-1 text-xs text-rose-600 font-medium">
                          Giá sau giảm:{" "}
                          {(
                            form.directDiscountType === "percentage"
                              ? Math.max(0, Math.round(Number(form.price) * (1 - Number(form.directDiscountValue) / 100)))
                              : Math.max(0, Number(form.price) - Number(form.directDiscountValue))
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Giới hạn thanh toán tại workshop"
                  hint="Số người tối đa (để trống nếu không giới hạn)"
                >
                  <Input
                    type="number"
                    min={0}
                    value={form.maxPayAtVenue}
                    onChange={(event) =>
                      setField("maxPayAtVenue", event.target.value)
                    }
                    placeholder="Không giới hạn"
                  />
                </Field>

                <Field
                  label="Giới hạn chuyển khoản QR"
                  hint="Số người tối đa (để trống nếu không giới hạn)"
                >
                  <Input
                    type="number"
                    min={0}
                    value={form.maxQrPayment}
                    onChange={(event) =>
                      setField("maxQrPayment", event.target.value)
                    }
                    placeholder="Không giới hạn"
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

            <div className="mt-4 pt-4 border-t border-[#d5ded6]">
              <button
                type="button"
                onClick={() => setShowRecurringModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#315d43] bg-white px-3 py-2.5 text-xs font-bold text-[#315d43] shadow-xs transition hover:bg-[#315d43] hover:text-white"
              >
                <Repeat className="size-3.5" />
                Tạo lịch lặp lại theo thứ (Hàng loạt)
              </button>
            </div>
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

      <RecurringScheduleModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onApply={handleApplyRecurringSchedules}
        isSubmitting={addingBulkSchedule}
        title="Tạo lịch lặp lại theo thứ cho workshop"
      />
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
