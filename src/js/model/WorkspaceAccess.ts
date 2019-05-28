import Id from "@/js/model/Id";

interface WorkspaceAccess extends Id {
  role: ("ADMIN" | "USER");
  userId: number;
  workspaceId: number;
}

export default WorkspaceAccess;
