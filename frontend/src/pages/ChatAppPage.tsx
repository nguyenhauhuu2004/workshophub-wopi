import Logout from "@/components/auth/Logout";
import { useAuthStore } from "@/stores/useAuthStore";

const ChatAppPage = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      {user?.username}
      <Logout />
      <img className="h-auto max-w-full rounded-4xl" src="IMG_7919.jpeg" alt="image description" />
    </div>
  );
};

export default ChatAppPage;
