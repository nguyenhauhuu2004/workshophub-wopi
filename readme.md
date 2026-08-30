# Hướng dẫn cài đặt và chạy dự án trên macOS

## Yêu cầu

Đảm bảo máy đã cài đặt:

- Node.js
- npm
- Git

## Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

Cài đặt các package:

```bash
npm install
```

Khởi chạy server ở môi trường development:

```bash
npm run dev
```

## Frontend

Di chuyển vào thư mục frontend:

```bash
cd frontend
```

Cài đặt các package:

```bash
npm install
```

Khởi chạy frontend ở môi trường development:

```bash
npm run dev
```

## Cấu hình API URL

Khi chạy và kiểm thử dự án trên máy local, cần cấu hình `baseURL` trong file Axios thành địa chỉ backend local.

Ví dụ:

```javascript
baseURL: "http://localhost:<PORT>";
```

Thay `<PORT>` bằng port mà backend đang sử dụng.

Khi chạy phiên bản đã deploy, đổi `baseURL` thành URL API của backend trên Render.

Ví dụ:

```javascript
baseURL: "https://your-backend-api.onrender.com";
```

Nên sử dụng biến môi trường thay vì sửa trực tiếp URL trong mã nguồn.

Ví dụ:

```javascript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
```

File `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:<PORT>
```

File `.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

## Các công nghệ và dịch vụ sử dụng

| Công nghệ/Dịch vụ | Mục đích                                 |
| ----------------- | ---------------------------------------- |
| Cloudflare        | Deploy và phân phối frontend             |
| Render            | Deploy và vận hành backend               |
| Cloudinary        | Lưu trữ và quản lý hình ảnh              |
| Goong Maps        | Cung cấp API bản đồ, địa điểm và định vị |
| Axios             | Gửi HTTP request từ frontend đến backend |
| Node.js và npm    | Chạy dự án và quản lý package            |
