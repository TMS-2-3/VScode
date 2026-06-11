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
    const DEFAULT_FIRST_NAME = "アルジュナ";
    const DEFAULT_LAST_NAME = "フィナルド";
    const profileNameInputs = {
      first: null,
      last: null,
    };

    function createProfileNameInput() {
      profileNameInputs.first = createNameInput("firstName", DEFAULT_FIRST_NAME, "主人公の名前");
      profileNameInputs.last = createNameInput("lastName", DEFAULT_LAST_NAME, "主人公の姓");
      return profileNameInputs;
    }

    function createNameInput(profileKey, fallback, label) {
      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.maxLength = PROFILE_NAME_MAX_LENGTH;
      inputEl.value = playerProfile[profileKey] || fallback;
      inputEl.className = "profile-name-input";
      inputEl.placeholder = fallback;
      inputEl.hidden = true;
      inputEl.setAttribute("aria-label", label);
      document.body.appendChild(inputEl);
      inputEl.addEventListener("input", () => {
        playerProfile[profileKey] = clampProfileName(inputEl.value);
        if (inputEl.value !== playerProfile[profileKey]) {
          inputEl.value = playerProfile[profileKey];
        }
      });
      inputEl.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          confirmProfileName();
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

    function handleProfileSetupKey(key) {
      if (playerProfile.step === "gender") {
        if (key === "1") selectProfileGender("男の子");
        else if (key === "2") selectProfileGender("女の子");
      } else if (playerProfile.step === "name") {
        if (["e", "space", "enter"].includes(key)) {
          confirmProfileName();
        }
      } else if (playerProfile.step === "pronoun") {
        const index = Number(key) - 1;
        const choices = getPronounChoices();
        if (choices[index]) {
          selectProfilePronoun(choices[index]);
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
      playerProfile.pronoun = pronoun;
      completeProfileSetup();
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
      if (!profileNameInputs.first || !profileNameInputs.last) {
        return;
      }
      const visible = game.state === "town" && !playerProfile.done && playerProfile.step === "name";
      profileNameInputs.first.hidden = !visible;
      profileNameInputs.last.hidden = !visible;
      if (!visible) {
        return;
      }
      const rects = getProfileNameInputRects();
      positionNameInput(profileNameInputs.first, rects.first);
      positionNameInput(profileNameInputs.last, rects.last);
      if (!isProfileNameInputFocused()) {
        profileNameInputs.first.focus();
        profileNameInputs.first.select();
      }
    }

    function positionNameInput(inputEl, rect) {
      inputEl.style.width = `${rect.w}px`;
      inputEl.style.left = `${rect.x}px`;
      inputEl.style.top = `${rect.y}px`;
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
      handleProfileSetupKey,
      handleProfileSetupClick,
      selectProfileGender,
      confirmProfileName,
      selectProfilePronoun,
      completeProfileSetup,
      beginOpeningStory,
      getPronounChoices,
      updateProfileNameInput,
      getProfileNameInputRects,
      getProfileNameInputRect,
      getProfileNameInput,
    };
  };
})();
