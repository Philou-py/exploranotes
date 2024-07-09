import { createTransport } from "nodemailer";
import { OVH_EMAIL, OVH_PASSWORD, DKIM_PRIVATE_KEY } from "$env/static/private";

// https://help.ovhcloud.com/csm/fr-mx-plan-thunderbird-windows-configuration?id=kb_article_view&sysparm_article=KB0052144
// SPF: https://help.ovhcloud.com/csm/en-dns-spf-record?id=kb_article_view&sysparm_article=KB0051705
// DMARC: https://help.ovhcloud.com/csm/en-ie-dns-zone-dmarc?id=kb_article_view&sysparm_article=KB0059162
// DKIM: https://help.ovhcloud.com/csm/en-dns-zone-dkim?id=kb_article_view&sysparm_article=KB0058258
export const transporter = createTransport({
  host: "ssl0.ovh.net",
  port: 465,
  secure: true, // use TLS
  auth: {
    user: OVH_EMAIL,
    pass: OVH_PASSWORD,
  },
  dkim: {
    domainName: "exploranotes.fr",
    keySelector: "exploranotes-s1",
    privateKey: DKIM_PRIVATE_KEY,
  },
});

export const createEmail = (content: string) => {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        ${content}
        <p>
          À bientôt !
        </p>
      </body>
    </html>
  `;
};
