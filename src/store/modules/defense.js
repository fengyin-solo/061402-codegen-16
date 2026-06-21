import { defineStore } from 'pinia';

export default defineStore('defense', {
  state: () => ({
    overallDefense: 0,
    alertLevel: 'green',
    currentDay: 1,
    survivors: [
      { id: 1, name: '阿强', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, combat: 15, perception: 12, status: 'idle' },
      { id: 2, name: '小美', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, combat: 8, perception: 18, status: 'idle' },
      { id: 3, name: '老王', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, combat: 20, perception: 10, status: 'idle' },
      { id: 4, name: '小李', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, combat: 10, perception: 15, status: 'idle' }
    ],
    buildings: [
      { id: 1, name: '主庇护所', type: 'shelter', level: 1, durability: 100, maxDurability: 100, defenseBonus: 10, built: true },
      { id: 2, name: '瞭望塔', type: 'watchtower', level: 1, durability: 80, maxDurability: 80, defenseBonus: 20, built: false },
      { id: 3, name: '围墙', type: 'wall', level: 1, durability: 150, maxDurability: 150, defenseBonus: 25, built: false },
      { id: 4, name: '仓库', type: 'storage', level: 1, durability: 100, maxDurability: 100, defenseBonus: 5, built: false },
      { id: 5, name: '工坊', type: 'workshop', level: 1, durability: 100, maxDurability: 100, defenseBonus: 5, built: false }
    ],
    sentryPosts: [
      { id: 1, name: '东侧哨位', location: '营地东侧', buildingId: undefined, guardId: undefined, defenseValue: 10, alertLevel: 5, status: 'active' },
      { id: 2, name: '西侧哨位', location: '营地西侧', buildingId: undefined, guardId: undefined, defenseValue: 10, alertLevel: 5, status: 'active' },
      { id: 3, name: '南侧哨位', location: '营地南侧', buildingId: undefined, guardId: undefined, defenseValue: 10, alertLevel: 5, status: 'inactive' },
      { id: 4, name: '北侧哨位', location: '营地北侧', buildingId: undefined, guardId: undefined, defenseValue: 10, alertLevel: 5, status: 'inactive' }
    ],
    nightWatches: [],
    emergencySupplies: [
      { type: 'weapon', name: '木矛', quantity: 4, allocated: 0, effectiveness: 15 },
      { type: 'weapon', name: '石斧', quantity: 2, allocated: 0, effectiveness: 25 },
      { type: 'medicine', name: '草药', quantity: 10, allocated: 0, effectiveness: 20 },
      { type: 'medicine', name: '绷带', quantity: 5, allocated: 0, effectiveness: 30 },
      { type: 'food', name: '干粮', quantity: 20, allocated: 0, effectiveness: 10 },
      { type: 'water', name: '储水', quantity: 15, allocated: 0, effectiveness: 10 },
      { type: 'tool', name: '火把', quantity: 8, allocated: 0, effectiveness: 20 }
    ],
    nightAttackHistory: [],
    dayPlans: [],
    currentAttack: null,
    battleResult: null,
    isNight: false,
    nightProgress: 0
  }),

  getters: {
    availableSurvivors: (state) => {
      return state.survivors.filter(s => s.status === 'idle' && s.health > 30);
    },
    activeSentryPosts: (state) => {
      return state.sentryPosts.filter(s => s.status === 'active');
    },
    totalDefense: (state) => {
      let defense = 0;
      state.sentryPosts.forEach(post => {
        if (post.status === 'active') {
          defense += post.defenseValue;
          if (post.guardId) {
            const guard = state.survivors.find(s => s.id === post.guardId);
            if (guard) {
              defense += guard.combat;
            }
          }
          if (post.buildingId) {
            const building = state.buildings.find(b => b.id === post.buildingId && b.built);
            if (building) {
              defense += building.defenseBonus;
            }
          }
        }
      });
      state.buildings.forEach(b => {
        if (b.built) {
          defense += b.defenseBonus * (b.durability / b.maxDurability);
        }
      });
      state.nightWatches.forEach(watch => {
        const survivor = state.survivors.find(s => s.id === watch.survivorId);
        if (survivor) {
          defense += survivor.perception * 0.5;
        }
      });
      state.emergencySupplies.forEach(supply => {
        if (supply.type === 'weapon') {
          defense += supply.allocated * supply.effectiveness * 0.3;
        }
      });
      return Math.floor(defense);
    },
    alertnessLevel: (state) => {
      let alertness = 0;
      state.nightWatches.forEach(watch => {
        alertness += watch.alertness;
      });
      state.sentryPosts.forEach(post => {
        if (post.status === 'active') {
          alertness += post.alertLevel;
        }
      });
      return alertness;
    },
    currentDayPlan: (state) => {
      return state.dayPlans.find(p => p.day === state.currentDay);
    },
    nextDayPlan: (state) => {
      return state.dayPlans.find(p => p.day === state.currentDay + 1);
    }
  },

  actions: {
    assignGuardToSentry(sentryId, survivorId) {
      const sentry = this.sentryPosts.find(s => s.id === sentryId);
      const survivor = this.survivors.find(s => s.id === survivorId);
      
      if (!sentry || !survivor) return false;
      if (survivor.status !== 'idle' || survivor.health <= 30) return false;
      
      const existingAssignment = this.sentryPosts.find(s => s.guardId === survivorId);
      if (existingAssignment) {
        existingAssignment.guardId = undefined;
      }
      
      sentry.guardId = survivorId;
      survivor.status = 'guarding';
      this.updateOverallDefense();
      return true;
    },
    
    removeGuardFromSentry(sentryId) {
      const sentry = this.sentryPosts.find(s => s.id === sentryId);
      if (!sentry || !sentry.guardId) return false;
      
      const survivor = this.survivors.find(s => s.id === sentry.guardId);
      if (survivor) {
        survivor.status = 'idle';
      }
      sentry.guardId = undefined;
      this.updateOverallDefense();
      return true;
    },
    
    assignNightWatch(survivorId, shift) {
      const survivor = this.survivors.find(s => s.id === survivorId);
      if (!survivor || survivor.status !== 'idle' || survivor.health <= 30) return false;
      
      const existingWatch = this.nightWatches.find(w => w.survivorId === survivorId);
      if (existingWatch) {
        const index = this.nightWatches.indexOf(existingWatch);
        this.nightWatches.splice(index, 1);
      }
      
      const shiftConflict = this.nightWatches.find(w => w.shift === shift);
      if (shiftConflict) {
        const existingSurvivor = this.survivors.find(s => s.id === shiftConflict.survivorId);
        if (existingSurvivor) {
          existingSurvivor.status = 'idle';
        }
        const index = this.nightWatches.indexOf(shiftConflict);
        this.nightWatches.splice(index, 1);
      }
      
      const shiftTimes = {
        first: { start: '20:00', end: '24:00' },
        second: { start: '00:00', end: '04:00' },
        third: { start: '04:00', end: '08:00' }
      };
      
      const time = shiftTimes[shift];
      survivor.status = 'guarding';
      this.nightWatches.push({
        survivorId,
        shift,
        startTime: time.start,
        endTime: time.end,
        alertness: Math.floor(survivor.perception * 0.8 + survivor.stamina * 0.2)
      });
      this.updateOverallDefense();
      return true;
    },
    
    removeNightWatch(survivorId) {
      const watchIndex = this.nightWatches.findIndex(w => w.survivorId === survivorId);
      if (watchIndex === -1) return false;
      
      const survivor = this.survivors.find(s => s.id === survivorId);
      if (survivor) {
        survivor.status = 'idle';
      }
      
      this.nightWatches.splice(watchIndex, 1);
      this.updateOverallDefense();
      return true;
    },
    
    allocateEmergencySupply(supplyType, amount) {
      const supply = this.emergencySupplies.find(s => s.type === supplyType);
      if (!supply) return false;
      
      const available = supply.quantity - supply.allocated;
      if (amount > available) return false;
      
      supply.allocated += amount;
      this.updateOverallDefense();
      return true;
    },
    
    deallocateEmergencySupply(supplyType, amount) {
      const supply = this.emergencySupplies.find(s => s.type === supplyType);
      if (!supply) return false;
      
      if (amount > supply.allocated) return false;
      
      supply.allocated -= amount;
      this.updateOverallDefense();
      return true;
    },
    
    activateSentryPost(sentryId) {
      const sentry = this.sentryPosts.find(s => s.id === sentryId);
      if (!sentry) return false;
      sentry.status = 'active';
      this.updateOverallDefense();
      return true;
    },
    
    deactivateSentryPost(sentryId) {
      const sentry = this.sentryPosts.find(s => s.id === sentryId);
      if (!sentry) return false;
      if (sentry.guardId) {
        this.removeGuardFromSentry(sentryId);
      }
      sentry.status = 'inactive';
      this.updateOverallDefense();
      return true;
    },
    
    buildBuilding(buildingId, resources) {
      const building = this.buildings.find(b => b.id === buildingId);
      if (!building || building.built) return false;
      
      const costs = {
        watchtower: { wood: 80, stone: 40 },
        wall: { wood: 100, stone: 80 },
        storage: { wood: 60, stone: 20 },
        workshop: { wood: 70, stone: 30 }
      };
      
      const cost = costs[building.type];
      if (!cost) return false;
      
      if (resources.wood < cost.wood || resources.stone < cost.stone) {
        return false;
      }
      
      resources.wood -= cost.wood;
      resources.stone -= cost.stone;
      building.built = true;
      
      this.sentryPosts.forEach((post, index) => {
        if (index < 2 && building.type === 'watchtower') {
          post.buildingId = buildingId;
          post.defenseValue += 15;
        }
        if (building.type === 'wall') {
          post.defenseValue += 10;
        }
      });
      
      this.updateOverallDefense();
      return true;
    },
    
    updateOverallDefense() {
      this.overallDefense = this.totalDefense;
      this.updateAlertLevel();
    },
    
    updateAlertLevel() {
      const defense = this.overallDefense;
      if (defense >= 100) {
        this.alertLevel = 'green';
      } else if (defense >= 70) {
        this.alertLevel = 'yellow';
      } else if (defense >= 40) {
        this.alertLevel = 'orange';
      } else {
        this.alertLevel = 'red';
      }
    },
    
    generateNightAttack() {
      const enemyTypes = ['wild_beasts', 'raiders', 'zombies', 'storm'];
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      const baseStrength = 30 + this.currentDay * 10;
      const randomFactor = 0.8 + Math.random() * 0.4;
      const enemyStrength = Math.floor(baseStrength * randomFactor);
      const enemyCount = Math.floor(3 + Math.random() * 5 + this.currentDay * 0.5);
      
      this.currentAttack = {
        id: Date.now(),
        day: this.currentDay,
        enemyType,
        enemyStrength,
        enemyCount,
        status: 'pending'
      };
      
      return this.currentAttack;
    },
    
    executeBattle() {
      if (!this.currentAttack) return null;
      
      this.currentAttack.status = 'in_progress';
      
      const defense = this.totalDefense;
      const alertness = this.alertnessLevel;
      const surprisePenalty = alertness < 30 ? 0.7 : 1;
      const effectiveDefense = defense * surprisePenalty;
      
      const attackPower = this.currentAttack.enemyStrength * this.currentAttack.enemyCount;
      const victory = effectiveDefense >= attackPower * 0.8;
      
      const damageRatio = victory ? 0.3 : 0.8;
      const enemiesDefeated = Math.floor(this.currentAttack.enemyCount * (victory ? 0.9 : 0.4));
      
      const casualties = victory ? 0 : Math.floor(Math.random() * 2);
      const injuredSurvivors = [];
      
      if (!victory || Math.random() > 0.7) {
        const possibleInjured = this.survivors.filter(s => s.status === 'guarding' || s.status === 'idle');
        const injuryCount = Math.min(possibleInjured.length, Math.floor(Math.random() * 3) + (victory ? 0 : 1));
        for (let i = 0; i < injuryCount; i++) {
          const randomSurvivor = possibleInjured[Math.floor(Math.random() * possibleInjured.length)];
          if (!injuredSurvivors.includes(randomSurvivor.id)) {
            injuredSurvivors.push(randomSurvivor.id);
            const damage = Math.floor(20 + Math.random() * 30) * damageRatio;
            randomSurvivor.health = Math.max(0, randomSurvivor.health - damage);
            if (randomSurvivor.health <= 0) {
              randomSurvivor.status = 'injured';
            }
          }
        }
      }
      
      const buildingDamage = [];
      if (!victory || Math.random() > 0.6) {
        const builtBuildings = this.buildings.filter(b => b.built);
        const activeSentries = this.sentryPosts.filter(s => s.status === 'active');
        
        builtBuildings.forEach(building => {
          if (Math.random() > 0.5) {
            const damage = Math.floor((10 + Math.random() * 20) * damageRatio);
            building.durability = Math.max(0, building.durability - damage);
            buildingDamage.push({ buildingId: building.id, damage });
          }
        });
        
        activeSentries.forEach(sentry => {
          if (Math.random() > 0.7) {
            sentry.status = 'damaged';
            sentry.defenseValue = Math.max(5, sentry.defenseValue - 5);
          }
        });
      }
      
      const suppliesUsed = [];
      if (this.currentAttack.enemyType !== 'storm') {
        const weaponSupply = this.emergencySupplies.find(s => s.type === 'weapon' && s.allocated > 0);
        if (weaponSupply) {
          const used = Math.min(weaponSupply.allocated, Math.ceil(enemiesDefeated * 0.2));
          if (used > 0) {
            weaponSupply.allocated -= used;
            weaponSupply.quantity -= used;
            suppliesUsed.push({ type: 'weapon', amount: used });
          }
        }
      }
      
      if (injuredSurvivors.length > 0) {
        const medicineSupply = this.emergencySupplies.find(s => s.type === 'medicine' && s.allocated > 0);
        if (medicineSupply) {
          const used = Math.min(medicineSupply.allocated, injuredSurvivors.length);
          if (used > 0) {
            medicineSupply.allocated -= used;
            medicineSupply.quantity -= used;
            suppliesUsed.push({ type: 'medicine', amount: used });
            
            injuredSurvivors.forEach(id => {
              const survivor = this.survivors.find(s => s.id === id);
              if (survivor) {
                survivor.health = Math.min(survivor.maxHealth, survivor.health + 20 * used);
              }
            });
          }
        }
      }
      
      const nextDayPlanModifier = this.generatePlanModifier(victory, injuredSurvivors.length, buildingDamage.length);
      const experienceGained = Math.floor(enemiesDefeated * 10 + (victory ? 50 : 10));
      
      this.battleResult = {
        attackId: this.currentAttack.id,
        victory,
        enemiesDefeated,
        casualties,
        injuredSurvivors,
        buildingDamage,
        suppliesUsed,
        experienceGained,
        nextDayPlanModifier
      };
      
      this.survivors.forEach(s => {
        if (s.status === 'guarding') {
          s.stamina = Math.max(0, s.stamina - 20);
        }
      });
      
      this.currentAttack.status = 'completed';
      this.nightAttackHistory.push({
        attack: { ...this.currentAttack },
        result: { ...this.battleResult }
      });
      
      this.generateNextDayPlan();
      this.updateOverallDefense();
      
      return this.battleResult;
    },
    
    generatePlanModifier(victory, injuries, damage) {
      if (!victory) {
        if (injuries > 2 || damage > 2) {
          return '重大损失：次日需优先治疗伤员和修复建筑，资源采集效率降低50%';
        }
        return '夜袭失败：次日需加强防御，部分人员需休息恢复';
      }
      if (injuries > 0 || damage > 0) {
        return '惨胜：次日需要治疗伤员和修复设施，部分任务延后';
      }
      return '完胜：士气大振，次日所有行动效率提升20%';
    },
    
    generateNextDayPlan() {
      const nextDay = this.currentDay + 1;
      const existingPlan = this.dayPlans.find(p => p.day === nextDay);
      
      const baseActions = ['采集食物', '收集淡水', '砍伐木材', '挖掘石头'];
      const actions = [...baseActions];
      
      const resourceAllocation = { food: 15, water: 15, wood: 10, stone: 10 };
      const survivorAssignments = [];
      
      let modified = false;
      
      if (this.battleResult) {
        modified = true;
        
        if (this.battleResult.injuredSurvivors.length > 0) {
          actions.unshift('治疗伤员');
          resourceAllocation.food += 10;
          resourceAllocation.water += 5;
        }
        
        if (this.battleResult.buildingDamage.length > 0) {
          actions.unshift('修复建筑');
          resourceAllocation.wood += 15;
          resourceAllocation.stone += 10;
        }
        
        if (!this.battleResult.victory) {
          actions.unshift('加强警戒');
        }
        
        if (this.battleResult.victory && this.battleResult.injuredSurvivors.length === 0) {
          actions.push('探索新区域');
        }
      }
      
      this.survivors.forEach(survivor => {
        let task = '空闲';
        if (survivor.health < 50) {
          task = '休息恢复';
        } else if (this.battleResult && this.battleResult.injuredSurvivors.includes(survivor.id)) {
          task = '养伤';
        } else if (survivor.combat >= 15) {
          task = this.battleResult && !this.battleResult.victory ? '警戒巡逻' : '采集资源';
        } else if (survivor.perception >= 15) {
          task = '收集资源';
        } else {
          task = '辅助工作';
        }
        survivorAssignments.push({ survivorId: survivor.id, task });
      });
      
      if (existingPlan) {
        existingPlan.actions = actions;
        existingPlan.resourceAllocation = resourceAllocation;
        existingPlan.survivorAssignments = survivorAssignments;
        existingPlan.modifiedByNightAttack = modified;
      } else {
        this.dayPlans.push({
          day: nextDay,
          actions,
          resourceAllocation,
          survivorAssignments,
          modifiedByNightAttack: modified
        });
      }
      
      return this.dayPlans.find(p => p.day === nextDay);
    },
    
    advanceToNextDay() {
      this.currentDay++;
      this.isNight = false;
      this.nightProgress = 0;
      this.currentAttack = null;
      this.battleResult = null;
      
      this.nightWatches = [];
      
      this.survivors.forEach(s => {
        if (s.status === 'guarding' || s.status === 'resting') {
          s.status = 'idle';
        }
        s.stamina = Math.min(s.maxStamina, s.stamina + 30);
        if (s.health > 0 && s.health < s.maxHealth) {
          s.health = Math.min(s.maxHealth, s.health + 10);
          if (s.health > 30 && s.status === 'injured') {
            s.status = 'idle';
          }
        }
      });
      
      this.sentryPosts.forEach(post => {
        if (post.status === 'damaged') {
          post.status = 'inactive';
        }
      });
      
      this.emergencySupplies.forEach(supply => {
        supply.allocated = 0;
      });
      
      this.updateOverallDefense();
    },
    
    repairBuilding(buildingId, resources) {
      const building = this.buildings.find(b => b.id === buildingId);
      if (!building || !building.built) return false;
      
      const damage = building.maxDurability - building.durability;
      if (damage <= 0) return false;
      
      const woodCost = Math.ceil(damage * 0.5);
      const stoneCost = Math.ceil(damage * 0.3);
      
      if (resources.wood < woodCost || resources.stone < stoneCost) {
        return false;
      }
      
      resources.wood -= woodCost;
      resources.stone -= stoneCost;
      building.durability = building.maxDurability;
      
      this.updateOverallDefense();
      return true;
    },
    
    repairSentryPost(sentryId, resources) {
      const sentry = this.sentryPosts.find(s => s.id === sentryId);
      if (!sentry || sentry.status !== 'damaged') return false;
      
      const woodCost = 10;
      const stoneCost = 5;
      
      if (resources.wood < woodCost || resources.stone < stoneCost) {
        return false;
      }
      
      resources.wood -= woodCost;
      resources.stone -= stoneCost;
      sentry.status = 'inactive';
      sentry.defenseValue = 10;
      
      this.updateOverallDefense();
      return true;
    },
    
    startNight() {
      this.isNight = true;
      this.nightProgress = 0;
      this.generateNightAttack();
    },
    
    progressNight(amount) {
      if (!this.isNight) return;
      this.nightProgress = Math.min(100, this.nightProgress + amount);
    }
  }
});
