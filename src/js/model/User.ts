import Id from "@/js/model/Id";

interface User extends Id {
  avatarUrl: string;
  email: string;
  firstName: string;
  workspaceId: number;
  lastLoggedIn: number;
  lastLoggedOut: number;
  lastName: string;
  online: boolean;
  status: ("TYPING" | "OPEN" | "ONLINE" | "AWAY" | "OFFLINE");
}

export default User;
