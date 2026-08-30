import { useEffect, useState, type FormEvent } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { User } from "@/types/user";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/userService";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  {
    key: "displayName",
    label: "Tên hiển thị",
  },
  {
    key: "username",
    label: "Tên người dùng",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
  },
  {
    key: "phone",
    label: "Số điện thoại",
    type: "tel",
  },
];

type PersonalFormData = {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
};

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const setUser = useAuthStore((state) => state.setUser);

  const [formData, setFormData] = useState<PersonalFormData>({
    displayName: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userInfo) return;

    setFormData({
      displayName: userInfo.displayName ?? "",
      username: userInfo.username ?? "",
      email: userInfo.email ?? "",
      phone: userInfo.phone ?? "",
      bio: userInfo.bio ?? "",
    });
  }, [userInfo]);

  if (!userInfo) return null;

  const handleChange = (key: keyof PersonalFormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.displayName.trim()) {
      toast.error("Tên hiển thị không được để trống");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email không được để trống");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await userService.updateProfile(formData);

      const updatedUser = data.user ?? {
        ...userInfo,
        ...formData,
      };

      setUser(updatedUser);

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>

        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PERSONAL_FIELDS.map(({ key, label, type }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>

                <Input
                  id={key}
                  name={key}
                  type={type ?? "text"}
                  value={formData[key]}
                  onChange={(event) => handleChange(key, event.target.value)}
                  className="glass-light border-border/30"
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu</Label>

            <Textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={(event) => handleChange("bio", event.target.value)}
              className="glass-light resize-none border-border/30"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full transition-opacity hover:opacity-90 md:w-auto"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
