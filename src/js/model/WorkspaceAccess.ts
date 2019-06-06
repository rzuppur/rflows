import Id from "@/js/model/Id";

interface WorkspaceAccess extends Id {
  role: ("ADMIN" | "USER");
  userId: number;
  workspaceId: number;
}

export default WorkspaceAccess;

export function mapWorkspaceAccess(workspaceAccess: any): WorkspaceAccess {
  return {
    id: workspaceAccess.id,
    role: workspaceAccess.role,
    workspaceId: workspaceAccess.orgId,
    userId: workspaceAccess.userId,
  };
}
