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

    let profileNameInput = null;

    function createProfileNameInput() {
      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.maxLength = 6;
      inputEl.value = playerProfile.firstName;
      inputEl.className = "profile-name-input";
      inputEl.setAttribute("aria-label", "主人公の名前");
      document.body.appendChild(inputEl);
      inputEl.addEventListener("input", () => {
        playerProfile.firstName = clampProfileName(inputEl.value);
        if (inputEl.value !== playerProfile.firstName) {
          inputEl.value = playerProfile.firstName;
        }
      });
      inputEl.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          confirmProfileName();
        }
      });
      profileNameInput = inputEl;
      return inputEl;
    }

    function getPlayerFirstName() {
      return playerProfile.firstName || "アルジュナ";
    }

    function clampProfileName(value) {
      return Array.from((value || "").trim()).slice(0, 6).join("");
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
      playerProfile.firstName = clampProfileName(profileNameInput ? profileNameInput.value : playerProfile.firstName) || "アルジュナ";
      if (profileNameInput) {
        profileNameInput.value = playerProfile.firstName;
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
      player.name = getPlayerFirstName();
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
      if (!profileNameInput) {
        return;
      }
      const visible = game.state === "town" && !playerProfile.done && playerProfile.step === "name";
      profileNameInput.hidden = !visible;
      if (!visible) {
        return;
      }
      const rect = getProfileNameInputRect();
      profileNameInput.style.width = `${rect.w}px`;
      profileNameInput.style.left = `${rect.x}px`;
      profileNameInput.style.top = `${rect.y}px`;
      if (document.activeElement !== profileNameInput) {
        profileNameInput.focus();
        profileNameInput.select();
      }
    }

    function getProfileNameInputRect() {
      const w = Math.max(120, Math.min(220, view.w - 190));
      return {
        x: view.w / 2 - w / 2 - 58,
        y: Math.max(138, view.h * 0.5 - 14),
        w,
        h: 46,
      };
    }

    function getProfileNameInput() {
      return profileNameInput;
    }

    return {
      createProfileNameInput,
      getPlayerFirstName,
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
      getProfileNameInputRect,
      getProfileNameInput,
    };
  };
})();
