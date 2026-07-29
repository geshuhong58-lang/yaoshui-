/* 关键模块：先把已审核的新增游戏渲染进首页，再绑定筛选、收藏和键盘交互。 */
const importedBrowserGames = Array.isArray(window.OpenNiceBrowserGames)
  ? window.OpenNiceBrowserGames
  : [];

function renderImportedBrowserGames() {
  const gameGrid = document.querySelector("#gameGrid");
  if (!gameGrid || importedBrowserGames.length === 0) {
    return;
  }

  const cardMarkup = importedBrowserGames
    .map((game) => {
      const detailUrl = `game-player.html?game=${encodeURIComponent(game.slug)}`;
      const categoryText = game.categories.join(" ");
      const cardMeta = game.tags.slice(0, 2).join(" · ");
      const usesTrustedDestination = game.mode === "external";
      const badgeLabel = usesTrustedDestination ? "Trusted page" : "Play now";
      const hoverLabel = usesTrustedDestination ? "View game page" : "Launch game";

      return `
        <article
          class="game-card game-card--imported"
          data-category="${categoryText}"
          data-search="${game.search}"
          data-href="${detailUrl}"
          tabindex="0"
        >
          <div class="game-art">
            <div class="browser-cover-frame">
              <img
                class="browser-cover-backdrop"
                src="${game.cover}"
                alt=""
                aria-hidden="true"
                width="960"
                height="540"
                loading="lazy"
                decoding="async"
              >
              <img
                class="browser-game-cover"
                src="${game.cover}"
                alt="${game.title} game cover"
                width="960"
                height="540"
                loading="lazy"
                decoding="async"
              >
            </div>
            <span class="card-rank">${game.rank}</span>
            <span class="card-badge card-badge--blue">${badgeLabel}</span>
            <span class="card-hover-label" aria-hidden="true">${hoverLabel} <span>↗</span></span>
            <button class="card-save" type="button" aria-label="Save ${game.title}" aria-pressed="false" data-save-game="${game.title}">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>
            </button>
          </div>
          <div class="game-card-copy">
            <div>
              <h3><a href="${detailUrl}">${game.title}</a></h3>
              <p>${cardMeta}</p>
            </div>
            <span class="card-arrow" aria-hidden="true">↗</span>
          </div>
        </article>
      `;
    })
    .join("");

  /* 关键模块：动态游戏位于固定游戏之前，确保策划排序就是用户看到的首屏顺序。 */
  gameGrid.insertAdjacentHTML("afterbegin", cardMarkup);
}

renderImportedBrowserGames();

/* 关键模块：顶部滑动栏仅展示需要 Steam 下载安装的游戏，与在线即玩游戏完全分离。 */
const featuredGames = [
  {
    title: "Marvel Rivals",
    titleMarkup: "Marvel<br><em>Rivals</em>",
    kicker: "Free team PVP · Steam download",
    description:
      "Assemble an all-star Marvel squad, combine powers into Team-Up abilities, and reshape destructible battlefields in fast 6v6 matches.",
    meta: ["Free to play", "Windows · Steam", "Released Dec 6, 2024"],
    detailUrl: "marvel-rivals.html",
    actionLabel: "View Marvel Rivals",
    backdrop: "assets/marvel-rivals/screenshot-03.jpg",
    poster: "assets/marvel-rivals/trailer-poster.jpg",
    video: "assets/marvel-rivals/trailer.mp4",
    status: "Marvel Rivals · Steam download",
    usesLongTitle: false
  },
  {
    title: "World of Eggs",
    titleMarkup: "World of Eggs:<br><em>Idle Adventures</em>",
    kicker: "Idle strategy MMO · Steam Early Access",
    description:
      "Build an egg civilization, automate production, trade with other players, and join raids in a growing idle strategy MMO.",
    meta: ["Free to play", "Windows · Steam", "Early Access Jul 24, 2026"],
    detailUrl: "world-of-eggs.html",
    actionLabel: "View World of Eggs",
    backdrop: "assets/world-of-eggs/screenshot-01.jpg",
    poster: "assets/world-of-eggs/trailer-poster.jpg",
    video: "assets/world-of-eggs/trailer.mp4",
    status: "World of Eggs · Steam Early Access",
    usesLongTitle: true
  }
];

const storageKey = "opennice-saved-games";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero");
const heroImage = document.querySelector("#heroImage");
const heroVideo = document.querySelector("#heroVideo");
const heroVideoSource = document.querySelector("#heroVideoSource");
const heroKicker = document.querySelector(".hero-kicker");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector(".hero-description");
const heroMeta = document.querySelector(".hero-meta");
const heroPrimaryAction = document.querySelector("#heroPrimaryAction");
const heroPrimaryLabel = document.querySelector("#heroPrimaryLabel");
const playTrailerButton = document.querySelector("#playTrailerButton");
const trailerButtonLabel = document.querySelector("#trailerButtonLabel");
const currentSlideLabel = document.querySelector("#currentSlideLabel");
const totalSlideLabel = document.querySelector("#totalSlideLabel");
const mediaStatus = document.querySelector("#mediaStatus");
const galleryProgress = document.querySelector("#galleryProgress");
const thumbnailButtons = [...document.querySelectorAll("[data-feature-index]")];
const dotButtons = [...document.querySelectorAll("[data-feature-dot-index]")];
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

let currentFeaturedIndex = 0;
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

/* 关键模块：切换游戏时卸载上一段视频，避免手机端在后台同时下载多个大文件。 */
function prepareFeaturedVideo(game) {
  heroVideo.pause();
  heroVideo.classList.remove("is-active");
  heroVideoSource.removeAttribute("src");
  heroVideoSource.dataset.src = game.video;
  heroVideo.poster = game.poster;
  heroVideo.load();
  setTrailerButtonState(false);
}

/* 关键模块：首屏不下载大视频，只有用户主动播放时才注入当前游戏的视频地址。 */
function ensureVideoLoaded() {
  if (heroVideoSource.getAttribute("src")) {
    return;
  }
  heroVideoSource.src = heroVideoSource.dataset.src;
  heroVideo.load();
}

function restartGalleryProgress() {
  galleryProgress.classList.remove("is-running");
  void galleryProgress.offsetWidth;

  if (prefersReducedMotion.matches || document.hidden || !heroVideo.paused) {
    return;
  }
  galleryProgress.classList.add("is-running");
}

/* 关键模块：只在滑动栏内部横向定位缩略图，避免自动轮播把整页拉回首屏。 */
function revealThumbnailHorizontally(button) {
  const thumbnailTrack = button.closest(".thumbnail-track");
  if (!thumbnailTrack) {
    return;
  }

  const centeredLeft = button.offsetLeft - (thumbnailTrack.clientWidth - button.offsetWidth) / 2;
  thumbnailTrack.scrollTo({
    left: Math.max(0, centeredLeft),
    behavior: prefersReducedMotion.matches ? "auto" : "smooth"
  });
}

/* 关键模块：一次性同步背景、标题、简介、详情链接、收藏按钮和滑动栏状态。 */
function selectFeaturedGame(index, options = {}) {
  const normalizedIndex = (index + featuredGames.length) % featuredGames.length;
  const game = featuredGames[normalizedIndex];
  currentFeaturedIndex = normalizedIndex;

  prepareFeaturedVideo(game);
  heroKicker.textContent = game.kicker;
  heroTitle.innerHTML = game.titleMarkup;
  heroDescription.textContent = game.description;
  heroMeta.innerHTML = game.meta.map((item) => `<span>${item}</span>`).join("");
  heroPrimaryAction.href = game.detailUrl;
  heroPrimaryLabel.textContent = game.actionLabel;
  heroFavorite.dataset.saveGame = game.title;
  heroFavorite.setAttribute("aria-label", `Save ${game.title}`);
  hero.classList.toggle("hero--long-title", game.usesLongTitle);

  currentSlideLabel.textContent = formatIndex(normalizedIndex);
  totalSlideLabel.textContent = String(featuredGames.length).padStart(2, "0");
  mediaStatus.textContent = game.status;

  thumbnailButtons.forEach((button, buttonIndex) => {
    const isCurrent = buttonIndex === normalizedIndex;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "true");
      revealThumbnailHorizontally(button);
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

  heroImage.hidden = false;
  heroImage.classList.add("is-switching");

  const revealImage = () => {
    heroImage.classList.remove("is-switching");
  };

  if (heroImage.src.endsWith(game.backdrop)) {
    revealImage();
  } else {
    heroImage.addEventListener("load", revealImage, { once: true });
    heroImage.src = game.backdrop;
  }

  syncSavedState();

  if (!options.fromTimer) {
    restartGalleryTimer();
  } else {
    restartGalleryProgress();
  }
}

function startGalleryTimer() {
  window.clearInterval(galleryTimer);
  restartGalleryProgress();
  if (prefersReducedMotion.matches || document.hidden || !heroVideo.paused) {
    return;
  }

  galleryTimer = window.setInterval(() => {
    selectFeaturedGame(currentFeaturedIndex + 1, { fromTimer: true });
  }, 8500);
}

function restartGalleryTimer() {
  startGalleryTimer();
}

thumbnailButtons.forEach((button) => {
  button.addEventListener("click", () => selectFeaturedGame(Number(button.dataset.featureIndex)));
});

dotButtons.forEach((button) => {
  button.addEventListener("click", () => selectFeaturedGame(Number(button.dataset.featureDotIndex)));
});

document.querySelector("#previousMedia").addEventListener("click", () => selectFeaturedGame(currentFeaturedIndex - 1));
document.querySelector("#nextMedia").addEventListener("click", () => selectFeaturedGame(currentFeaturedIndex + 1));

playTrailerButton.addEventListener("click", () => {
  if (heroVideo.paused) {
    ensureVideoLoaded();
    heroImage.hidden = true;
    heroVideo.classList.add("is-active");
    window.clearInterval(galleryTimer);
    galleryProgress.classList.remove("is-running");
    heroVideo.play().then(() => setTrailerButtonState(true)).catch(() => {
      heroImage.hidden = false;
      heroVideo.classList.remove("is-active");
      setTrailerButtonState(false);
    });
  } else {
    heroVideo.pause();
    heroImage.hidden = false;
    heroVideo.classList.remove("is-active");
    setTrailerButtonState(false);
    startGalleryTimer();
  }
});

heroVideo.addEventListener("play", () => {
  setTrailerButtonState(true);
  window.clearInterval(galleryTimer);
  galleryProgress.classList.remove("is-running");
});
heroVideo.addEventListener("pause", () => {
  setTrailerButtonState(false);
  heroImage.hidden = false;
  heroVideo.classList.remove("is-active");
});
heroVideo.addEventListener("ended", startGalleryTimer);

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
  selectFeaturedGame(currentFeaturedIndex + (travel < 0 ? 1 : -1));
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
  const currentGame = featuredGames[currentFeaturedIndex];
  const heroIsSaved = savedGames.has(currentGame.title);
  heroFavorite.setAttribute("aria-pressed", String(heroIsSaved));
  heroFavorite.querySelector("span").textContent = heroIsSaved ? "Saved" : "Save";

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

heroFavorite.addEventListener("click", () => toggleSavedGame(featuredGames[currentFeaturedIndex].title));

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
    selectFeaturedGame(currentFeaturedIndex - 1);
  }
  if (event.key === "ArrowRight") {
    selectFeaturedGame(currentFeaturedIndex + 1);
  }
});

filterGames();
selectFeaturedGame(currentFeaturedIndex, { fromTimer: true });
startGalleryTimer();
