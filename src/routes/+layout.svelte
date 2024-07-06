<script>
  import { onNavigate } from "$app/navigation";
  import NavBar from "components/NavBar.svelte";
  import Footer from "components/Footer.svelte";
  import "./styles.scss";
  import "./typography.scss";

  onNavigate((navigation) => {
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

<div class="app">
  <NavBar />
  <main>
    <slot />
  </main>
  <Footer />
</div>
