import api from "@/lib/axios";

export type UpdateProfilePayload = {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
};

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.messsage);
    }

    return res.data;
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch("/users/profile", payload);

    return data;
  },
};
