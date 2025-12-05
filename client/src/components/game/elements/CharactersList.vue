<template>
  <div v-if="characters.length > 0" class="card bg-dark characters-list">
    <div v-if="title" class="card-header bg-secondary text-light text-center px-0">
      {{ title }}
    </div>
    <div
      v-if="killMode || robMode || putAsideMode"
      class="mode-banner px-3 py-2 text-light"
    >
      <span v-if="killMode" class="mode-chip kill">
        <emoji emoji="💀"></emoji>
        <span class="ml-1">{{ t('game.actions.assassin_kill') }}</span>
      </span>
      <span v-if="robMode" class="mode-chip rob">
        <emoji emoji="💰"></emoji>
        <span class="ml-1">{{ t('game.actions.thief_rob') }}</span>
      </span>
      <span v-if="putAsideMode" class="mode-chip put-aside">
        <emoji emoji="⬇️"></emoji>
        <span class="ml-1">{{ t('game.messages.choose_characters.put_aside_face_up') }}</span>
      </span>
    </div>
    <div class="characters-layout">
      <article
        v-for="(character, i) in processedCharacters"
        :key="i"
        class="character-card"
        :class="[
          accentClass(character.id),
          {
            'is-current': character.id === current && current !== 0 && !(killMode || robMode),
            'is-killed': character.killed,
            'is-robbed': character.robbed,
            'is-past': character.id < current || character.id === 0,
            'is-selectable': character.selectable,
          },
        ]"
        v-tooltip="t(`characters.${character.id}.description`)"
        data-placement="left"
        role="button"
        :aria-pressed="character.id === current"
        :aria-disabled="!character.selectable"
        @click="selectCharacter(i, character.id)"
      >
        <div class="card-visual">
          <div class="card-art">
            <div class="art-icon" aria-hidden="true">
              <emoji :emoji="characterIcon(character.id)"></emoji>
            </div>
            <span class="art-number" :class="`text-${textColor(character.id)}`">{{ character.id }}</span>
          </div>
        </div>
        <div class="card-body text-left">
          <div class="card-title-row">
            <span class="character-name text-light">{{ t(`characters.${character.id}.name`) }}</span>
            <span v-if="character.selectable" class="state-chip selectable">
              <emoji emoji="✅"></emoji>
            </span>
          </div>
          <div class="state-chips">
            <span v-if="character.id === 0" class="state-chip muted">?</span>
            <span v-if="character.id === current && current !== 0 && !(killMode || robMode)" class="state-chip current">
              <emoji emoji="👑"></emoji>
              <span class="ml-1">Current turn</span>
            </span>
            <span v-if="character.killed" class="state-chip killed">
              <emoji emoji="💀"></emoji>
              <span class="ml-1">{{ t('game.actions.assassin_kill') }}</span>
            </span>
            <span v-else-if="character.robbed" class="state-chip robbed">
              <emoji emoji="💰"></emoji>
              <span class="ml-1">{{ t('game.actions.thief_rob') }}</span>
            </span>
            <span v-if="putAsideMode && character.id !== 0" class="state-chip put-aside">
              <emoji emoji="⬇️"></emoji>
              <span class="ml-1">{{ t('game.messages.choose_characters.put_aside_face_down') }}</span>
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Move, MoveType } from 'citadels-common';
import { store } from '../../../store';
import { t } from '../../../i18n';

export default defineComponent({
  name: 'CharactersList',
  props: {
    title: {
      type: String,
      default: '',
    },
    characters: {
      type: Array,
      required: true,
    },
    current: {
      type: Number,
      default: 0,
    },
    killMode: {
      type: Boolean,
      default: false,
    },
    robMode: {
      type: Boolean,
      default: false,
    },
    putAsideMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    processedCharacters() {
      return this.characters.map((character) => ({
        selectable: (this.killMode && character.id > 1)
          || (this.robMode && character.id > 2 && !character.killed),
        ...character,
      }));
    },
  },
  methods: {
    t,
    accentClass(character: number) {
      if (character === 0 || character < this.current) {
        return 'accent-dark';
      }
      switch (character) {
        case 4:
          return 'accent-warning';
        case 5:
          return 'accent-primary';
        case 6:
          return 'accent-success';
        case 8:
          return 'accent-danger';
        default:
          return 'accent-secondary';
      }
    },
    characterIcon(character: number) {
      switch (character) {
        case 1:
          return '🗡️';
        case 2:
          return '🎭';
        case 3:
          return '🪄';
        case 4:
          return '👑';
        case 5:
          return '✝️';
        case 6:
          return '💰';
        case 7:
          return '🏗️';
        case 8:
          return '⚔️';
        default:
          return '❓';
      }
    },
    textColor(character: number) {
      if (character < this.current) {
        return 'light';
      }
      switch (character) {
        case 4:
          return 'dark';
        default:
          return 'light';
      }
    },
    async selectCharacter(index: number, characterId: number) {
      if (!this.processedCharacters[index].selectable) return;

      let moveType = MoveType.CHOOSE_CHARACTER;
      let moveData = index;

      if (this.killMode) {
        moveData = characterId;
        moveType = MoveType.ASSASSIN_KILL;
      } else if (this.robMode) {
        moveType = MoveType.THIEF_ROB;
        moveData = characterId;
      }

      const move: Move = { type: moveType, data: moveData };
      await store.dispatch('sendMove', move);
    },
  },
});
</script>

<style lang="scss" scoped>
.characters-list {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.mode-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);

  &.kill {
    border-color: #b71c1c;
    color: #ffb3b3;
  }

  &.rob {
    border-color: #3a2f1c;
    color: #f5d29f;
  }

  &.put-aside {
    border-color: #1c3a5a;
    color: #b9d7ff;
  }
}

.characters-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
}

.character-card {
  --accent-soft: #3c3f46;
  --accent-strong: #2b2d33;
  --accent-contrast: #f8f9fa;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.card-visual {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent-soft), var(--accent-strong));
  color: var(--accent-contrast);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.card-art {
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem;
}

.art-icon {
  font-size: 2rem;
}

.art-number {
  position: absolute;
  top: 0.5rem;
  left: 0.65rem;
  font-weight: 700;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.character-name {
  font-weight: 600;
  font-size: 1rem;
}

.state-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.state-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8f9fa;

  &.muted {
    opacity: 0.75;
  }

  &.current {
    background: rgba(255, 215, 0, 0.15);
    border-color: #c7a300;
    color: #ffd700;
  }

  &.killed {
    background: rgba(255, 0, 0, 0.16);
    border-color: #b71c1c;
    color: #ffc4c4;
  }

  &.robbed {
    background: rgba(255, 215, 0, 0.08);
    border-color: #6b4e0f;
    color: #f5d29f;
  }

  &.put-aside {
    background: rgba(100, 181, 246, 0.12);
    border-color: #1c3a5a;
    color: #b9d7ff;
  }

  &.selectable {
    border-color: #198754;
    color: #b4f3d6;
    background: rgba(25, 135, 84, 0.15);
  }
}

.accent-secondary {
  --accent-soft: #50545c;
  --accent-strong: #32353c;
  --accent-contrast: #f8f9fa;
}

.accent-warning {
  --accent-soft: #f2c55c;
  --accent-strong: #d18b16;
  --accent-contrast: #1f1300;
}

.accent-primary {
  --accent-soft: #8fb6ff;
  --accent-strong: #1f5eff;
  --accent-contrast: #0c1a33;
}

.accent-success {
  --accent-soft: #8fd5b5;
  --accent-strong: #1f7a4d;
  --accent-contrast: #0b251a;
}

.accent-danger {
  --accent-soft: #f5a0a0;
  --accent-strong: #b71c1c;
  --accent-contrast: #fff5f5;
}

.accent-dark {
  --accent-soft: #575d68;
  --accent-strong: #2c3038;
  --accent-contrast: #f8f9fa;
}

.character-card.is-current {
  border-color: #ffd700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2), 0 10px 24px rgba(0, 0, 0, 0.35);
}

.character-card.is-killed {
  filter: grayscale(0.2);
  opacity: 0.8;
}

.character-card.is-robbed {
  box-shadow: inset 0 0 0 2px rgba(109, 76, 65, 0.5), 0 6px 16px rgba(0, 0, 0, 0.25);
}

.character-card.is-past {
  opacity: 0.6;
}

.character-card.is-selectable:not([aria-disabled='true']) {
  border-color: #198754;
  box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.25), 0 10px 24px rgba(0, 0, 0, 0.35);
}

@media (max-width: 720px) {
  .characters-layout {
    display: flex;
    flex-direction: column;
  }

  .character-card {
    flex-direction: row;
    align-items: stretch;
  }

  .card-visual {
    width: 90px;
    min-height: 90px;
  }

  .card-body {
    flex: 1 1 auto;
  }
}

@media (min-width: 1200px) {
  .characters-layout {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}
</style>
