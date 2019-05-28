import Id from "@/js/model/Id";

interface WorkspaceAccess extends Id {
  role: ("ADMIN" | "USER");
  userId: number;
  orgId: number;
}

export default WorkspaceAccess;
