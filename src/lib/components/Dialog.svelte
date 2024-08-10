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

    const triggerBtn = triggerContainer.querySelector("button")!;

    const parentElt = dialogElt.offsetParent as HTMLElement;
    const parentRect = parentElt.getBoundingClientRect();

    // Subtract the width / height of the scrollbar while maintaining double precision
    // parentRect.width: total width of the element (including padding, borders and scrollbars)
    // offsetWidth: total width of the element again, but rounded to an integer
    // clientWidth: width of the element including padding but without borders or scrollbars
    const parentWidth = parentRect.width - (parentElt.offsetWidth - parentElt.clientWidth);
    const parentHeight = parentRect.height - (parentElt.offsetHeight - parentElt.clientHeight);

    const boundingRect = triggerBtn.getBoundingClientRect();
    // Visible space between the sides of the button and the inner border of the parent
    const topSpace = boundingRect.top - parentRect.top;
    // Special case of clientHeight (but with height: 100% on body and html, both heights are equal)
    const bottomSpace = parentHeight - (boundingRect.bottom - parentRect.top);
    const leftSpace = boundingRect.left - parentRect.left;
    const rightSpace = parentWidth - (boundingRect.right - parentRect.left);

    const horScroll = parentElt.scrollLeft;
    const vertScroll = parentElt.scrollTop;

    dialogElt.style.left = `${horScroll + leftSpace + boundingRect.width / 2}px`; // 50%
    dialogElt.style.translate = "-50%";
    arrowElt.style.left = "50%";
    arrowElt.style.translate = "-50%";

    const pos = topSpace > bottomSpace ? "top" : "bottom";

    if (pos === "top") {
      // This line almost works - just not when a horizontal scrollbar is visible
      // dialogElt.style.bottom = `calc(${parentRect.bottom - boundingRect.top - vertScroll}px + 0.4em)`;
      dialogElt.style.bottom = `calc(${parentHeight - vertScroll - topSpace}px + 0.4em`;
      dialogElt.style.transformOrigin = "50% calc(100% + 0.4em)";
      arrowElt.style.top = "100%";
      arrowElt.style.borderColor = "var(--bg) transparent transparent transparent";
    } else {
      dialogElt.style.top = `calc(${parentHeight + vertScroll - bottomSpace}px + 0.4em)`;
      dialogElt.style.transformOrigin = "50% -0.4em";
      arrowElt.style.bottom = "100%";
      arrowElt.style.borderColor = "transparent transparent var(--bg) transparent";
    }

    // Visible space to the left of the dialog
    const remLeftDialog = leftSpace + boundingRect.width / 2 - dialogElt.clientWidth / 2;
    if (remLeftDialog < 0) {
      // const remLeft = leftSpace - parentElt.scrollLeft;
      dialogElt.style.left = `${horScroll}px`;
      dialogElt.style.translate = "0";
      arrowElt.style.left = `${leftSpace + boundingRect.width / 2}px`;
      dialogElt.style.transformOrigin = `${leftSpace + boundingRect.width / 2}px ${pos === "top" ? "calc(100% + 0.4em)" : "-0.4em"}`;
    } else {
      // Visible space to the right of the dialog
      // Using clientWidth on the root element is a special case
      // and returns the width of the layout viewport
      const remRightDialog = rightSpace + boundingRect.width / 2 - dialogElt.clientWidth / 2;
      if (remRightDialog < 0) {
        dialogElt.style.left = "";
        dialogElt.style.right = `${-horScroll}px`;
        dialogElt.style.translate = "0";
        arrowElt.style.left = "";
        // The 'right' property does not take into account scroll
        arrowElt.style.right = `${rightSpace + boundingRect.width / 2}px`;
        arrowElt.style.translate = "50%";
        // transformOrigin is relative to the element box
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
