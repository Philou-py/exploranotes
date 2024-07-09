import { transporter, createEmail } from "$lib/mail";

export default (name: string, email: string, verifURL: string) => {
  const verifEmail = createEmail(`
    <p>
      Bonjour ${name},
    </p>
    <p>
      Avant d’utiliser ExploraNotes, veuillez <a href="${verifURL}">confirmer votre adresse mail</a>.
    </p>
  `);

  transporter.sendMail(
    {
      from: "ExploraNotes <contact@exploranotes.fr>",
      to: email,
      subject: "Bienvenue dans ExploraNotes !",
      html: verifEmail,
    },
    (error) => {
      if (error) {
        console.log("Error upon sending verification email:");
        console.log(error);
      } else {
        console.log(`Verification email successfully sent to ${email}!`);
      }
    },
  );
};
