import Id from "@/js/model/Id";

class User extends Id {
  avatarUrl: string;
  email: string;
  firstName: string;
  gender: string;
  homeOrgId: number;
  lastLoggedIn: number;
  lastLoggedOut: number;
  lastName: string;
  modifiedDate: number;
  notificationEmailSendingDate: number;
  online: boolean;
  status: ("TYPING" | "OPEN" | "ONLINE" | "AWAY" | "OFFLINE");
}

export default User;
