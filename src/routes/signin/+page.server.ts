export const load = ({ request }) => {
  console.log(request.headers.get("Referer"));
};
