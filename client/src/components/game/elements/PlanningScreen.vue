<template>
  <div class="planning-screen surface">
    <div class="header">
      <h2>PLAN YOUR TURN</h2>
      <div class="timer">Time Remaining: {{ timeLeft }}s</div>
    </div>

    <div v-if="submitted" class="submitted-message">
      <h3>Plan Submitted</h3>
      <p>Waiting for other players...</p>
    </div>

    <form v-else @submit.prevent="submitPlan" class="planning-form">
      <!-- Role Info -->
      <div class="section role-info">
        <h3>Your Role: <span class="role-name">{{ roleName }}</span></h3>
        <p class="role-desc">{{ roleDescription }}</p>
      </div>

      <!-- Gather Action -->
      <div class="section gather-action">
        <h3>1. Gather Resources</h3>
        <div class="options">
          <label class="radio-option" :class="{ selected: gatherAction === 1 }">
            <input type="radio" v-model="gatherAction" :value="1">
            <span class="icon">💰</span>
            <div class="details">
              <span class="title">Take Dirty Cash</span>
              <span class="subtitle">Gain {{ cashAmount }} Cash</span>
            </div>
          </label>
          <label class="radio-option" :class="{ selected: gatherAction === 2 }">
            <input type="radio" v-model="gatherAction" :value="2">
            <span class="icon">🃏</span>
            <div class="details">
              <span class="title">Draw Assets</span>
              <span class="subtitle">{{ drawDescription }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Ability Action -->
      <div v-if="hasActiveAbility" class="section ability-action">
        <h3>2. Role Ability (Optional)</h3>

        <!-- Target Player Selector -->
        <div v-if="needsPlayerTarget" class="target-selector">
          <label>Select Target Player:</label>
          <select v-model="abilityTarget">
            <option :value="undefined">No Target</option>
            <option v-for="p in opponents" :key="p.id" :value="p.pos">
              {{ p.username }} ({{ p.assets }} assets)
            </option>
          </select>
        </div>

        <!-- Target Role Selector -->
        <div v-if="needsRoleTarget" class="target-selector">
          <label>Select Target Role:</label>
          <select v-model="abilityTarget">
            <option :value="undefined">No Target</option>
            <option v-for="r in validRoleTargets" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select>
        </div>

        <!-- Enforcer Options -->
        <div v-if="isEnforcer" class="enforcer-options">
           <div class="tabs">
             <button type="button" :class="{ active: enforcerMode === 'DESTROY' }" @click="enforcerMode = 'DESTROY'">Destroy Asset</button>
             <button type="button" :class="{ active: enforcerMode === 'ACCUSE' }" @click="enforcerMode = 'ACCUSE'">Accuse Rat</button>
           </div>

           <div v-if="enforcerMode === 'DESTROY'" class="sub-option">
              <!-- Select Player then Asset -->
              <select v-model="destroyTargetPlayerId">
                  <option :value="undefined">Select Player</option>
                  <option v-for="p in opponents" :key="p.id" :value="p.id">
                      {{ p.username }}
                  </option>
              </select>
              <select v-if="destroyTargetPlayerId" v-model="destroyAssetId">
                  <option :value="undefined">Select Asset</option>
                  <option v-for="asset in getTargetAssets(destroyTargetPlayerId)" :key="asset.id" :value="asset.id">
                      {{ asset.name }} (Cost: {{ asset.cost }})
                  </option>
              </select>
           </div>

           <div v-if="enforcerMode === 'ACCUSE'" class="sub-option">
              <p>Guess who is the Rat. Wrong guess cost 3 Cash.</p>
              <select v-model="abilityTarget">
                  <option :value="undefined">Select Suspect</option>
                  <option v-for="p in opponents" :key="p.id" :value="p.pos">
                      {{ p.username }}
                  </option>
              </select>
           </div>
        </div>
      </div>

      <!-- Build Action -->
      <div class="section build-action">
        <h3>3. Build Assets (Optional)</h3>
        <p class="subtitle">Select assets to build (Max {{ buildLimit }})</p>
        <div class="hand-grid">
          <div
            v-for="card in hand"
            :key="card.id"
            class="card-item"
            :class="{ selected: selectedBuild.includes(card.id), disabled: !canBuild(card) }"
            @click="toggleBuild(card)"
          >
            <span class="card-name">{{ card.name }}</span>
            <span class="card-cost">{{ card.cost }}💰</span>
            <span class="card-color" :style="{ backgroundColor: card.color }"></span>
          </div>
        </div>
      </div>

      <!-- Rat Action -->
      <div v-if="isRat" class="section rat-action">
        <h3>🐀 The Rat</h3>
        <label class="checkbox-option">
          <input type="checkbox" v-model="activateRat">
          <span class="label-text">Trigger DEA RAID? (Richest loses half cash)</span>
        </label>
      </div>

      <button type="submit" class="submit-btn" :disabled="!isValid">SUBMIT PLAN</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { RoleType, MoveType, GatherActionType, PlanSubmission } from 'citadels-common';
import { store } from '../../../store';

export default defineComponent({
  name: 'PlanningScreen',
  data() {
    return {
      timeLeft: 60,
      submitted: false,
      gatherAction: 1, // 1 = Cash, 2 = Cards
      abilityTarget: undefined as number | undefined,
      selectedBuild: [] as string[],
      activateRat: false,
      enforcerMode: 'DESTROY' as 'DESTROY' | 'ACCUSE',
      destroyTargetPlayerId: undefined as string | undefined,
      destroyAssetId: undefined as string | undefined,
    };
  },
  mounted() {
    this.startTimer();
  },
  computed: {
    ...mapGetters(['gameState', 'gameSetupData', 'currentPlayerId', 'getDistrictFromId']),
    myRole() {
      const selfId = this.gameState.self;
      const player = this.gameState.board.players.get(selfId);
      if (!player || !player.characters || player.characters.length === 0) return RoleType.NONE;
      return player.characters[0].id;
    },
    isRat() {
        // Need to check if I am the rat.
        // BoardState export needs to send this info.
        const selfId = this.gameState.self;
        const playerBoard = this.gameState.board.players.get(selfId);
        return playerBoard.isRat;
    },
    roleName() {
      const names = ['None', 'Sicario', 'Mole', 'Launderer', 'Boss', 'Politician', 'Trafficker', 'Cook', 'Enforcer'];
      return names[this.myRole] || 'Unknown';
    },
    roleDescription() {
        const descs = [
            '',
            'Assassinates a role.',
            'Steals cash from a role.',
            'Swaps hand with player or redraws.',
            'Get income from Yellow assets.',
            'Get income from Blue assets.',
            'Get income from Green assets. Takes 3 cash instead of 2.',
            'Draws 4 cards keeps 1. Builds up to 3 assets.',
            'Destroys assets or Accuses the Rat.'
        ];
        return descs[this.myRole] || '';
    },
    cashAmount() {
        return this.myRole === RoleType.TRAFFICKER ? 3 : 2;
    },
    drawDescription() {
        return this.myRole === RoleType.COOK ? 'Draw 4 Keep 1' : 'Draw 2 Keep 1';
    },
    hasActiveAbility() {
        return [RoleType.SICARIO, RoleType.MOLE, RoleType.LAUNDERER, RoleType.ENFORCER].includes(this.myRole);
    },
    needsPlayerTarget() {
        return [RoleType.LAUNDERER].includes(this.myRole); // Launderer swap targets player
        // Enforcer also targets player but has complex UI
    },
    needsRoleTarget() {
        return [RoleType.SICARIO, RoleType.MOLE].includes(this.myRole);
    },
    isEnforcer() {
        return this.myRole === RoleType.ENFORCER;
    },
    opponents() {
        // Return list of opponents for targeting
        return this.gameState.board.playerOrder
            .filter((pid: string) => pid !== this.gameState.self)
            .map((pid: string) => {
                const p = this.gameState.players.get(pid);
                const b = this.gameState.board.players.get(pid);
                const pos = this.gameState.board.playerOrder.indexOf(pid);
                return {
                    id: pid,
                    username: p.username,
                    pos: pos,
                    assets: b.city.length
                };
            });
    },
    validRoleTargets() {
        const roles = [];
        const names = ['None', 'Sicario', 'Mole', 'Launderer', 'Boss', 'Politician', 'Trafficker', 'Cook', 'Enforcer'];
        // Cannot target self (Sicario/Mole) - logic elsewhere but UI should help
        for (let i = 1; i <= 8; i++) {
             // Logic to filter if needed
             roles.push({ id: i, name: names[i] });
        }
        return roles;
    },
    hand() {
        const selfId = this.gameState.self;
        const player = this.gameState.board.players.get(selfId);
        return player.hand.map((id: string) => {
            const district = this.getDistrictFromId(id);
            return {
                id,
                name: id.replace(/_/g, ' '), // Basic format
                cost: district?.cost || 0,
                color: this.getColor(district?.type)
            };
        });
    },
    buildLimit() {
        return this.myRole === RoleType.COOK ? 3 : 1;
    },
    isValid() {
        // Basic validation
        if (this.needsRoleTarget && !this.abilityTarget) return false;
        // Enforcer validation
        if (this.isEnforcer) {
            if (this.enforcerMode === 'DESTROY' && (!this.destroyTargetPlayerId || !this.destroyAssetId)) return false; // Optional? "Optional Build". Ability?
            // Ability is usually optional.
            // But if I selected Enforcer mode, I probably want to use it.
            // Actually, ability is optional. So if nothing selected, it means "No Ability".
            // But I bind "abilityTarget" to select.
            // If undefined, implies no ability use.
        }
        return true;
    },
  },
  methods: {
    startTimer() {
        const timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                clearInterval(timer);
                if (!this.submitted) this.submitPlan();
            }
        }, 1000);
    },
    getColor(type: number) {
        const colors = ['#ccc', '#FDD835', '#1E88E5', '#43A047', '#E53935', '#8E24AA']; // None, Yellow, Blue, Green, Red, Purple
        return colors[type] || '#ccc';
    },
    canBuild(card: any) {
        const selfId = this.gameState.self;
        const player = this.gameState.board.players.get(selfId);
        // Approximation of cost check (doesn't account for income gained this turn)
        // User must estimate.
        return true;
    },
    toggleBuild(card: any) {
        const idx = this.selectedBuild.indexOf(card.id);
        if (idx >= 0) {
            this.selectedBuild.splice(idx, 1);
        } else {
            if (this.selectedBuild.length < this.buildLimit) {
                this.selectedBuild.push(card.id);
            }
        }
    },
    getTargetAssets(playerId: string) {
        const p = this.gameState.board.players.get(playerId);
        if (!p) return [];
        return p.city.map((id: string) => {
            const district = this.getDistrictFromId(id);
             return {
                id,
                name: id.replace(/_/g, ' '),
                cost: district?.cost || 0
            };
        });
    },
    async submitPlan() {
      const submission: PlanSubmission = {
          gatherAction: this.gatherAction,
          buildAction: this.selectedBuild.map(id => ({ districtId: id })),
          activateRat: this.activateRat
      };

      // Ability Data
      if (this.isEnforcer) {
          if (this.enforcerMode === 'ACCUSE' && this.abilityTarget !== undefined) {
              submission.abilityTarget = this.abilityTarget;
              submission.abilityData = { type: 'ACCUSE_RAT' };
          } else if (this.enforcerMode === 'DESTROY' && this.destroyTargetPlayerId && this.destroyAssetId) {
              submission.abilityData = {
                  type: 'DESTROY_ASSET',
                  targetPlayerId: this.destroyTargetPlayerId,
                  assetId: this.destroyAssetId
              };
          }
      } else if (this.myRole === RoleType.LAUNDERER) {
          // Simplification: Always Swap Player for now as UI for discard/draw is complex
          // Or add UI for Discard Hand
          // Assuming Swap Player if target selected
          if (this.abilityTarget !== undefined) {
              submission.abilityTarget = this.abilityTarget;
              submission.abilityData = { type: 'SWAP_PLAYER' };
          }
      } else if (this.needsRoleTarget && this.abilityTarget) {
          submission.abilityTarget = this.abilityTarget;
      }

      try {
        await store.dispatch('sendMove', {
            type: MoveType.SUBMIT_PLAN,
            data: submission
        });
        this.submitted = true;
      } catch (e) {
        console.error(e);
      }
    }
  }
});
</script>

<style scoped>
.planning-screen {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    color: white;
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
}
.section {
    margin-bottom: 2rem;
    background: rgba(255,255,255,0.05);
    padding: 1rem;
    border-radius: 8px;
}
.options {
    display: flex;
    gap: 1rem;
}
.radio-option {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    cursor: pointer;
}
.radio-option.selected {
    background: rgba(0, 123, 255, 0.2);
    border-color: #007bff;
}
.icon {
    font-size: 2rem;
}
.hand-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
}
.card-item {
    border: 1px solid rgba(255,255,255,0.2);
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.card-item.selected {
    border-color: #28a745;
    background: rgba(40, 167, 69, 0.2);
}
.card-color {
    display: block;
    height: 4px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}
.submit-btn {
    width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
    background: linear-gradient(90deg, #ff6b35, #ffa500);
    border: none;
    border-radius: 50px;
    color: white;
    font-weight: bold;
    cursor: pointer;
}
.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
