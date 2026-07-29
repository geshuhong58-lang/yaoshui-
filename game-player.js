/* 关键模块：播放器只接受 browser-games.js 白名单中的 slug，不接受任意 iframe URL。 */
const availableGames = Array.isArray(window.OpenNiceBrowserGames)
  ? window.OpenNiceBrowserGames
  : [];
const requestedSlug = new URLSearchParams(window.location.search).get("game");
const selectedGame = availableGames.find((game) => game.slug === requestedSlug);

const pageTitle = document.querySelector("#page-title");
const breadcrumbTitle = document.querySelector("#breadcrumb-title");
const gameEyebrow = document.querySelector("#game-eyebrow");
const gameTagline = document.querySelector("#game-tagline");
const gameDescription = document.querySelector("#game-description");
const gameTags = document.querySelector("#game-tags");
const sourceHost = document.querySelector("#source-host");
const sourceLinks = [
  document.querySelector("#toolbar-source-link"),
  document.querySelector("#source-link"),
  document.querySelector("#footer-source-link")
];
const attributionTitle = document.querySelector("#attribution-title");
const favoriteButton = document.querySelector("[data-favorite]");
const playerCover = document.querySelector("#player-cover");
const playerCoverImage = document.querySelector("#player-cover-image");
const coverName = document.querySelector("#cover-name");
const coverType = document.querySelector("#cover-type");
const launchTitle = document.querySelector("#launch-title");
const launchPanel = document.querySelector("#launch-panel");
const playButton = document.querySelector("#play-game-button");
const gameEmbed = document.querySelector("#game-embed");
const fullscreenButton = document.querySelector("#fullscreen-button");
const playerStatusText = document.querySelector("#player-status-text");
const orientationTip = document.querySelector("#orientation-tip");

/* 关键模块：参数无效时留在安全的站内提示页，不跳转到未知地址。 */
function showUnavailableState() {
  document.title = "Game Unavailable | OpenNice";
  document.querySelector('meta[name="robots"]').content = "noindex, follow";
  pageTitle.textContent = "Game unavailable";
  breadcrumbTitle.textContent = "Unavailable";
  gameEyebrow.textContent = "Safe player";
  gameTagline.textContent = "This game address is not present in the verified OpenNice list.";
  launchTitle.textContent = "Choose a game from the library.";
  playButton.textContent = "Browse all games";
  playButton.addEventListener("click", () => {
    window.location.href = "catalog.html";
  });
  favoriteButton.hidden = true;
  playerCover.hidden = true;
  fullscreenButton.hidden = true;
  playerStatusText.textContent = "No verified game selected";
}

/* 关键模块：只使用内部游戏记录更新页面文本和 SEO，不将查询参数写入 HTML。 */
function populateGamePage(game) {
  const canonicalUrl = `https://opennice.online/game-player.html?game=${encodeURIComponent(game.slug)}`;
  const usesOfficialDestination = game.mode === "external";
  const metaDescription = usesOfficialDestination
    ? `Explore ${game.title} and continue to its verified official game page. ${game.tagline}`
    : `Play ${game.title} online free in your browser. ${game.tagline}`;

  document.title = usesOfficialDestination
    ? `${game.title} Official Game Destination | OpenNice`
    : `Play ${game.title} Online Free | OpenNice`;
  document.querySelector("#page-description").content = metaDescription;
  document.querySelector("#page-canonical").href = canonicalUrl;
  document.querySelector("#og-title").content = usesOfficialDestination
    ? `${game.title} Official Game Destination`
    : `Play ${game.title} Online`;
  document.querySelector("#og-description").content = game.tagline;
  document.querySelector("#og-url").content = canonicalUrl;

  pageTitle.textContent = game.title;
  breadcrumbTitle.textContent = game.title;
  gameEyebrow.textContent = game.eyebrow;
  gameTagline.textContent = game.tagline;
  gameDescription.textContent = game.description;
  gameTags.textContent = game.tags.join(" · ");
  sourceHost.textContent = game.sourceLabel;
  attributionTitle.textContent = game.title;
  launchTitle.textContent = usesOfficialDestination
    ? `Continue to ${game.title}.`
    : `Launch ${game.title}.`;
  coverName.textContent = game.title;
  coverType.textContent = game.tags[0];
  playerCoverImage.src = game.cover;
  playerCoverImage.alt = `${game.title} game cover`;

  favoriteButton.dataset.gameId = game.slug;
  favoriteButton.dataset.gameName = game.title;

  sourceLinks.forEach((link) => {
    link.href = game.source;
  });
  document.querySelector("#source-link").textContent = game.sourceLabel;

  const isPortraitPhone = window.matchMedia("(max-width: 760px) and (orientation: portrait)").matches;
  orientationTip.textContent = usesOfficialDestination
    ? "This title opens on its verified official game page in a new tab."
    : isPortraitPhone
      ? "For games with wide controls, rotate your phone after launch."
      : "The game opens here without leaving OpenNice.";

  if (usesOfficialDestination) {
    playButton.firstChild.textContent = "Open official page ";
    playerStatusText.textContent = "Official destination verified";
    fullscreenButton.hidden = true;
  }

  document.querySelector("#game-schema").textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url: canonicalUrl,
    description: game.description,
    image: `https://opennice.online/${game.cover}`,
    gamePlatform: "Web browser",
    isAccessibleForFree: true,
    genre: game.tags,
    sameAs: game.source
  });
}

/* 关键模块：用户主动点击后才创建 iframe，并授予常见网页游戏所需的有限功能权限。 */
function launchGame(game) {
  if (game.mode === "external") {
    window.open(game.source, "_blank", "noopener,noreferrer");
    playerStatusText.textContent = "Official page opened in a new tab";
    return;
  }

  if (gameEmbed.querySelector("iframe")) {
    return;
  }

  const frame = document.createElement("iframe");
  frame.src = game.source;
  frame.title = `Play ${game.title} online`;
  frame.scrolling = "no";
  frame.loading = "eager";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allow = "autoplay; fullscreen; gamepad; payment; screen-wake-lock; clipboard-read; clipboard-write";
  frame.allowFullscreen = true;

  const loadFallbackTimer = window.setTimeout(() => {
    playerStatusText.textContent = "Game opened from source";
  }, 6000);

  frame.addEventListener("load", () => {
    window.clearTimeout(loadFallbackTimer);
    playerStatusText.textContent = "Game loaded from source";
  });

  launchPanel.hidden = true;
  playerStatusText.textContent = "Connecting to game source…";
  gameEmbed.classList.add("is-running");
  gameEmbed.append(frame);
  fullscreenButton.hidden = false;
}

if (!selectedGame) {
  showUnavailableState();
} else {
  populateGamePage(selectedGame);
  playButton.addEventListener("click", () => launchGame(selectedGame));
}

fullscreenButton.addEventListener("click", async () => {
  try {
    await gameEmbed.requestFullscreen();
  } catch {
    playerStatusText.textContent = "Fullscreen is not available in this browser";
  }
});
