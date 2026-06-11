import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      labId: string;
      labName: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    labId: string;
    labName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    labId: string;
    labName: string;
  }
}
