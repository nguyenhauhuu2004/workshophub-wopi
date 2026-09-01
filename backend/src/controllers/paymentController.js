import crypto from "node:crypto";
import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { releaseBookingSpots } from "./bookingController.js";

const DEFAULT_EXPIRATION_MS = 15 * 60 * 1000; // 15 phút

const getBankConfig = () => {
  return {
    accountNo: process.env.VIETQR_ACCOUNT_NO || "0383838383",
    accountName: process.env.VIETQR_ACCOUNT_NAME || "WOPI WORKSHOPS",
    bankBin: process.env.VIETQR_BANK_BIN || "970422", // MBBank
    bankName: process.env.VIETQR_BANK_NAME || "MBBank",
    template: process.env.VIETQR_TEMPLATE || "compact2",
    clientId: process.env.VIETQR_CLIENT_ID || "",
    apiKey: process.env.VIETQR_API_KEY || "",
  };
};

const generatePaymentReference = async () => {
  let reference = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts += 1;
    // Sinh mã ngẫu nhiên 6 ký tự hex (e.g. "WOPI A7K92M"), 16.7 triệu tổ hợp, ngắn gọn và dễ copy
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    reference = `WOPI ${randomPart}`;
    const exists = await Payment.exists({ paymentReference: reference });
    if (!exists) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    reference = `WOPI ${Date.now().toString(36).slice(-6).toUpperCase()}`;
  }

  return reference;
};

const generateVietQR = async ({ accountNo, accountName, bankBin, amount, addInfo, template, clientId, apiKey }) => {
  // QuickLink fallback chuẩn EMVCo của VietQR
  const quickLink = `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

  if (!clientId || !apiKey) {
    return {
      qrDataURL: quickLink,
      qrCode: quickLink,
    };
  }

  try {
    const response = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: {
        "x-client-id": clientId,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId: bankBin,
        amount,
        addInfo,
        format: "text",
        template,
      }),
    });

    const data = await response.json();

    if (data && data.code === "00" && data.data?.qrDataURL) {
      return {
        qrDataURL: data.data.qrDataURL,
        qrCode: data.data.qrCode || quickLink,
      };
    }

    console.warn("VietQR API returned non-00 code, falling back to QuickLink:", data);
    return {
      qrDataURL: quickLink,
      qrCode: quickLink,
    };
  } catch (err) {
    console.error("VietQR API call failed, using QuickLink fallback:", err);
    return {
      qrDataURL: quickLink,
      qrCode: quickLink,
    };
  }
};

export const createOrGetPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const { bookingId } = req.body;
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Mã booking không hợp lệ" });
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "workshop",
      select: "title thumbnail location price duration",
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (String(booking.user) !== String(userId)) {
      return res.status(403).json({ message: "Bạn không có quyền thanh toán booking này" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Đơn đặt chỗ này đã bị hủy" });
    }

    if (booking.paymentStatus === "paid" || booking.status === "confirmed") {
      return res.status(200).json({
        message: "Đơn đặt chỗ này đã được thanh toán",
        alreadyPaid: true,
        booking,
      });
    }

    const now = new Date();

    // 1. Kiểm tra xem đã có Payment pending còn hiệu lực không (Idempotency)
    const existingPayment = await Payment.findOne({
      booking: booking._id,
      status: "pending",
      expiresAt: { $gt: now },
    });

    if (existingPayment) {
      return res.status(200).json({
        message: "Lấy thông tin thanh toán hiện tại",
        payment: existingPayment,
        booking,
      });
    }

    // Đánh dấu các payment pending cũ đã hết hạn
    await Payment.updateMany(
      {
        booking: booking._id,
        status: "pending",
        expiresAt: { $lte: now },
      },
      { $set: { status: "expired" } }
    );

    // 2. Tạo Payment mới với mã tham chiếu đảm bảo duy nhất
    const bankConfig = getBankConfig();
    const paymentReference = await generatePaymentReference();

    const qrResult = await generateVietQR({
      accountNo: bankConfig.accountNo,
      accountName: bankConfig.accountName,
      bankBin: bankConfig.bankBin,
      amount: booking.grossAmount,
      addInfo: paymentReference,
      template: bankConfig.template,
      clientId: bankConfig.clientId,
      apiKey: bankConfig.apiKey,
    });

    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const paymentCode = `PAY-${timestamp}-${randomHex}`;

    const newPayment = await Payment.create({
      paymentCode,
      booking: booking._id,
      user: userId,
      amount: booking.grossAmount,
      currency: "VND",
      status: "pending",
      paymentMethod: "vietqr",
      paymentReference,
      bankAccount: {
        bankBin: bankConfig.bankBin,
        bankName: bankConfig.bankName,
        accountNo: bankConfig.accountNo,
        accountName: bankConfig.accountName,
      },
      qrCode: qrResult.qrCode,
      qrDataURL: qrResult.qrDataURL,
      expiresAt: new Date(Date.now() + DEFAULT_EXPIRATION_MS),
    });

    return res.status(201).json({
      message: "Tạo thông tin thanh toán VietQR thành công",
      payment: newPayment,
      booking,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể khởi tạo thanh toán",
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    let query = { _id: id };
    if (!mongoose.isValidObjectId(id)) {
      query = { paymentCode: id };
    }

    const payment = await Payment.findOne(query).populate({
      path: "booking",
      populate: {
        path: "workshop",
        select: "title thumbnail location price duration",
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }

    // Authorize: Chỉ chủ booking hoặc Host/Admin mới được xem
    const isOwner = String(payment.user) === String(userId);
    const isStaff = req.user.role === "admin" || req.user.role === "host";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "Bạn không có quyền xem thông tin thanh toán này" });
    }

    // Auto-expire check
    const now = new Date();
    if (payment.status === "pending" && payment.expiresAt <= now) {
      payment.status = "expired";
      await payment.save();

      if (payment.booking && payment.booking.status === "pending_payment") {
        await Booking.updateOne(
          { _id: payment.booking._id },
          { $set: { status: "cancelled", paymentStatus: "failed" } }
        );
        await releaseBookingSpots(payment.booking);
      }
    }

    return res.status(200).json({ payment });
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể lấy thông tin thanh toán",
    });
  }
};

export const getPaymentByBookingId = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Mã booking không hợp lệ" });
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "workshop",
      select: "title thumbnail location price duration",
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (String(booking.user) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập booking này" });
    }

    // Tìm payment mới nhất của booking này
    const payment = await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ message: "Chưa có thông tin thanh toán cho booking này" });
    }

    // Auto-expire check
    const now = new Date();
    if (payment.status === "pending" && payment.expiresAt <= now) {
      payment.status = "expired";
      await payment.save();

      if (booking.status === "pending_payment") {
        booking.status = "cancelled";
        booking.paymentStatus = "failed";
        await booking.save();
        await releaseBookingSpots(booking);
      }
    }

    return res.status(200).json({ payment, booking });
  } catch (error) {
    console.error("Get payment by booking error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể lấy thông tin thanh toán",
    });
  }
};

export const handlePaymentWebhook = async (req, res) => {
  try {
    // 1. Kiểm tra Webhook Secret nếu có cấu hình
    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
      if (receivedSecret !== expectedSecret) {
        return res.status(401).json({ message: "Sai chữ ký webhook" });
      }
    }

    const body = req.body || {};
    // Hỗ trợ linh hoạt cấu trúc từ VietQR Payment Confirmation / SePay / Casso / Standard bank notification
    const transferAmount = Number(body.amount || body.transferAmount || body.transactionAmount || 0);
    const content = String(body.content || body.description || body.addInfo || body.orderCode || "");

    console.log(`[PAYMENT WEBHOOK RECEIVED]: Amount: ${transferAmount}, Content: "${content}"`);

    // Tìm mã "WOPI ..." trong nội dung
    const match = content.match(/WOPI\s*[-_]?\s*([A-Z0-9]+)/i);
    if (!match) {
      return res.status(200).json({
        success: false,
        message: "Nội dung chuyển khoản không chứa mã WOPI hợp lệ, bỏ qua",
      });
    }

    const matchedRef = `WOPI ${match[1].toUpperCase()}`;
    const payment = await Payment.findOne({
      paymentReference: { $regex: new RegExp(match[1], "i") },
    }).populate("booking");

    if (!payment) {
      console.warn(`[WEBHOOK]: Không tìm thấy payment với reference: ${matchedRef}`);
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy giao dịch thanh toán tương ứng",
      });
    }

    // Idempotency: Nếu đã thanh toán rồi thì trả về thành công ngay
    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Giao dịch đã được xử lý trước đó",
        alreadyProcessed: true,
      });
    }

    // Kiểm tra số tiền
    if (transferAmount < payment.amount) {
      console.warn(`[WEBHOOK]: Số tiền không khớp. Yêu cầu: ${payment.amount}, Nhận được: ${transferAmount}`);
      return res.status(200).json({
        success: false,
        message: `Số tiền chuyển không đủ (yêu cầu ${payment.amount}, nhận ${transferAmount})`,
      });
    }

    const now = new Date();

    // Cập nhật trạng thái Payment
    payment.status = "paid";
    payment.paidAt = now;
    payment.webhookData = body;
    await payment.save();

    // Cập nhật trạng thái Booking
    if (payment.booking) {
      await Booking.updateOne(
        { _id: payment.booking._id },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            paidAt: now,
          },
        }
      );
    }

    console.log(`[PAYMENT CONFIRMED]: Payment ${payment.paymentCode} for Booking ${payment.booking?._id} confirmed.`);

    return res.status(200).json({
      success: true,
      message: "Xác nhận thanh toán thành công",
      paymentCode: payment.paymentCode,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      message: error.message ?? "Lỗi xử lý webhook thanh toán",
    });
  }
};

export const simulatePaymentSuccess = async (req, res) => {
  try {
    const { paymentId, paymentReference } = req.body;

    let query = {};
    if (paymentId) {
      query._id = paymentId;
    } else if (paymentReference) {
      query.paymentReference = paymentReference;
    } else {
      return res.status(400).json({ message: "Thiếu paymentId hoặc paymentReference" });
    }

    const payment = await Payment.findOne(query).populate("booking");
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy payment" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        message: "Giao dịch đã ở trạng thái đã thanh toán",
        payment,
      });
    }

    const now = new Date();
    payment.status = "paid";
    payment.paidAt = now;
    payment.webhookData = { simulated: true, simulatedAt: now, byUser: req.user?._id };
    await payment.save();

    if (payment.booking) {
      await Booking.updateOne(
        { _id: payment.booking._id },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            paidAt: now,
          },
        }
      );
    }

    return res.status(200).json({
      message: "Giả lập thanh toán thành công",
      payment,
    });
  } catch (error) {
    console.error("Simulate payment error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể giả lập thanh toán",
    });
  }
};

export const manualConfirmPayment = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== "admin" && userRole !== "host") {
      return res.status(403).json({ message: "Chỉ Quản trị viên hoặc Host mới có quyền này" });
    }

    const { id } = req.params;
    const { note } = req.body;

    const payment = await Payment.findById(id).populate("booking");
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy payment" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        message: "Payment đã được xác nhận thanh toán trước đó",
        payment,
      });
    }

    const now = new Date();
    payment.status = "paid";
    payment.paidAt = now;
    payment.manualConfirmedBy = req.user._id;
    payment.manualConfirmNote = String(note || "Xác nhận thủ công bởi host/admin");
    await payment.save();

    if (payment.booking) {
      await Booking.updateOne(
        { _id: payment.booking._id },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            paidAt: now,
          },
        }
      );
    }

    return res.status(200).json({
      message: "Đã xác nhận thanh toán thủ công thành công",
      payment,
    });
  } catch (error) {
    console.error("Manual confirm payment error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể xác nhận thanh toán thủ công",
    });
  }
};

export const cancelPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const payment = await Payment.findById(id).populate("booking");
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy payment" });
    }

    if (String(payment.user) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền hủy thanh toán này" });
    }

    if (payment.status === "paid") {
      return res.status(409).json({ message: "Không thể hủy giao dịch đã thanh toán thành công" });
    }

    payment.status = "cancelled";
    payment.cancelledAt = new Date();
    await payment.save();

    if (payment.booking && payment.booking.status === "pending_payment") {
      await Booking.updateOne(
        { _id: payment.booking._id },
        { $set: { status: "cancelled", paymentStatus: "failed" } }
      );
      await releaseBookingSpots(payment.booking);
    }

    return res.status(200).json({
      message: "Đã hủy thanh toán và giải phóng đặt chỗ",
      payment,
    });
  } catch (error) {
    console.error("Cancel payment error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể hủy thanh toán",
    });
  }
};
