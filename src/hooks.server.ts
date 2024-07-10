import { PUBLIC_KEY } from "$env/static/public";
import { transporter } from "$lib/mail";
import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

const { verify } = jwt;

transporter.verify((error) => {
  if (error) {
    console.log("Transporter error:");
    console.log(error);
  } else {
    console.log("Nodemailer is ready to send emails!");
  }
});

export const handle = async ({ event, resolve }) => {
  event.locals.currentUser = undefined;
  const jwt = event.cookies.get("Auth");

  if (jwt) {
    try {
      const payload = verify(jwt, PUBLIC_KEY, { algorithms: ["ES256"] });
      if (typeof payload === "object") {
        const { accountType, uid, email, name, verifiedEmail } = payload;
        event.locals.currentUser = {
          accountType,
          uid,
          email,
          name,
          verifiedEmail: verifiedEmail !== false,
        };
      } else {
        throw new Error("JWT payload is not an object!");
      }
    } catch (err) {
      console.log("Invalid JWT!");
    }
  }

  if (
    !(event.locals.currentUser && event.locals.currentUser.accountType === "teacher") &&
    event.url.pathname.startsWith("/teacher")
  )
    redirect(303, "/");

  return await resolve(event);
};
