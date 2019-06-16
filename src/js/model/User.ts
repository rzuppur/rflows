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

export function mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      workspaceId: user.homeOrgId,
      online: user.online,
      status: user.status,
      lastLoggedIn: user.lastLoggedIn,
      lastLoggedOut: user.lastLoggedOut,
    };
  }
