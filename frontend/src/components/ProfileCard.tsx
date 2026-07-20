import type { User } from "@/types/user";
import { Card, CardContent } from "./ui/card";
import UserAvatar from "@/components/UserAvatar";
import AvatarUploader from "@/components/AvatarUploader";

interface ProfileCardProps {
  user: User;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  if (!user) return;
  return (
    <Card className="overflow-hidden p-0 h-52">
      <CardContent className="mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="relative">
          <UserAvatar
            type="profile"
            name={user.displayName}
            avatarUrl={user.avatarUrl ?? undefined}
            className="ring-4 ring-white shadow-lg"
          />
          <AvatarUploader />
          {/* todo: upload avatar */}
        </div>
        {/* user info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {user.displayName}
          </h1>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
