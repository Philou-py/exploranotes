import { PUBLIC_KEY } from "$env/static/public";
import { transporter } from "$lib/mail";
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
  event.locals.currentUser = null;
  const jwt = event.cookies.get("Auth");
  console.log(event.url.pathname, event.url.pathname.startsWith("/signup/email-verif"));
  if (!jwt) {
    return await resolve(event);
  }

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
      // if (event.url.pathname.startsWith("/signup/email-verif")) {
      //   if (verifiedEmail !== false) return Response.redirect(new URL("/", event.url), 303);
      // } else if (verifiedEmail === false) {
      //   return Response.redirect(new URL("/signup/email-verif", event.url), 303);
      // }
    } else throw new Error("JWT payload is not an object!");
  } catch (err) {
    console.log("Invalid JWT!");
    console.log(err);
  }
  return await resolve(event);
};
