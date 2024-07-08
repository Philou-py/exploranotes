<script>
  import { onNavigate } from "$app/navigation";
  import NavBar from "components/NavBar.svelte";
  import Footer from "components/Footer.svelte";
  import SnackBars from "components/SnackBars.svelte";
  import "./styles.scss";
  import "./typography.scss";

  onNavigate((navigation) => {
    // https://svelte.dev/blog/view-transitions
    // @ts-expect-error
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      // @ts-expect-error
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<NavBar />
<main>
  <slot />
</main>
<Footer />
<SnackBars />
