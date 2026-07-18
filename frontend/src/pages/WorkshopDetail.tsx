import  ThumbnailSlider, { type ProductMedia }  from "@/components/thumnailslider";
import BookingCard, {
  type BookingData,
  type BookingSession,
} from "@/components/BookingCard";
import WorkshopContent from "@/components/WorkshopContent";


const sessions: BookingSession[] = [
  {
    id: 1,
    date: "2026-07-20",
    time: "09:00 - 11:00",
    remaining: 8,
  },
  {
    id: 2,
    date: "2026-07-20",
    time: "13:00 - 15:00",
    remaining: 3,
  },
  {
    id: 3,
    date: "2026-07-20",
    time: "16:00 - 18:00",
    remaining: 0,
  },
  {
    id: 4,
    date: "2026-07-21",
    time: "09:00 - 11:00",
    remaining: 10,
  },
  {
    id: 5,
    date: "2026-07-21",
    time: "14:00 - 16:00",
    remaining: 5,
  },
];

const media: ProductMedia[] = [
  {
    id: 1,
    type: "image",
    src: "https://www.mykingdom.com.vn/cdn/shop/articles/workshop-thu-cong-gia-dinh_34975b98-b042-48d7-a3c0-527ce9abab57.jpg",
    alt: "iPhone mặt trước",
  },
  {
    id: 2,
    type: "image",
    src: "https://dinos.vn/wp-content/uploads/2024/04/workshop-la-gi-1.jpg",
    alt: "iPhone mặt sau",
  },
  {
    id: 3,
    type: "video",
    src: "https://www.pexels.com/download/video/7520877/",
    poster: "https://dinos.vn/wp-content/uploads/2024/04/workshop-la-gi-1.jpg",
    alt: "Video giới thiệu iPhone",
    autoPlay: false,
    muted: true,
    loop: true,
  },
  {
    id: 1,
    type: "image",
    src: "https://www.mykingdom.com.vn/cdn/shop/articles/workshop-thu-cong-gia-dinh_34975b98-b042-48d7-a3c0-527ce9abab57.jpg",
    alt: "iPhone mặt trước",
  },
  {
    id: 2,
    type: "image",
    src: "https://dinos.vn/wp-content/uploads/2024/04/workshop-la-gi-1.jpg",
    alt: "iPhone mặt sau",
  },
  {
    id: 1,
    type: "image",
    src: "https://www.mykingdom.com.vn/cdn/shop/articles/workshop-thu-cong-gia-dinh_34975b98-b042-48d7-a3c0-527ce9abab57.jpg",
    alt: "iPhone mặt trước",
  },
  {
    id: 2,
    type: "image",
    src: "https://dinos.vn/wp-content/uploads/2024/04/workshop-la-gi-1.jpg",
    alt: "iPhone mặt sau",
  },
];


import WorkshopMap, {
  type WorkshopLocation,
} from "@/components/workshopmap";

const currentWorkshop: WorkshopLocation = {
  id: 1,
  title: "Workshop làm gốm thủ công",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  latitude: 10.7731,
  longitude: 106.7032,
  image: "/images/workshops/pottery.jpg",
  price: 500_000,
};

const nearbyWorkshops: WorkshopLocation[] = [
  {
    id: 2,
    title: "Workshop vẽ tranh acrylic",
    address: "45 Lê Lợi, Quận 1, TP.HCM",
    latitude: 10.7745,
    longitude: 106.7019,
    image: "/images/workshops/painting.jpg",
    price: 350_000,
  },
  {
    id: 3,
    title: "Workshop làm nến thơm",
    address: "80 Pasteur, Quận 1, TP.HCM",
    latitude: 10.7762,
    longitude: 106.7003,
    image: "/images/workshops/candle.jpg",
    price: 420_000,
  },
  {
    id: 4,
    title: "Workshop làm bánh",
    address: "15 Đồng Khởi, Quận 1, TP.HCM",
    latitude: 10.775,
    longitude: 106.705,
    image: "/images/workshops/baking.jpg",
    price: 600_000,
  },
];



export function WorkshopDetail() {
    
const handleBook = (booking: BookingData) => {
    console.log("Booking:", booking);

    // Gọi API hoặc chuyển sang trang checkout tại đây.
  };



    return (
        <div className="container mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-2">
                <ThumbnailSlider media={media} />
                <h1 className="text-3xl font-bold">Tiêu đề của workshop</h1>

                <p>
                    Bạn có bao giờ cảm thấy mình quá bận rộn với guồng quay công việc mà quên mất việc dành thời gian cho những sở thích cá nhân?

Hãy tạm gác lại những lo toan thường nhật để bước vào không gian của [Tên Workshop]. Đây không chỉ là một buổi học đơn thuần, mà là nơi bạn được tự do thử nghiệm, sáng tạo và kết nối với những tâm hồn đồng điệu.

Bạn sẽ nhận được gì sau buổi workshop?

Kỹ năng thực tế: Nắm vững các bước cơ bản từ [Kỹ năng 1] đến [Kỹ năng 2].

Sản phẩm cá nhân: Tự tay hoàn thiện và mang về một [Tên sản phẩm, ví dụ: bức tranh canvas/chiếc nến thơm] do chính bạn làm ra.

Trải nghiệm thư giãn: Những phút giây lắng đọng, thưởng thức trà bánh và trò chuyện cùng mọi người.

Thông tin chi tiết:

Thời gian: [Giờ, Ngày/Tháng/Năm]

Địa điểm: [Tên quán cafe/Studio + Địa chỉ]

Chi phí tham gia: [Số tiền] VNĐ/người (Đã bao gồm toàn bộ nguyên vật liệu và một phần nước).

Số lượng giới hạn: Để đảm bảo chất lượng hướng dẫn, workshop chỉ nhận tối đa [Số lượng] bạn.

[ĐĂNG KÝ NGAY TẠI ĐÂY] (Link đăng ký)

Hạn chót đăng ký: [Ngày/Tháng] (Hoặc khi đủ số lượng).
                </p>
              
                <WorkshopContent content={"contentData.content"} />


<section className="mt-10 border-t pt-8">
        <h2 className="text-2xl font-semibold">
          Vị trí workshop
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          Xem workshop hiện tại và các workshop khác ở gần đó.
        </p>

        <WorkshopMap
          currentWorkshop={currentWorkshop}
          nearbyWorkshops={nearbyWorkshops}
          className="mt-5"
          onWorkshopClick={(workshop) => {
            console.log("Workshop đã chọn:", workshop);
          }}
        />
      </section>
            </div>

                <BookingCard
                className="h-fit"
        pricePerPerson={500_000}
        sessions={sessions}
        taxRate={0.08}
        location="123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                onBook={handleBook}

      />


        </div>
    );
}