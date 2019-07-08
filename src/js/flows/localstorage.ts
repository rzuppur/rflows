import { oc } from "ts-optchain";
import User from "@/js/model/User";


interface Session {
  token: string;
  user: User;
}

const localstorage = {
  getSession(): Session | null {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "null");
      if (session) return session;
    } catch {
      localStorage.removeItem("session");
    }
    return null;
  },

  getSessionToken(): string | null {
    const session: any = this.getSession();
    if (oc(session).token()) return session.token;
    return null;
  },

  setSessionToken(token: string | null): void {
    const session: any = this.getSession() || {};
    session.token = token;
    localStorage.setItem("session", JSON.stringify(session));
  },

  getSessionUser(): User | null {
    const session: any = this.getSession();
    if (oc(session).user()) return session.user;
    return null;
  },

  setSessionUser(user: User | null): void {
    const session: any = this.getSession() || {};
    session.user = user;
    localStorage.setItem("session", JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem("session");
  },
};

export default localstorage;
