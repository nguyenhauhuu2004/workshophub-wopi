import type { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import {} from "@base-ui/react";
interface ProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
  const { user } = useAuthStore();
  if (!user) return;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-y-auto p-0 bg-transparent border-0 shadow-2xl">
        <div className="">
          <div className="max-w-4xl mx-auto p-4">
            {/* heading */}
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Tài khoản
              </DialogTitle>
            </DialogHeader>
          </div>
          <ProfileCard user={user} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
