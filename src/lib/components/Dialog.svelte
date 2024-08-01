<script lang="ts">
  export let show = false;
  export let width = "";

  let triggerContainer: HTMLDivElement;
  let dialogElt: HTMLDivElement;
  let arrowElt: HTMLDivElement;

  const resize = () => {
    // Reset - very important to get correct results!
    dialogElt.style.right = "";
    arrowElt.style.right = "";
    arrowElt.style.top = "";
    arrowElt.style.bottom = "";
    dialogElt.style.top = "";
    dialogElt.style.bottom = "";
    dialogElt.style.transform = "";
    dialogElt.style.transformOrigin = "";

    const boundingRect = triggerContainer.querySelector("button")!.getBoundingClientRect();
    const topSpace = boundingRect.top;
    const bottomSpace = document.body.clientHeight - boundingRect.bottom;
    const leftSpace = boundingRect.left;
    const rightSpace = document.body.clientWidth - boundingRect.right;

    const remLeft = leftSpace + boundingRect.width / 2 - dialogElt.clientWidth / 2;

    dialogElt.style.left = `${window.scrollX + boundingRect.left + boundingRect.width / 2}px`; // 50%
    dialogElt.style.translate = "-50%";
    arrowElt.style.left = "50%";
    arrowElt.style.translate = "-50%";
    const pos = topSpace > bottomSpace ? "top" : "bottom";
    if (pos === "top") {
      dialogElt.style.bottom = `calc(${document.body.clientHeight - window.scrollY - boundingRect.top}px + 0.4em)`;
      dialogElt.style.transformOrigin = "50% calc(100% + 0.4em)";
      arrowElt.style.top = "100%";
      arrowElt.style.borderColor = "var(--bg) transparent transparent transparent";
    } else {
      dialogElt.style.top = `calc(${window.scrollY + boundingRect.bottom}px + 0.4em)`;
      dialogElt.style.transformOrigin = "50% -0.4em";
      arrowElt.style.bottom = "100%";
      arrowElt.style.borderColor = "transparent transparent var(--bg) transparent";
    }

    if (remLeft < 0) {
      dialogElt.style.left = "0";
      dialogElt.style.translate = "0";
      arrowElt.style.left = `${leftSpace + boundingRect.width / 2}px`;
      dialogElt.style.transformOrigin = `${leftSpace + boundingRect.width / 2}px ${pos === "top" ? "calc(100% + 0.4em)" : "-0.4em"}`;
    } else {
      const remRight = rightSpace + boundingRect.width / 2 - dialogElt.clientWidth / 2;
      if (remRight < 0) {
        dialogElt.style.left = "";
        dialogElt.style.right = "0";
        dialogElt.style.translate = "0";
        arrowElt.style.left = "";
        arrowElt.style.right = `${rightSpace + boundingRect.width / 2}px`;
        arrowElt.style.translate = "50%";
        dialogElt.style.transformOrigin = `${dialogElt.clientWidth - (rightSpace + boundingRect.width / 2)}px ${pos === "top" ? "calc(100% + 0.4em)" : "-0.4em"}`;
      }
    }
  };

  const toggle = () => {
    show = !show;
  };

  const hide = () => {
    show = false;
  };

  $: if (show && dialogElt && triggerContainer && arrowElt) {
    resize();
    dialogElt.addEventListener("transitionend", () => dialogElt.focus(), { once: true });
    window.addEventListener("resize", hide, { once: true });
  }
</script>

<div class="dialog" class:show bind:this={dialogElt} style:width tabindex="-1">
  <div class="arrow" bind:this={arrowElt} tabindex="-1" />
  <slot {toggle} />
</div>
<div style="display: contents;" bind:this={triggerContainer}>
  <slot name="trigger" {toggle} />
</div>

<style>
  .dialog {
    --bg: var(--primary, var(--vanilla-custard));
    position: absolute;
    z-index: 500;
    visibility: hidden;
    opacity: 0;
    box-sizing: border-box;
    max-width: 100%;
    padding: 0.5em;
    scale: 0;
    transition:
      scale 300ms,
      opacity 300ms,
      visibility 300ms;
    background-color: var(--bg);
    border-radius: 20px;
    box-shadow:
      0px 2px 1px -2px rgb(0 0 0 / 20%),
      0px 2px 2px 0px rgb(0 0 0 / 14%),
      0px 1px 5px 0px rgb(0 0 0 / 12%);
  }

  .dialog.show {
    visibility: visible;
    opacity: 1;
    scale: 1;
  }

  .arrow {
    content: "";
    position: absolute;
    border-style: solid;
    border-width: 0.4em;
  }
</style>
