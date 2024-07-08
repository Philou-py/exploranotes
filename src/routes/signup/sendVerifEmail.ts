import { transporter } from "$lib/mail";

export default (name: string, email: string, verifURL: string) => {
  const verifEmail = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p>
      Bonjour ${name},
    </p>
    <p>
      Avant d’utiliser ExploraNotes, veuillez <a href="${verifURL}">confirmer votre adresse mail</a>.
    </p>
    <p>
      À bientôt !
    </p>
  </body>
</html>
    `;

  transporter.sendMail(
    {
      from: "ExploraNotes <contact@exploranotes.fr>",
      to: email,
      subject: "Bienvenue dans ExploraNotes !",
      html: verifEmail,
    },
    (error) => {
      if (error) {
        console.log("Error upon sending email:");
        console.log(error);
      } else {
        console.log(`Email successfully sent again to ${email}!`);
      }
    },
  );
};
