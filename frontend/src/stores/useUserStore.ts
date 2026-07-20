import { userService } from "@/services/userService";
import { useAuthStore, type UserState } from "./useAuthStore";
import { create } from "zustand";
import { toast } from "sonner";

export const useUserStore = create<UserState>((set, get) => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();

      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công");
    }
  },
}));
