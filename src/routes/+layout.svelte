<script>
  import "./styles.scss";
  import "./typography.scss";
  import { onNavigate } from "$app/navigation";
  import Navigation from "components/Navigation.svelte";
  import Footer from "components/Footer.svelte";
  import Button from "components/Button.svelte";
  import ChevronDown from "svelte-material-icons/ChevronDown.svelte";
  import SnackBars from "components/SnackBars.svelte";
  import ConfirmationModal from "components/ConfirmationModal.svelte";
  import { onMount } from "svelte";
  import ButtonGroup from "components/ButtonGroup.svelte";
  import Cookies from "js-cookie";

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

  export let data;
  let sideBarOpen = data.sideBarOpen;
  let lgScreen = data.largeScreen;

  onMount(() => {
    const mql = window.matchMedia("(max-width: 960px)");
    if (!mql.matches) lgScreen = true;
    mql.addEventListener("change", (event) => {
      lgScreen = !event.matches;
      Cookies.set("LGScreen", lgScreen ? "yes" : "no");
      if (!lgScreen) Cookies.set("SBOpen", "no");
    });
  });
</script>

<Navigation currentUser={data.currentUser} bind:open={sideBarOpen} bind:clipped={lgScreen}>
  <svelte:fragment slot="teacherMenu">
    <ButtonGroup
      links={[
        ["/teacher/teachers", "Professeurs"],
        ["/teacher/students", "Élèves"],
      ]}
    >
      <Button
        variant="text"
        --primary="var(--princess-blue)"
        block
        slot="trigger"
        let:toggle
        on:click={toggle}
      >
        Mon établissement
        <ChevronDown slot="append" />
      </Button>
      <Button slot="btn" let:text variant="text" --primary="var(--turmeric)" block>{text}</Button>
    </ButtonGroup>
  </svelte:fragment>
</Navigation>

<main class:pushLeft={sideBarOpen && lgScreen}>
  <slot />
  <Footer />
</main>

<SnackBars />
<ConfirmationModal />

<style lang="scss">
  $sideBarWidth: 270px;

  main {
    transition: margin-left 300ms;

    &.pushLeft {
      margin-left: $sideBarWidth;
    }
  }
</style>
