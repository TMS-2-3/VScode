(() => {
  "use strict";

  window.createHealerProfileSystem = function createHealerProfileSystem(context) {
    const {
      view,
      game,
      town,
      playerProfile,
      profileClickTargets,
      COLORS,
      getPlayer,
      getOpeningStory,
      startTownStory,
    } = context;

    const PROFILE_NAME_MAX_LENGTH = 8;
    const PROFILE_PRONOUN_MAX_LENGTH = 8;
    const DEFAULT_FIRST_NAME = "アルジュナ";
    const DEFAULT_LAST_NAME = "フィナルド";
    const DEFAULT_PRONOUN = "私";
    const profileNameInputs = {
      first: null,
      last: null,
      pronoun: null,
    };

    function createProfileNameInput() {
      profileNameInputs.first = createNameInput("firstName", DEFAULT_FIRST_NAME, "主人公の名前");
      profileNameInputs.last = createNameInput("lastName", DEFAULT_LAST_NAME, "主人公の姓");
      profileNameInputs.pronoun = createNameInput("pronoun", DEFAULT_PRONOUN, "一人称", confirmProfilePronoun);
      return profileNameInputs;
    }

    function createNameInput(profileKey, fallback, label, confirmHandler = confirmProfileName) {
      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.maxLength = profileKey === "pronoun" ? PROFILE_PRONOUN_MAX_LENGTH : PROFILE_NAME_MAX_LENGTH;
      inputEl.value = playerProfile[profileKey] || fallback;
      inputEl.className = "profile-name-input";
      inputEl.placeholder = fallback;
      inputEl.hidden = true;
      inputEl.setAttribute("aria-label", label);
      document.body.appendChild(inputEl);
      inputEl.addEventListener("input", () => {
        playerProfile[profileKey] = profileKey === "pronoun"
          ? clampProfilePronoun(inputEl.value)
          : clampProfileName(inputEl.value);
        if (inputEl.value !== playerProfile[profileKey]) {
          inputEl.value = playerProfile[profileKey];
        }
      });
      inputEl.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          confirmHandler();
        }
      });
      return inputEl;
    }

    function getPlayerFirstName() {
      return playerProfile.firstName || DEFAULT_FIRST_NAME;
    }

    function getPlayerLastName() {
      return playerProfile.lastName || DEFAULT_LAST_NAME;
    }

    function getPlayerFullName() {
      return `${getPlayerFirstName()}・${getPlayerLastName()}`;
    }

    function clampProfileName(value) {
      return Array.from((value || "").trim()).slice(0, PROFILE_NAME_MAX_LENGTH).join("");
    }

    function clampProfilePronoun(value) {
      return Array.from((value || "").trim()).slice(0, PROFILE_PRONOUN_MAX_LENGTH).join("");
    }

    function handleProfileSetupKey(key) {
      if (playerProfile.step === "gender") {
        if (key === "1") selectProfileGender("男の子");
        else if (key === "2") selectProfileGender("女の子");
      } else if (playerProfile.step === "name") {
        if (["e", "space", "enter"].includes(key)) {
          confirmProfileName();
        }
      } else if (playerProfile.step === "pronoun") {
        if (["e", "space", "enter"].includes(key)) {
          confirmProfilePronoun();
        }
      }
    }

    function handleProfileSetupClick(x, y) {
      for (const target of profileClickTargets) {
        if (x >= target.x && x <= target.x + target.w && y >= target.y && y <= target.y + target.h) {
          target.action();
          return;
        }
      }
    }

    function selectProfileGender(gender) {
      const player = getPlayer();
      playerProfile.gender = gender;
      town.player.color = gender === "女の子" ? "#ff93c8" : COLORS.player;
      player.color = town.player.color;
      playerProfile.step = "name";
      updateProfileNameInput();
    }

    function confirmProfileName() {
      playerProfile.firstName = clampProfileName(profileNameInputs.first ? profileNameInputs.first.value : playerProfile.firstName) || DEFAULT_FIRST_NAME;
      playerProfile.lastName = clampProfileName(profileNameInputs.last ? profileNameInputs.last.value : playerProfile.lastName) || DEFAULT_LAST_NAME;
      if (profileNameInputs.first) {
        profileNameInputs.first.value = playerProfile.firstName;
      }
      if (profileNameInputs.last) {
        profileNameInputs.last.value = playerProfile.lastName;
      }
      playerProfile.step = "pronoun";
      updateProfileNameInput();
    }

    function selectProfilePronoun(pronoun) {
      playerProfile.pronoun = clampProfilePronoun(pronoun) || DEFAULT_PRONOUN;
      if (profileNameInputs.pronoun) {
        profileNameInputs.pronoun.value = playerProfile.pronoun;
      }
      completeProfileSetup();
    }

    function confirmProfilePronoun() {
      selectProfilePronoun(profileNameInputs.pronoun ? profileNameInputs.pronoun.value : playerProfile.pronoun);
    }

    function selectProfileAppearance(gender) {
      selectProfileGender(gender);
    }

    function getAppearanceChoices() {
      return [
        { key: "男の子", label: "見た目A", color: COLORS.player },
        { key: "女の子", label: "見た目B", color: "#ff93c8" },
      ];
    }

    function getAppearanceColor(gender) {
      const choice = getAppearanceChoices().find((entry) => entry.key === gender);
      return choice ? choice.color : COLORS.player;
    }

    function getDefaultPronoun() {
      return DEFAULT_PRONOUN;
    }

    function confirmProfilePronounFromInput() {
      confirmProfilePronoun();
    }

    function completeProfileSetup() {
      const player = getPlayer();
      playerProfile.done = true;
      player.name = getPlayerFullName();
      updateProfileNameInput();
      beginOpeningStory();
    }

    function beginOpeningStory() {
      if (town.introDone || town.story || !playerProfile.done) {
        return;
      }
      startTownStory("opening", getOpeningStory(), () => {
        town.introDone = true;
        game.message = "集合場所: 依頼所";
        game.messageTimer = 5;
      });
    }

    function getPronounChoices() {
      return ["俺", "僕", "我", "私", "うち", "あたし"];
    }

    function updateProfileNameInput() {
      if (!profileNameInputs.first || !profileNameInputs.last || !profileNameInputs.pronoun) {
        return;
      }
      const nameVisible = game.state === "town" && !playerProfile.done && playerProfile.step === "name";
      const pronounVisible = game.state === "town" && !playerProfile.done && playerProfile.step === "pronoun";
      profileNameInputs.first.hidden = !nameVisible;
      profileNameInputs.last.hidden = !nameVisible;
      profileNameInputs.pronoun.hidden = !pronounVisible;
      if (!nameVisible && !pronounVisible) {
        return;
      }
      if (nameVisible) {
        const rects = getProfileNameInputRects();
        positionNameInput(profileNameInputs.first, rects.first);
        positionNameInput(profileNameInputs.last, rects.last);
        if (!isProfileNameInputFocused()) {
          profileNameInputs.first.focus();
          profileNameInputs.first.select();
        }
        return;
      }
      const rect = getProfilePronounInputRect();
      positionNameInput(profileNameInputs.pronoun, rect);
      if (document.activeElement !== profileNameInputs.pronoun) {
        profileNameInputs.pronoun.focus();
        profileNameInputs.pronoun.select();
      }
    }

    function positionNameInput(inputEl, rect) {
      const scale = Math.max(0.01, Number(view.displayScale) || 1);
      const offsetX = Number.isFinite(view.displayX) ? view.displayX : 0;
      const offsetY = Number.isFinite(view.displayY) ? view.displayY : 0;
      inputEl.style.width = `${Math.max(1, rect.w * scale)}px`;
      inputEl.style.height = `${Math.max(1, rect.h * scale)}px`;
      inputEl.style.left = `${offsetX + rect.x * scale}px`;
      inputEl.style.top = `${offsetY + rect.y * scale}px`;
      inputEl.style.fontSize = `${Math.max(11, 22 * scale)}px`;
    }

    function isProfileNameInputFocused() {
      return document.activeElement === profileNameInputs.first || document.activeElement === profileNameInputs.last;
    }

    function getProfileNameInputRects() {
      const gap = 30;
      const availableW = Math.max(160, view.w - 84);
      const w = Math.max(76, Math.min(190, (availableW - gap) / 2));
      const totalW = w * 2 + gap;
      const y = Math.max(138, view.h * 0.5 - 14);
      const firstX = view.w / 2 - totalW / 2;
      return {
        first: { x: firstX, y, w, h: 46 },
        last: { x: firstX + w + gap, y, w, h: 46 },
        separator: { x: firstX + w + gap / 2, y: y + 23 },
      };
    }

    function getProfilePronounInputRect() {
      const w = Math.min(220, Math.max(140, view.w - 96));
      const y = Math.max(148, view.h * 0.5 - 12);
      return { x: view.w / 2 - w / 2, y, w, h: 46 };
    }

    function getProfileNameInputRect() {
      return getProfileNameInputRects().first;
    }

    function getProfileNameInput() {
      return profileNameInputs;
    }

    return {
      createProfileNameInput,
      getPlayerFirstName,
      getPlayerLastName,
      getPlayerFullName,
      clampProfileName,
      clampProfilePronoun,
      handleProfileSetupKey,
      handleProfileSetupClick,
      selectProfileGender,
      selectProfileAppearance,
      confirmProfileName,
      selectProfilePronoun,
      confirmProfilePronoun,
      confirmProfilePronounFromInput,
      completeProfileSetup,
      beginOpeningStory,
      getPronounChoices,
      getAppearanceChoices,
      getAppearanceColor,
      getDefaultPronoun,
      updateProfileNameInput,
      getProfileNameInputRects,
      getProfilePronounInputRect,
      getProfileNameInputRect,
      getProfileNameInput,
    };
  };
})();
