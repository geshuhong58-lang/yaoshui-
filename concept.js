/* 关键模块：媒体数据只引用 OpenNice 已有的本地官方素材，避免外部图库和额外请求。 */
const mediaItems = [
  { type: "video", label: "Official launch trailer" },
  { type: "image", label: "Luna Snow", src: "assets/marvel-rivals/screenshot-01.jpg" },
  { type: "image", label: "Team play", src: "assets/marvel-rivals/screenshot-02.jpg" },
  { type: "image", label: "Rivalry", src: "assets/marvel-rivals/screenshot-03.jpg" },
  { type: "image", label: "Arena", src: "assets/marvel-rivals/screenshot-04.jpg" },
  { type: "image", label: "Combat", src: "assets/marvel-rivals/screenshot-05.jpg" },
  { type: "image", label: "Heroes", src: "assets/marvel-rivals/screenshot-06.jpg" }
];

const storageKey = "opennice-saved-games";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero");
const heroImage = document.querySelector("#heroImage");
const heroVideo = document.querySelector("#heroVideo");
const heroVideoSource = document.querySelector("#heroVideoSource");
const playTrailerButton = document.querySelector("#playTrailerButton");
const trailerButtonLabel = document.querySelector("#trailerButtonLabel");
const currentSlideLabel = document.querySelector("#currentSlideLabel");
const mediaStatus = document.querySelector("#mediaStatus");
const galleryProgress = document.querySelector("#galleryProgress");
const thumbnailButtons = [...document.querySelectorAll("[data-media-index]")];
const dotButtons = [...document.querySelectorAll("[data-dot-index]")];
const heroFavorite = document.querySelector("#heroFavorite");
const cardSaveButtons = [...document.querySelectorAll("[data-save-game]")];
const savedCount = document.querySelector("#savedCount");
const searchInput = document.querySelector("#game-search");
const clearSearch = document.querySelector("#clearSearch");
const gameCards = [...document.querySelectorAll(".game-card")];
const visibleGameCount = document.querySelector("#visibleGameCount");
const emptyState = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");
const topbar = document.querySelector(".topbar");

let currentMediaIndex = 3;
let galleryTimer = null;
let toastTimer = null;
let currentCategory = "all";
let savedGames = readSavedGames();
let pointerStartX = 0;

/* 关键模块：安全读取收藏；即使浏览器禁用存储，也不会破坏页面。 */
function readSavedGames() {
  try {
    const storedValue = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(storedValue) ? storedValue : []);
  } catch {
    return new Set();
  }
}

function writeSavedGames() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...savedGames]));
  } catch {
    // 本地概念稿在隐私模式下仍可运行，只是不保存到下次访问。
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function formatIndex(index) {
  return String(index + 1).padStart(2, "0");
}

function setTrailerButtonState(isPlaying) {
  playTrailerButton.setAttribute("aria-pressed", String(isPlaying));
  trailerButtonLabel.textContent = isPlaying ? "Pause trailer" : "Play trailer";
}

/* 关键模块：首屏不下载大视频，只有用户主动播放时才注入视频地址。 */
function ensureVideoLoaded() {
  if (heroVideoSource.src) {
    return;
  }
  heroVideoSource.src = heroVideoSource.dataset.src;
  heroVideo.load();
}

function restartGalleryProgress() {
  galleryProgress.classList.remove("is-running");
  void galleryProgress.offsetWidth;

  if (prefersReducedMotion.matches || document.hidden || currentMediaIndex === 0) {
    return;
  }
  galleryProgress.classList.add("is-running");
}

/* 关键模块：统一处理视频、图片、缩略图和分页点的联动状态。 */
function selectMedia(index, options = {}) {
  const normalizedIndex = (index + mediaItems.length) % mediaItems.length;
  const media = mediaItems[normalizedIndex];
  currentMediaIndex = normalizedIndex;
  currentSlideLabel.textContent = formatIndex(normalizedIndex);
  mediaStatus.textContent =
    media.type === "video" ? media.label : `${media.label} · Screenshot ${normalizedIndex}`;

  thumbnailButtons.forEach((button, buttonIndex) => {
    const isCurrent = buttonIndex === normalizedIndex;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "true");
      button.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "nearest" });
    } else {
      button.removeAttribute("aria-current");
    }
  });

  dotButtons.forEach((button, buttonIndex) => {
    const isCurrent = buttonIndex === normalizedIndex;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (media.type === "video") {
    ensureVideoLoaded();
    heroImage.hidden = true;
    heroVideo.classList.add("is-active");
    const playPromise = heroVideo.play();
    if (playPromise) {
      playPromise
        .then(() => setTrailerButtonState(true))
        .catch(() => setTrailerButtonState(false));
    }
  } else {
    heroVideo.pause();
    heroVideo.classList.remove("is-active");
    heroImage.hidden = false;
    heroImage.classList.add("is-switching");

    const revealImage = () => {
      heroImage.classList.remove("is-switching");
    };

    if (heroImage.src.endsWith(media.src)) {
      revealImage();
    } else {
      heroImage.addEventListener("load", revealImage, { once: true });
      heroImage.src = media.src;
    }

    setTrailerButtonState(false);
  }

  if (!options.fromTimer) {
    restartGalleryTimer();
  } else {
    restartGalleryProgress();
  }
}

function startGalleryTimer() {
  window.clearInterval(galleryTimer);
  restartGalleryProgress();
  if (prefersReducedMotion.matches || document.hidden || currentMediaIndex === 0) {
    return;
  }

  galleryTimer = window.setInterval(() => {
    const nextImageIndex = currentMediaIndex >= mediaItems.length - 1 ? 1 : currentMediaIndex + 1;
    selectMedia(nextImageIndex, { fromTimer: true });
  }, 7200);
}

function restartGalleryTimer() {
  startGalleryTimer();
}

thumbnailButtons.forEach((button) => {
  button.addEventListener("click", () => selectMedia(Number(button.dataset.mediaIndex)));
});

dotButtons.forEach((button) => {
  button.addEventListener("click", () => selectMedia(Number(button.dataset.dotIndex)));
});

document.querySelector("#previousMedia").addEventListener("click", () => selectMedia(currentMediaIndex - 1));
document.querySelector("#nextMedia").addEventListener("click", () => selectMedia(currentMediaIndex + 1));

playTrailerButton.addEventListener("click", () => {
  if (currentMediaIndex !== 0) {
    selectMedia(0);
    return;
  }

  if (heroVideo.paused) {
    ensureVideoLoaded();
    heroVideo.play().then(() => setTrailerButtonState(true)).catch(() => setTrailerButtonState(false));
  } else {
    heroVideo.pause();
    setTrailerButtonState(false);
  }
});

heroVideo.addEventListener("play", () => setTrailerButtonState(true));
heroVideo.addEventListener("pause", () => setTrailerButtonState(false));

hero.addEventListener("pointerenter", () => {
  hero.classList.add("is-gallery-paused");
  window.clearInterval(galleryTimer);
});
hero.addEventListener("pointerleave", () => {
  hero.classList.remove("is-gallery-paused");
  startGalleryTimer();
});
hero.addEventListener("pointerdown", (event) => {
  pointerStartX = event.clientX;
});
hero.addEventListener("pointerup", (event) => {
  const travel = event.clientX - pointerStartX;
  if (Math.abs(travel) < 56) {
    return;
  }
  selectMedia(currentMediaIndex + (travel < 0 ? 1 : -1));
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(galleryTimer);
    heroVideo.pause();
  } else {
    startGalleryTimer();
  }
});

prefersReducedMotion.addEventListener?.("change", startGalleryTimer);

/* 关键模块：收藏状态在主视觉按钮、卡片按钮和计数器之间保持同步。 */
function syncSavedState() {
  const marvelIsSaved = savedGames.has("Marvel Rivals");
  heroFavorite.setAttribute("aria-pressed", String(marvelIsSaved));
  heroFavorite.querySelector("span").textContent = marvelIsSaved ? "Saved" : "Save";

  cardSaveButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(savedGames.has(button.dataset.saveGame)));
  });

  savedCount.textContent = String(savedGames.size);
  savedCount.setAttribute("aria-label", `${savedGames.size} saved ${savedGames.size === 1 ? "game" : "games"}`);
}

function toggleSavedGame(gameName) {
  const shouldSave = !savedGames.has(gameName);
  if (shouldSave) {
    savedGames.add(gameName);
  } else {
    savedGames.delete(gameName);
  }
  writeSavedGames();
  syncSavedState();
  filterGames();
  showToast(shouldSave ? `${gameName} saved to your library.` : `${gameName} removed from saved games.`);
}

heroFavorite.addEventListener("click", () => toggleSavedGame("Marvel Rivals"));

cardSaveButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSavedGame(button.dataset.saveGame);
  });
});

/* 关键模块：搜索、分类和收藏筛选共用一套过滤逻辑。 */
function filterGames() {
  const query = searchInput.value.trim().toLowerCase();
  clearSearch.hidden = query.length === 0;
  let visibleCards = 0;

  gameCards.forEach((card) => {
    const categories = card.dataset.category.split(" ");
    const cardTitle = card.querySelector("h3").textContent;
    const matchesCategory =
      currentCategory === "all" ||
      (currentCategory === "saved" ? savedGames.has(cardTitle) : categories.includes(currentCategory));
    const matchesQuery = !query || card.dataset.search.includes(query);
    const shouldShow = matchesCategory && matchesQuery;
    card.hidden = !shouldShow;
    visibleCards += Number(shouldShow);
  });

  visibleGameCount.textContent = `${visibleCards} ${visibleCards === 1 ? "game" : "games"}`;
  emptyState.hidden = visibleCards !== 0;
}

function updateCategory(category) {
  currentCategory = category;

  document.querySelectorAll("[data-category]").forEach((button) => {
    if (!button.classList.contains("rail-link")) {
      return;
    }
    const isCurrent = button.dataset.category === category;
    button.classList.toggle("is-active", isCurrent);
    button.setAttribute("aria-pressed", String(isCurrent));
  });

  document.querySelectorAll("[data-mobile-category]").forEach((button) => {
    const isCurrent = button.dataset.mobileCategory === category;
    button.classList.toggle("is-active", isCurrent);
    button.setAttribute("aria-pressed", String(isCurrent));
  });

  filterGames();
  document.querySelector("#library").scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start"
  });
}

document.querySelectorAll(".rail-link").forEach((button) => {
  button.addEventListener("click", () => updateCategory(button.dataset.category));
});

document.querySelectorAll("[data-mobile-category]").forEach((button) => {
  button.addEventListener("click", () => updateCategory(button.dataset.mobileCategory));
});

searchInput.addEventListener("input", filterGames);
searchInput.closest("form").addEventListener("submit", (event) => event.preventDefault());
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  filterGames();
  searchInput.focus();
});

document.querySelector("#showAllGames").addEventListener("click", () => {
  searchInput.value = "";
  updateCategory("all");
});

document.querySelector("#savedGamesButton").addEventListener("click", () => updateCategory("saved"));
document.querySelector("#recentGamesButton").addEventListener("click", () => {
  showToast("Recently played games will appear here after your first session.");
});

gameCards.forEach((card) => {
  const cardTitle = card.querySelector("h3").textContent;
  card.setAttribute("aria-label", `View ${cardTitle} details`);

  card.addEventListener("click", () => {
    window.location.href = card.dataset.href;
  });

  card.addEventListener("keydown", (event) => {
    if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }
    event.preventDefault();
    window.location.href = card.dataset.href;
  });
});

/* 关键模块：滚动后增强顶栏可读性，不持续执行昂贵计算。 */
let scrollFrameRequested = false;
window.addEventListener("scroll", () => {
  if (scrollFrameRequested) {
    return;
  }
  scrollFrameRequested = true;
  window.requestAnimationFrame(() => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 18);
    scrollFrameRequested = false;
  });
}, { passive: true });

document.addEventListener("keydown", (event) => {
  const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (isSearchShortcut) {
    event.preventDefault();
    searchInput.focus();
    return;
  }

  if (document.activeElement === searchInput) {
    return;
  }

  if (event.key === "ArrowLeft") {
    selectMedia(currentMediaIndex - 1);
  }
  if (event.key === "ArrowRight") {
    selectMedia(currentMediaIndex + 1);
  }
});

syncSavedState();
filterGames();
selectMedia(currentMediaIndex, { fromTimer: true });
startGalleryTimer();
