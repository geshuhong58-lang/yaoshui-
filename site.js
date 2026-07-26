/* 关键模块：目录搜索与分类筛选。脚本不存在时，所有游戏仍可正常访问。 */
(() => {
  const searchInput = document.querySelector("[data-game-search]");
  const gameItems = [...document.querySelectorAll("[data-game-item]")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const resultCount = document.querySelector("[data-result-count]");
  const resultLabel = document.querySelector("[data-result-label]");
  const emptyState = document.querySelector("[data-empty-state]");
  let activeFilter = "all";

  const updateCatalog = () => {
    if (!gameItems.length) return;

    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleItems = 0;

    gameItems.forEach((item) => {
      const matchesSearch = item.dataset.title.includes(query);
      const itemGenres = item.dataset.genre.split(/\s+/).filter(Boolean);
      const matchesFilter = activeFilter === "all" || itemGenres.includes(activeFilter);
      const isVisible = matchesSearch && matchesFilter;

      item.hidden = !isVisible;
      if (isVisible) visibleItems += 1;
    });

    if (resultCount) resultCount.textContent = String(visibleItems);
    if (resultLabel) resultLabel.textContent = visibleItems === 1 ? "title" : "titles";
    if (emptyState) emptyState.hidden = visibleItems !== 0;
  };

  if (searchInput) {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialGenre = params.get("genre");
    if (initialQuery) searchInput.value = initialQuery;

    if (initialGenre) {
      const matchingButton = filterButtons.find((button) => button.dataset.filter === initialGenre);
      if (matchingButton) {
        activeFilter = initialGenre;
        filterButtons.forEach((button) => {
          const isActive = button === matchingButton;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
      }
    }

    searchInput.addEventListener("input", updateCatalog);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      updateCatalog();
    });
  });

  updateCatalog();
})();

/* 关键模块：Steam 式媒体滑动区，支持缩略图、前后按钮、键盘和手机横向手势。 */
(() => {
  document.querySelectorAll("[data-media-gallery]").forEach((gallery) => {
    const slides = [...gallery.querySelectorAll("[data-media-slide]")];
    const thumbnails = [...gallery.querySelectorAll("[data-media-thumb]")];
    const previousButton = gallery.querySelector("[data-media-previous]");
    const nextButton = gallery.querySelector("[data-media-next]");
    const currentNumber = gallery.querySelector("[data-media-current]");
    const stage = gallery.querySelector("[data-media-stage]");
    let activeIndex = 0;
    let touchStartX = null;

    if (!slides.length || slides.length !== thumbnails.length) return;

    const showSlide = (requestedIndex, shouldScrollThumbnail = true) => {
      activeIndex = (requestedIndex + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.hidden = !isActive;
        slide.classList.toggle("is-active", isActive);

        const video = slide.querySelector("video");
        if (video && !isActive) video.pause();
      });

      thumbnails.forEach((thumbnail, index) => {
        const isActive = index === activeIndex;
        thumbnail.classList.toggle("is-active", isActive);
        thumbnail.setAttribute("aria-selected", String(isActive));
      });

      if (currentNumber) currentNumber.textContent = String(activeIndex + 1).padStart(2, "0");
      if (shouldScrollThumbnail) {
        thumbnails[activeIndex].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    };

    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener("click", () => showSlide(index));
    });

    previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
    nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));

    gallery.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });

    stage?.addEventListener(
      "touchstart",
      (event) => {
        if (event.target.closest("video")) return;
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true }
    );

    stage?.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
        const distance = touchEndX - touchStartX;
        touchStartX = null;
        if (Math.abs(distance) < 45) return;
        showSlide(activeIndex + (distance < 0 ? 1 : -1));
      },
      { passive: true }
    );

    showSlide(0, false);
  });
})();

/* 关键模块：悬停视频预览预留接口。只有 data-preview 有地址时才加载视频。 */
(() => {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!canHover.matches) return;

  document.querySelectorAll(".preview-host[data-preview]").forEach((host) => {
    const videoUrl = host.dataset.preview.trim();
    const video = host.querySelector(".preview-video");
    if (!videoUrl || !video) return;

    const startPreview = async () => {
      if (!video.src) {
        video.src = videoUrl;
        video.load();
      }

      try {
        await video.play();
        host.classList.add("is-previewing");
      } catch {
        host.classList.remove("is-previewing");
      }
    };

    const stopPreview = () => {
      video.pause();
      video.currentTime = 0;
      host.classList.remove("is-previewing");
    };

    host.addEventListener("pointerenter", startPreview);
    host.addEventListener("pointerleave", stopPreview);
    host.addEventListener("focusin", startPreview);
    host.addEventListener("focusout", stopPreview);
  });
})();
