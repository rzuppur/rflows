import Id from "@/js/model/Id";

interface Workspace extends Id {
  name: string;
  logoUrl: string;
  type: ("PUBLIC" | "HOME" | "SHARED");
}

export default Workspace;
