import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  QrCode,
  Search,
  TicketCheck,
} from "lucide-react";

import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingService } from "@/services/bookingService";
import { hostService } from "@/services/hostService";

import type {
  HostBookingRow,
  HostDashboardSummary,
  HostWorkshopRow,
  PromotionCampaign,
  PromotionPackage,
} from "@/types/host";

type DashboardTab =
  | "overview"
  | "workshops"
  | "bookings"
  | "checkin"
  | "promotions";

const TABS: Array<{
  value: DashboardTab;
  label: string;
  icon: ReactNode;
}> = [
  {
    value: "overview",
    label: "Tổng quan",
    icon: <BarChart3 className="size-4" />,
  },
  {
    value: "workshops",
    label: "Workshop",
    icon: <CalendarDays className="size-4" />,
  },
  {
    value: "bookings",
    label: "Đơn đặt chỗ",
    icon: <TicketCheck className="size-4" />,
  },
  {
    value: "checkin",
    label: "Check-in",
    icon: <QrCode className="size-4" />,
  },
  {
    value: "promotions",
    label: "Quảng bá",
    icon: <Megaphone className="size-4" />,
  },
];

const EMPTY_SUMMARY: HostDashboardSummary = {
  revenue: {
    gross: 0,
    platformFee: 0,
    net: 0,
    pendingPayout: 0,
  },
  bookings: {
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    cancelled: 0,
    noShow: 0,
  },
  workshops: {
    total: 0,
    published: 0,
    draft: 0,
    upcomingSessions: 0,
    emptySessions: 0,
    lowFillSessions: 0,
  },
  revenueSeries: [],
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không hợp lệ";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function HostDashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [summary, setSummary] = useState<HostDashboardSummary>(EMPTY_SUMMARY);

  const [workshops, setWorkshops] = useState<HostWorkshopRow[]>([]);

  const [bookings, setBookings] = useState<HostBookingRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [checkInLoading, setCheckInLoading] = useState(false);

  const [ticketCode, setTicketCode] = useState("");

  const [lastCheckIn, setLastCheckIn] = useState<HostBookingRow | null>(null);

  const [workshopSearch, setWorkshopSearch] = useState("");

  const [bookingSearch, setBookingSearch] = useState("");

  const [promotionPackages, setPromotionPackages] = useState<
    PromotionPackage[]
  >([]);

  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);

  const [promotionWorkshopId, setPromotionWorkshopId] = useState("");

  const [promotionPackageCode, setPromotionPackageCode] = useState("");

  const [promotionStartAt, setPromotionStartAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [promotionLoading, setPromotionLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          dashboardData,
          workshopData,
          bookingData,
          packageData,
          campaignData,
        ] = await Promise.all([
          hostService.getDashboard(),
          hostService.getWorkshops(),
          hostService.getBookings(),
          hostService.getPromotionPackages(),
          hostService.getPromotionCampaigns(),
        ]);

        if (!active) {
          return;
        }

        setSummary(dashboardData);
        setWorkshops(workshopData);
        setBookings(bookingData);
        setPromotionPackages(packageData);
        setCampaigns(campaignData);

        if (workshopData[0]) {
          setPromotionWorkshopId(workshopData[0]._id);
        }

        if (packageData[0]) {
          setPromotionPackageCode(packageData[0].code);
        }
      } catch (error) {
        console.error("Load host dashboard error:", error);

        toast.error(
          getApiErrorMessage(error, "Không thể tải dữ liệu quản lý host"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const filteredWorkshops = useMemo(() => {
    const keyword = workshopSearch.trim().toLocaleLowerCase("vi-VN");

    if (!keyword) {
      return workshops;
    }

    return workshops.filter((workshop) =>
      workshop.title.toLocaleLowerCase("vi-VN").includes(keyword),
    );
  }, [workshops, workshopSearch]);

  const filteredBookings = useMemo(() => {
    const keyword = bookingSearch.trim().toLocaleLowerCase("vi-VN");

    if (!keyword) {
      return bookings;
    }

    return bookings.filter((booking) =>
      [
        booking.bookingCode,
        booking.attendeeName,
        booking.attendeeEmail,
        booking.workshopTitle,
      ].some((value) => value.toLocaleLowerCase("vi-VN").includes(keyword)),
    );
  }, [bookings, bookingSearch]);

  const handleCheckIn = async () => {
    const qrContent = ticketCode.trim();

    if (!qrContent || checkInLoading) {
      return;
    }

    try {
      setCheckInLoading(true);

      const result = await bookingService.checkInBooking({
        qrContent,
      });

      const checkedInBooking = result.booking;

      const workshop =
        typeof checkedInBooking.workshop === "string"
          ? null
          : checkedInBooking.workshop;

      const nextRow: HostBookingRow = {
        _id: checkedInBooking._id,
        bookingCode: checkedInBooking.bookingCode,
        attendeeName: checkedInBooking.attendeeName,
        attendeeEmail: checkedInBooking.attendeeEmail,
        workshopTitle: workshop?.title ?? "Workshop",
        sessionLabel: checkedInBooking.sessionLabel,
        quantity: checkedInBooking.quantity,
        grossAmount: checkedInBooking.grossAmount,
        paymentStatus: checkedInBooking.paymentStatus,
        status: checkedInBooking.status,
        createdAt: checkedInBooking.createdAt,
        checkedInAt: checkedInBooking.checkedInAt,
      };

      setLastCheckIn(nextRow);
      setTicketCode("");

      setBookings((current) =>
        current.map((booking) =>
          booking._id === nextRow._id ? nextRow : booking,
        ),
      );

      if (!result.alreadyCheckedIn) {
        setSummary((current) => ({
          ...current,
          bookings: {
            ...current.bookings,
            confirmed: Math.max(0, current.bookings.confirmed - 1),
            checkedIn: current.bookings.checkedIn + 1,
          },
        }));
      }

      toast.success(result.message);
    } catch (error) {
      console.error("Check-in error:", error);

      toast.error(getApiErrorMessage(error, "Không thể check-in vé này"));
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (
      !promotionWorkshopId ||
      !promotionPackageCode ||
      !promotionStartAt ||
      promotionLoading
    ) {
      return;
    }

    try {
      setPromotionLoading(true);

      const result = await hostService.createPromotionCampaign({
        workshopId: promotionWorkshopId,
        packageCode: promotionPackageCode,
        startAt: promotionStartAt,
      });

      setCampaigns((current) => [result.campaign, ...current]);
      toast.success(result.message);
    } catch (error) {
      console.error("Create promotion campaign error:", error);

      toast.error(
        getApiErrorMessage(error, "Không thể tạo chiến dịch quảng bá"),
      );
    } finally {
      setPromotionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 text-[#193a2a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#e0e7df] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6a7b70]">
              Trung tâm quản lý dành cho host
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Quản lý workshop
            </h1>

            <p className="mt-2 text-sm text-[#697a70]">
              Theo dõi workshop, đặt chỗ và check-in khách tham dự.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate("/workshops/create")}
            className="rounded-xl bg-[#214c36] text-white"
          >
            <Plus className="mr-2 size-4" />
            Tạo workshop
          </Button>
        </header>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e0e7df] bg-white p-2">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={[
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  activeTab === tab.value
                    ? "bg-[#214c36] text-white"
                    : "text-[#627269] hover:bg-[#eff4ed]",
                ].join(" ")}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[480px] items-center justify-center">
            <Loader2 className="size-9 animate-spin text-[#214c36]" />
          </div>
        ) : (
          <div className="mt-5">
            {activeTab === "overview" && <OverviewTab summary={summary} />}

            {activeTab === "workshops" && (
              <WorkshopsTab
                workshops={filteredWorkshops}
                search={workshopSearch}
                onSearchChange={setWorkshopSearch}
                onCreate={() => navigate("/workshops/create")}
                onView={(id) => navigate(`/workshops/${id}`)}
                onEdit={(id) => navigate(`/workshops/${id}/edit`)}
              />
            )}

            {activeTab === "bookings" && (
              <BookingsTab
                bookings={filteredBookings}
                search={bookingSearch}
                onSearchChange={setBookingSearch}
              />
            )}

            {activeTab === "checkin" && (
              <CheckInTab
                ticketCode={ticketCode}
                onTicketCodeChange={setTicketCode}
                loading={checkInLoading}
                lastCheckIn={lastCheckIn}
                onSubmit={handleCheckIn}
              />
            )}

            {activeTab === "promotions" && (
              <PromotionsTab
                workshops={workshops}
                packages={promotionPackages}
                campaigns={campaigns}
                selectedWorkshopId={promotionWorkshopId}
                selectedPackageCode={promotionPackageCode}
                startAt={promotionStartAt}
                loading={promotionLoading}
                onWorkshopChange={setPromotionWorkshopId}
                onPackageChange={setPromotionPackageCode}
                onStartAtChange={setPromotionStartAt}
                onCreate={handleCreatePromotion}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function OverviewTab({ summary }: { summary: HostDashboardSummary }) {
  const maxRevenue = Math.max(
    ...summary.revenueSeries.map((item) => item.gross),
    1,
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CircleDollarSign />}
          label="Doanh thu đã thu"
          value={formatMoney(summary.revenue.gross)}
          helper={`Thực nhận ${formatMoney(summary.revenue.net)}`}
        />

        <StatCard
          icon={<TicketCheck />}
          label="Đơn đặt chỗ"
          value={String(summary.bookings.total)}
          helper={`${summary.bookings.confirmed} đã xác nhận`}
        />

        <StatCard
          icon={<BadgeCheck />}
          label="Đã check-in"
          value={String(summary.bookings.checkedIn)}
          helper={`${summary.bookings.noShow} vắng mặt`}
        />

        <StatCard
          icon={<CalendarDays />}
          label="Workshop đang mở"
          value={String(summary.workshops.published)}
          helper={`${summary.workshops.upcomingSessions} lịch sắp tới`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-3xl border border-[#e0e7df] bg-white p-6">
          <h2 className="text-xl font-bold">Doanh thu theo tháng</h2>

          <p className="mt-1 text-sm text-[#718078]">
            Chỉ tính những booking đã thanh toán.
          </p>

          <div className="mt-8 flex min-h-64 items-end gap-3 overflow-x-auto">
            {summary.revenueSeries.map((item) => (
              <div
                key={item.label}
                className="flex min-w-14 flex-1 flex-col items-center"
              >
                <div className="flex h-48 w-full items-end justify-center gap-1">
                  <div
                    className="w-4 rounded-t bg-[#b8cab9]"
                    style={{
                      height: `${Math.max(
                        4,
                        (item.gross / maxRevenue) * 100,
                      )}%`,
                    }}
                    title={`Gộp: ${formatMoney(item.gross)}`}
                  />

                  <div
                    className="w-4 rounded-t bg-[#214c36]"
                    style={{
                      height: `${Math.max(4, (item.net / maxRevenue) * 100)}%`,
                    }}
                    title={`Thực nhận: ${formatMoney(item.net)}`}
                  />
                </div>

                <span className="mt-3 text-xs text-[#718078]">
                  {item.label}
                </span>
              </div>
            ))}

            {!summary.revenueSeries.length && (
              <p className="m-auto text-sm text-[#718078]">
                Chưa có dữ liệu doanh thu.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <AlertCard
            title="Buổi chưa có khách"
            value={summary.workshops.emptySessions}
            description="Các lịch sắp tới chưa có booking."
            tone="danger"
          />

          <AlertCard
            title="Buổi lấp đầy thấp"
            value={summary.workshops.lowFillSessions}
            description="Các lịch có tỷ lệ đặt chỗ dưới 30%."
            tone="warning"
          />

          <AlertCard
            title="Tiền chờ đối soát"
            value={formatMoney(summary.revenue.pendingPayout)}
            description="Tiền đã thu nhưng chưa thanh toán cho host."
            tone="normal"
          />
        </div>
      </section>
    </div>
  );
}

type WorkshopsTabProps = {
  workshops: HostWorkshopRow[];
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
};

function WorkshopsTab({
  workshops,
  search,
  onSearchChange,
  onCreate,
  onView,
  onEdit,
}: WorkshopsTabProps) {
  return (
    <section className="rounded-3xl border border-[#e0e7df] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#e7ece6] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Danh sách workshop</h2>

          <p className="mt-1 text-sm text-[#718078]">
            Theo dõi lịch, sức chứa và doanh thu.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718078]" />

            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm workshop"
              className="w-56 pl-9"
            />
          </div>

          <Button type="button" onClick={onCreate} className="bg-[#214c36]">
            <Plus className="mr-2 size-4" />
            Tạo mới
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#f7f9f6] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-5 py-4">Workshop</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Lịch gần nhất</th>
              <th className="px-5 py-4">Lấp đầy</th>
              <th className="px-5 py-4">Đơn</th>
              <th className="px-5 py-4">Doanh thu</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0ec]">
            {workshops.map((workshop) => (
              <tr key={workshop._id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        workshop.thumbnail?.url ?? "/placeholderWorkshop.jpg"
                      }
                      alt={workshop.title}
                      className="size-12 rounded-xl object-cover"
                    />

                    <div>
                      <p className="font-semibold text-[#263c30]">
                        {workshop.title}
                      </p>

                      <p className="mt-1 text-xs text-[#718078]">
                        {workshop.categories.join(", ")}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={workshop.status} />
                </td>

                <td className="px-5 py-4">
                  {workshop.nextSession ? (
                    <>
                      <p>{formatDateTime(workshop.nextSession.startAt)}</p>

                      <p className="mt-1 text-xs text-[#718078]">
                        Còn {workshop.nextSession.spotsLeft} /{" "}
                        {workshop.nextSession.seatsTotal} chỗ
                      </p>
                    </>
                  ) : (
                    <span className="text-[#718078]">Chưa có lịch</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <Occupancy value={workshop.occupancyRate} />
                </td>

                <td className="px-5 py-4 font-semibold">
                  {workshop.totalBookings}
                </td>

                <td className="px-5 py-4 font-semibold">
                  {formatMoney(workshop.totalRevenue)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(workshop._id)}
                      className="rounded-lg border p-2 hover:bg-[#f1f5ef]"
                      aria-label="Xem workshop"
                    >
                      <Eye className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(workshop._id)}
                      className="rounded-lg border p-2 hover:bg-[#f1f5ef]"
                      aria-label="Chỉnh sửa workshop"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!workshops.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center text-[#718078]"
                >
                  Chưa có workshop phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type BookingsTabProps = {
  bookings: HostBookingRow[];
  search: string;
  onSearchChange: (value: string) => void;
};

function BookingsTab({ bookings, search, onSearchChange }: BookingsTabProps) {
  return (
    <section className="rounded-3xl border border-[#e0e7df] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#e7ece6] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Đơn đặt chỗ</h2>

          <p className="mt-1 text-sm text-[#718078]">
            Theo dõi thanh toán và trạng thái tham dự.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718078]" />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Mã đơn, khách hàng..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-[#f7f9f6] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-5 py-4">Mã đơn</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Workshop</th>
              <th className="px-5 py-4">Số lượng</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Thanh toán</th>
              <th className="px-5 py-4">Tham dự</th>
              <th className="px-5 py-4">Ngày đặt</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0ec]">
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-5 py-4 font-semibold">
                  {booking.bookingCode}
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium">{booking.attendeeName}</p>

                  <p className="mt-1 text-xs text-[#718078]">
                    {booking.attendeeEmail}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium">{booking.workshopTitle}</p>

                  <p className="mt-1 text-xs text-[#718078]">
                    {booking.sessionLabel}
                  </p>
                </td>

                <td className="px-5 py-4">{booking.quantity}</td>

                <td className="px-5 py-4 font-semibold">
                  {formatMoney(booking.grossAmount)}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={booking.paymentStatus} />
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={booking.status} />
                </td>

                <td className="px-5 py-4 text-[#66766d]">
                  {formatDateTime(booking.createdAt)}
                </td>
              </tr>
            ))}

            {!bookings.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center text-[#718078]"
                >
                  Chưa có đơn đặt chỗ phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type CheckInTabProps = {
  ticketCode: string;
  onTicketCodeChange: (value: string) => void;
  loading: boolean;
  lastCheckIn: HostBookingRow | null;
  onSubmit: () => void;
};

function CheckInTab({
  ticketCode,
  onTicketCodeChange,
  loading,
  lastCheckIn,
  onSubmit,
}: CheckInTabProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-3xl border border-[#e0e7df] bg-white p-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#edf4e9]">
          <QrCode className="size-7 text-[#214c36]" />
        </div>

        <h2 className="mt-5 text-2xl font-bold">Check-in khách tham dự</h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-[#718078]">
          Nhập mã booking hoặc dán nội dung QR có dạng WOPY_CHECKIN:BK-...
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Input
            value={ticketCode}
            onChange={(event) => onTicketCodeChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            placeholder="Quét hoặc nhập mã vé"
            className="h-12"
          />

          <Button
            type="button"
            disabled={loading || !ticketCode.trim()}
            onClick={onSubmit}
            className="h-12 bg-[#214c36] px-6"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <BadgeCheck className="mr-2 size-4" />
            )}
            Xác nhận check-in
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[#cdd8cf] bg-[#f7faf6] p-5">
          <h3 className="font-semibold">Quy tắc kiểm tra</h3>

          <ul className="mt-3 space-y-2 text-sm text-[#66766d]">
            <li>• Vé phải thuộc workshop của host.</li>
            <li>• Booking phải ở trạng thái đã xác nhận.</li>
            <li>• Check-in sẽ xác nhận thanh toán tại địa điểm.</li>
            <li>• Mỗi booking chỉ được check-in một lần.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e0e7df] bg-white p-6">
        <h2 className="text-xl font-bold">Kết quả gần nhất</h2>

        {lastCheckIn ? (
          <div className="mt-5">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-7 text-emerald-700" />
            </div>

            <p className="mt-4 text-lg font-bold">Check-in thành công</p>

            <dl className="mt-5 space-y-4 text-sm">
              <InfoRow label="Khách" value={lastCheckIn.attendeeName} />
              <InfoRow label="Mã đơn" value={lastCheckIn.bookingCode} />
              <InfoRow label="Workshop" value={lastCheckIn.workshopTitle} />
              <InfoRow label="Lịch" value={lastCheckIn.sessionLabel} />
              <InfoRow label="Số khách" value={String(lastCheckIn.quantity)} />
            </dl>
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center text-center text-[#718078]">
            <QrCode className="size-12 opacity-30" />

            <p className="mt-3 text-sm">
              Chưa có lượt check-in nào trong phiên này.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type PromotionsTabProps = {
  workshops: HostWorkshopRow[];
  packages: PromotionPackage[];
  campaigns: PromotionCampaign[];
  selectedWorkshopId: string;
  selectedPackageCode: string;
  startAt: string;
  loading: boolean;
  onWorkshopChange: (value: string) => void;
  onPackageChange: (value: string) => void;
  onStartAtChange: (value: string) => void;
  onCreate: () => void;
};

function PromotionsTab({
  workshops,
  packages,
  campaigns,
  selectedWorkshopId,
  selectedPackageCode,
  startAt,
  loading,
  onWorkshopChange,
  onPackageChange,
  onStartAtChange,
  onCreate,
}: PromotionsTabProps) {
  const selectedPackage = packages.find(
    (item) => item.code === selectedPackageCode,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#e0e7df] bg-white p-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100">
          <Megaphone className="size-7 text-amber-700" />
        </div>

        <h2 className="mt-5 text-2xl font-bold">Quảng bá workshop</h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
          Đây là chế độ thanh toán giả lập. Campaign được xem là đã thanh toán
          ngay sau khi tạo và sẽ chạy theo ngày bắt đầu đã chọn.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {packages.map((item) => {
            const selected = item.code === selectedPackageCode;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onPackageChange(item.code)}
                className={[
                  "rounded-2xl border p-5 text-left transition",
                  selected
                    ? "border-[#214c36] bg-[#f1f6ef] ring-2 ring-[#214c36]/10"
                    : "border-[#e0e7df] hover:border-[#9caf9f]",
                ].join(" ")}
              >
                <p className="font-bold">{item.name}</p>

                <p className="mt-2 text-2xl font-black">
                  {formatMoney(item.price)}
                </p>

                <p className="mt-1 text-xs text-[#718078]">
                  {item.durationDays} ngày · {item.placement}
                </p>

                <p className="mt-4 text-sm leading-6 text-[#66766d]">
                  {item.description}
                </p>
              </button>
            );
          })}

          {!packages.length && (
            <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-[#718078]">
              Chưa có gói quảng bá. Hãy chạy script seed package ở backend.
            </div>
          )}
        </div>

        <div className="mt-7 grid gap-4 rounded-2xl bg-[#f7f9f6] p-5 md:grid-cols-3">
          <label className="text-sm font-semibold">
            Workshop
            <select
              value={selectedWorkshopId}
              onChange={(event) => onWorkshopChange(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-white px-3 font-normal"
            >
              <option value="">Chọn workshop</option>

              {workshops
                .filter((workshop) => workshop.status === "published")
                .map((workshop) => (
                  <option key={workshop._id} value={workshop._id}>
                    {workshop.title}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            Ngày bắt đầu
            <Input
              type="date"
              value={startAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => onStartAtChange(event.target.value)}
              className="mt-2 bg-white font-normal"
            />
          </label>

          <div className="flex items-end">
            <Button
              type="button"
              disabled={
                loading || !selectedPackage || !selectedWorkshopId || !startAt
              }
              onClick={onCreate}
              className="h-11 w-full bg-[#214c36]"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Kích hoạt giả lập
              {selectedPackage
                ? ` · ${formatMoney(selectedPackage.price)}`
                : ""}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e0e7df] bg-white">
        <div className="border-b border-[#e7ece6] p-5">
          <h2 className="text-xl font-bold">Chiến dịch đã mua</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-[#f7f9f6] text-xs uppercase tracking-wide text-[#708078]">
              <tr>
                <th className="px-5 py-4">Workshop</th>
                <th className="px-5 py-4">Gói</th>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4">Chi phí</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Hiển thị</th>
                <th className="px-5 py-4">Nhấp</th>
                <th className="px-5 py-4">Booking</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf0ec]">
              {campaigns.map((campaign) => (
                <tr key={campaign._id}>
                  <td className="px-5 py-4 font-semibold">
                    {campaign.workshopTitle}
                  </td>
                  <td className="px-5 py-4">{campaign.packageName}</td>
                  <td className="px-5 py-4">
                    <p>{formatDateTime(campaign.startAt)}</p>
                    <p className="mt-1 text-xs text-[#718078]">
                      đến {formatDateTime(campaign.endAt)}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {formatMoney(campaign.price)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={campaign.status} />
                  </td>
                  <td className="px-5 py-4">{campaign.impressions}</td>
                  <td className="px-5 py-4">{campaign.clicks}</td>
                  <td className="px-5 py-4">{campaign.attributedBookings}</td>
                </tr>
              ))}

              {!campaigns.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-[#718078]"
                  >
                    Chưa có chiến dịch quảng bá.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
};

function StatCard({ icon, label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-[#e0e7df] bg-white p-5 shadow-sm">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#edf4e9] text-[#214c36]">
        {icon}
      </div>

      <p className="mt-5 text-sm font-medium text-[#718078]">{label}</p>

      <p className="mt-1 text-2xl font-black">{value}</p>

      <p className="mt-2 text-xs text-[#718078]">{helper}</p>
    </article>
  );
}

type AlertCardProps = {
  title: string;
  value: number | string;
  description: string;
  tone: "danger" | "warning" | "normal";
};

function AlertCard({ title, value, description, tone }: AlertCardProps) {
  const toneClass = {
    danger: "bg-red-50 text-red-700",
    warning: "bg-amber-50 text-amber-700",
    normal: "bg-[#edf4e9] text-[#214c36]",
  }[tone];

  return (
    <article className="rounded-3xl border border-[#e0e7df] bg-white p-5">
      <span
        className={`inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${toneClass}`}
      >
        Cần chú ý
      </span>

      <p className="mt-4 text-sm font-semibold">{title}</p>

      <p className="mt-1 text-3xl font-black">{value}</p>

      <p className="mt-2 text-sm leading-6 text-[#718078]">{description}</p>
    </article>
  );
}

function Occupancy({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="w-28">
      <span className="text-xs">{normalized}%</span>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8ede8]">
        <div
          className={[
            "h-full rounded-full",
            normalized === 0
              ? "bg-red-400"
              : normalized < 30
                ? "bg-amber-400"
                : "bg-[#214c36]",
          ].join(" ")}
          style={{
            width: `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    draft: "Bản nháp",
    published: "Đang mở bán",
    archived: "Đã lưu trữ",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    pending_payment: "Chờ thanh toán",
    confirmed: "Đã xác nhận",
    checked_in: "Đã check-in",
    no_show: "Vắng mặt",
    refunded: "Đã hoàn tiền",
    partially_refunded: "Hoàn một phần",
    unpaid: "Chưa thanh toán",
    pending: "Đang xử lý",
    paid: "Đã thanh toán",
    failed: "Thất bại",
    available: "Có thể rút",
    held: "Tạm giữ",
    scheduled: "Đã lên lịch",
    active: "Đang chạy",
  };

  const className =
    value === "published" ||
    value === "paid" ||
    value === "checked_in" ||
    value === "available" ||
    value === "active"
      ? "bg-emerald-100 text-emerald-700"
      : value === "cancelled" || value === "failed" || value === "no_show"
        ? "bg-red-100 text-red-700"
        : value === "pending" ||
            value === "pending_payment" ||
            value === "scheduled"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {labels[value] ?? value}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf0ec] pb-3">
      <dt className="text-[#718078]">{label}</dt>

      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
