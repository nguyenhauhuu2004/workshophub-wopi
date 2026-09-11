import { useEffect, useState } from "react";
import { User as UserIcon, Mail, Phone, Save } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AttendeeInfo = {
  name: string;
  email: string;
  phone: string;
};

type AttendeeInfoFormProps = {
  /** Thông tin mặc định từ user profile / defaultAttendee */
  defaultValues?: Partial<AttendeeInfo>;
  onChange: (info: AttendeeInfo, saveAsDefault: boolean) => void;
  disabled?: boolean;
};

const AttendeeInfoForm = ({
  defaultValues,
  onChange,
  disabled = false,
}: AttendeeInfoFormProps) => {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // Đồng bộ nếu defaultValues thay đổi (ví dụ khi user load xong)
  useEffect(() => {
    if (defaultValues?.name) setName(defaultValues.name);
    if (defaultValues?.email) setEmail(defaultValues.email);
    if (defaultValues?.phone) setPhone(defaultValues.phone);
  }, [defaultValues?.name, defaultValues?.email, defaultValues?.phone]);

  // Notify parent mỗi khi form thay đổi
  useEffect(() => {
    onChange({ name, email, phone }, saveAsDefault);
  }, [name, email, phone, saveAsDefault, onChange]);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Thông tin người tham dự</p>

      {/* Họ tên */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserIcon className="size-3.5" />
          Họ và tên <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className="rounded-xl"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Mail className="size-3.5" />
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled}
          className="rounded-xl"
        />
        <p className="text-[11px] text-muted-foreground">
          Vé điện tử sẽ được gửi vào email này
        </p>
      </div>

      {/* Số điện thoại */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Phone className="size-3.5" />
          Số điện thoại <span className="text-destructive">*</span>
        </label>
        <Input
          type="tel"
          placeholder="0912 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={disabled}
          className="rounded-xl"
        />
      </div>

      {/* Checkbox lưu thông tin */}
      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed p-3 transition hover:bg-muted/40">
        <input
          type="checkbox"
          checked={saveAsDefault}
          onChange={(e) => setSaveAsDefault(e.target.checked)}
          disabled={disabled}
          className="size-4 rounded accent-primary"
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Save className="size-3.5 shrink-0" />
          <span>Lưu thông tin này để dùng cho lần đặt chỗ sau</span>
        </div>
      </label>
    </div>
  );
};

export default AttendeeInfoForm;
