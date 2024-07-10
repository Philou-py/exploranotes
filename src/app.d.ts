// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      currentUser: {
        uid: string;
        accountType: "teacher" | "student";
        email: string;
        name: string;
        verifiedEmail: boolean;
      } | undefined;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
