(() => {
  "use strict";

  window.createHealerItemSystem = function createHealerItemSystem(context) {
    const {
      canvasCtx: ctx,
      TAU,
      game,
      player,
      input,
      ITEM_SLOT_KEYS,
      healUnit,
      addFloat,
      getHoveredPartyMember,
      getSupportOrigin,
      cancelPlayerAim,
    } = context;

    const slotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length
      ? ITEM_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["c", "v", "b"];

    function createDefaultSlots() {
      return [
        {
          id: "potion",
          name: "ポーション",
          shortName: "薬",
          count: 3,
          maxCount: 3,
          healRatio: 0.25,
          target: "ally",
          cd: 0,
          maxCd: 0,
        },
        null,
        null,
      ];
    }

    function normalizeSlots() {
      if (!Array.isArray(game.itemSlots)) {
        game.itemSlots = createDefaultSlots();
      }
      while (game.itemSlots.length < slotKeys.length) {
        game.itemSlots.push(null);
      }
      if (game.itemSlots.length > slotKeys.length) {
        game.itemSlots.length = slotKeys.length;
      }
      return game.itemSlots;
    }

    function getItemSlots() {
      return normalizeSlots();
    }

    function getItemSlotKeys() {
      return slotKeys.slice();
    }

    function useItemSlot(index) {
      return startItemAim(index);
    }

    function startItemAim(index) {
      const slotIndex = Math.floor(Number(index));
      const item = getUsableItem(slotIndex);
      if (!item) {
        return false;
      }
      if (player.dead || player.channel || player.cast || player.frozen > 0) {
        return false;
      }
      if (cancelPlayerAim) {
        cancelPlayerAim();
      }
      player.itemAim = { slotIndex };
      game.hover = getHoveredPartyMember ? getHoveredPartyMember() : null;
      return true;
    }

    function cancelItemAim() {
      player.itemAim = null;
    }

    function confirmItemAim() {
      if (!player.itemAim || player.dead || player.channel || player.cast || player.frozen > 0) {
        return false;
      }
      const slotIndex = player.itemAim.slotIndex;
      const item = getUsableItem(slotIndex);
      if (!item) {
        player.itemAim = null;
        return false;
      }
      if (item.target === "ally") {
        return confirmAllyPotion(item);
      }
      showSupportFloat("未実装", "#f7fff6");
      return false;
    }

    function getUsableItem(slotIndex) {
      const slots = normalizeSlots();
      const item = slots[slotIndex];
      if (!item || item.count <= 0) {
        showSupportFloat("空き", "#f7fff6");
        return null;
      }
      if ((item.cd || 0) > 0) {
        showSupportFloat("準備中", "#f7fff6");
        return null;
      }
      return item;
    }

    function confirmAllyPotion(item) {
      const target = getHoveredPartyMember ? getHoveredPartyMember() : null;
      if (!target || target.dead || target.team !== "party") {
        const x = input && input.mouse ? input.mouse.x : 0;
        const y = input && input.mouse ? input.mouse.y - 12 : 0;
        addFloat("対象なし", x, y, "#ffffff");
        return false;
      }
      const amount = target.maxHp * (Number.isFinite(item.healRatio) ? item.healRatio : 0.25);
      const healed = healUnit(null, target, amount);
      if (healed <= 0) {
        return false;
      }
      item.count = Math.max(0, (item.count || 0) - 1);
      player.itemAim = null;
      return true;
    }

    function drawItemAimPreview() {
      if (!player.itemAim || player.dead) {
        return;
      }
      const target = getHoveredPartyMember ? getHoveredPartyMember() : null;
      if (!target || target.dead || target.team !== "party") {
        return;
      }
      ctx.save();
      ctx.strokeStyle = "#8de2a1";
      ctx.fillStyle = "rgba(141,226,161,0.13)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius + 17, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function showSupportFloat(text, color) {
      const origin = getSupportOrigin ? getSupportOrigin() : { x: input.mouse.x, y: input.mouse.y };
      addFloat(text, origin.x + 26, origin.y - 28, color);
    }

    normalizeSlots();

    return {
      getItemSlots,
      getItemSlotKeys,
      useItemSlot,
      startItemAim,
      cancelItemAim,
      confirmItemAim,
      drawItemAimPreview,
    };
  };
})();
