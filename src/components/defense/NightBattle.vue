<template>
  <div class="night-battle">
    <div class="day-indicator">
      <span class="day-label">第 {{ defenseStore.currentDay }} 天</span>
      <span class="time-indicator" :class="{ night: defenseStore.isNight }">
        {{ defenseStore.isNight ? '🌙 夜晚' : '☀️ 白天' }}
      </span>
    </div>

    <div v-if="!defenseStore.isNight && !defenseStore.battleResult" class="preparation-phase">
      <h3>⏰ 准备夜袭防御</h3>
      <div class="prep-tips">
        <div class="tip-item" v-if="defenseStore.activeSentryPosts.length < 2">
          <span class="warning">⚠️</span>
          <span>建议激活至少2个哨位</span>
        </div>
        <div class="tip-item" v-if="defenseStore.nightWatches.length < 2">
          <span class="warning">⚠️</span>
          <span>建议安排至少2班守夜人</span>
        </div>
        <div class="tip-item" v-if="defenseStore.alertnessLevel < 30">
          <span class="warning">⚠️</span>
          <span>警觉度过低，夜袭可能被偷袭</span>
        </div>
        <div class="tip-item" v-if="defenseStore.overallDefense < 50">
          <span class="warning">⚠️</span>
          <span>防御力不足，建议建造防御建筑</span>
        </div>
        <div class="tip-item success" v-if="defenseStore.overallDefense >= 80 && defenseStore.nightWatches.length >= 3">
          <span class="success-icon">✅</span>
          <span>防御准备充分！</span>
        </div>
      </div>
      <el-button type="primary" size="large" @click="startNight" :loading="isStartingNight">
        🌙 进入夜晚
      </el-button>
    </div>

    <div v-if="defenseStore.isNight && defenseStore.currentAttack && !defenseStore.battleResult" class="night-attack-phase">
      <h3>⚔️ 夜袭警报！</h3>
      <div class="attack-info">
        <div class="enemy-info">
          <div class="enemy-type">
            <span class="enemy-icon">{{ getEnemyIcon(defenseStore.currentAttack.enemyType) }}</span>
            <span class="enemy-name">{{ getEnemyName(defenseStore.currentAttack.enemyType) }}</span>
          </div>
          <div class="enemy-stats">
            <div class="stat">
              <span class="stat-label">敌人数量:</span>
              <span class="stat-value">{{ defenseStore.currentAttack.enemyCount }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">敌人战力:</span>
              <span class="stat-value">{{ defenseStore.currentAttack.enemyStrength }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">总攻击力:</span>
              <span class="stat-value danger">{{ defenseStore.currentAttack.enemyStrength * defenseStore.currentAttack.enemyCount }}</span>
            </div>
          </div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="defense-info">
          <div class="defense-type">
            <span class="defense-icon">🛡️</span>
            <span class="defense-name">我方防御</span>
          </div>
          <div class="defense-stats">
            <div class="stat">
              <span class="stat-label">总防御力:</span>
              <span class="stat-value success">{{ defenseStore.overallDefense }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">警觉度:</span>
              <span class="stat-value" :class="{ danger: defenseStore.alertnessLevel < 30 }">
                {{ defenseStore.alertnessLevel }}
                <span v-if="defenseStore.alertnessLevel < 30">(偷袭惩罚 -30%)</span>
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">有效防御:</span>
              <span class="stat-value">{{ effectiveDefense }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="night-progress">
        <div class="progress-label">夜晚进度: {{ defenseStore.nightProgress }}%</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: defenseStore.nightProgress + '%' }"></div>
        </div>
      </div>
      <el-button type="danger" size="large" @click="executeBattle" :loading="isBattling">
        ⚔️ 迎战！
      </el-button>
    </div>

    <div v-if="defenseStore.battleResult" class="battle-result-phase">
      <h3 :class="{ victory: defenseStore.battleResult.victory, defeat: !defenseStore.battleResult.victory }">
        {{ defenseStore.battleResult.victory ? '🎉 防守成功！' : '💀 防守失败...' }}
      </h3>
      
      <div class="result-summary">
        <div class="result-item">
          <span class="result-label">击败敌人:</span>
          <span class="result-value">{{ defenseStore.battleResult.enemiesDefeated }} / {{ defenseStore.currentAttack?.enemyCount || 0 }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">获得经验:</span>
          <span class="result-value">+{{ defenseStore.battleResult.experienceGained }}</span>
        </div>
      </div>

      <div v-if="defenseStore.battleResult.injuredSurvivors.length > 0" class="result-section danger">
        <h4>🏥 伤员情况</h4>
        <div class="injured-list">
          <div v-for="id in defenseStore.battleResult.injuredSurvivors" :key="id" class="injured-item">
            <span class="name">{{ getSurvivorName(id) }}</span>
            <span class="status">受伤</span>
          </div>
        </div>
      </div>

      <div v-if="defenseStore.battleResult.buildingDamage.length > 0" class="result-section warning">
        <h4>🏚️ 建筑损坏</h4>
        <div class="damage-list">
          <div v-for="damage in defenseStore.battleResult.buildingDamage" :key="damage.buildingId" class="damage-item">
            <span class="name">{{ getBuildingName(damage.buildingId) }}</span>
            <span class="damage">-{{ damage.damage }} 耐久度</span>
          </div>
        </div>
      </div>

      <div v-if="defenseStore.battleResult.suppliesUsed.length > 0" class="result-section info">
        <h4>📦 消耗物资</h4>
        <div class="supplies-list">
          <div v-for="supply in defenseStore.battleResult.suppliesUsed" :key="supply.type" class="supply-item">
            <span class="name">{{ getSupplyName(supply.type) }}</span>
            <span class="amount">-{{ supply.amount }}</span>
          </div>
        </div>
      </div>

      <div class="plan-modifier">
        <h4>📋 次日计划调整</h4>
        <p class="modifier-text">{{ defenseStore.battleResult.nextDayPlanModifier }}</p>
      </div>

      <el-button type="primary" size="large" @click="advanceDay">
        ☀️ 进入第 {{ defenseStore.currentDay + 1 }} 天
      </el-button>
    </div>

    <div v-if="defenseStore.nextDayPlan" class="next-day-plan">
      <h3>📅 第 {{ defenseStore.currentDay + 1 }} 天行动计划</h3>
      <div v-if="defenseStore.nextDayPlan.modifiedByNightAttack" class="plan-modified">
        ⚠️ 计划因夜袭结果已调整
      </div>
      
      <div class="plan-actions">
        <h4>今日行动</h4>
        <div class="actions-list">
          <div v-for="(action, index) in defenseStore.nextDayPlan.actions" :key="index" class="action-item">
            <span class="action-index">{{ index + 1 }}.</span>
            <span class="action-name">{{ action }}</span>
          </div>
        </div>
      </div>

      <div class="plan-resources">
        <h4>资源分配</h4>
        <div class="resources-grid">
          <div class="resource-item">
            <span class="resource-icon">🍖</span>
            <span class="resource-amount">{{ defenseStore.nextDayPlan.resourceAllocation.food }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-icon">💧</span>
            <span class="resource-amount">{{ defenseStore.nextDayPlan.resourceAllocation.water }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-icon">🪵</span>
            <span class="resource-amount">{{ defenseStore.nextDayPlan.resourceAllocation.wood }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-icon">⛏️</span>
            <span class="resource-amount">{{ defenseStore.nextDayPlan.resourceAllocation.stone }}</span>
          </div>
        </div>
      </div>

      <div class="plan-assignments">
        <h4>人员分配</h4>
        <div class="assignments-list">
          <div v-for="assignment in defenseStore.nextDayPlan.survivorAssignments" :key="assignment.survivorId" class="assignment-item">
            <span class="survivor-name">{{ getSurvivorName(assignment.survivorId) }}</span>
            <span class="task">{{ assignment.task }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDefenseStore } from '../../store';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['day-advanced', 'battle-completed']);

const defenseStore = useDefenseStore();
const isStartingNight = ref(false);
const isBattling = ref(false);

const effectiveDefense = computed(() => {
  const surprisePenalty = defenseStore.alertnessLevel < 30 ? 0.7 : 1;
  return Math.floor(defenseStore.overallDefense * surprisePenalty);
});

const getEnemyIcon = (type) => {
  const icons = {
    wild_beasts: '🐺',
    raiders: '🗡️',
    zombies: '🧟',
    storm: '🌪️'
  };
  return icons[type] || '👹';
};

const getEnemyName = (type) => {
  const names = {
    wild_beasts: '野兽袭击',
    raiders: '掠夺者',
    zombies: '僵尸群',
    storm: '暴风雨'
  };
  return names[type] || type;
};

const getSurvivorName = (id) => {
  const survivor = defenseStore.survivors.find(s => s.id === id);
  return survivor ? survivor.name : '未知';
};

const getBuildingName = (id) => {
  const building = defenseStore.buildings.find(b => b.id === id);
  return building ? building.name : '未知';
};

const getSupplyName = (type) => {
  const names = {
    weapon: '武器',
    medicine: '药品',
    food: '食物',
    water: '饮水',
    tool: '工具'
  };
  return names[type] || type;
};

const startNight = async () => {
  isStartingNight.value = true;
  try {
    defenseStore.startNight();
    ElMessage.warning('夜幕降临，注意警戒！');
    
    const progressInterval = setInterval(() => {
      defenseStore.progressNight(10);
      if (defenseStore.nightProgress >= 30) {
        clearInterval(progressInterval);
      }
    }, 500);
    
    setTimeout(() => clearInterval(progressInterval), 3000);
  } finally {
    isStartingNight.value = false;
  }
};

const executeBattle = async () => {
  isBattling.value = true;
  try {
    const result = defenseStore.executeBattle();
    if (result) {
      emit('battle-completed', result);
      if (result.victory) {
        ElMessage.success('成功击退敌人！');
      } else {
        ElMessage.error('防守失败，损失惨重...');
      }
    }
  } finally {
    isBattling.value = false;
  }
};

const advanceDay = () => {
  defenseStore.advanceToNextDay();
  emit('day-advanced');
  ElMessage.success(`新的一天开始了！第 ${defenseStore.currentDay} 天`);
};
</script>

<style scoped>
.night-battle {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.day-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.day-label {
  font-size: 20px;
  font-weight: bold;
}

.time-indicator {
  font-size: 16px;
  padding: 5px 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.time-indicator.night {
  background: rgba(0, 0, 0, 0.3);
}

.preparation-phase h3,
.night-attack-phase h3,
.battle-result-phase h3,
.next-day-plan h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.prep-tips {
  margin-bottom: 20px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 8px;
  background: #fef0f0;
  border-radius: 6px;
  font-size: 14px;
  color: #f56c6c;
}

.tip-item.success {
  background: #f0f9eb;
  color: #67c23a;
}

.warning {
  font-size: 18px;
}

.success-icon {
  font-size: 18px;
}

.attack-info {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.enemy-info,
.defense-info {
  flex: 1;
  text-align: center;
}

.enemy-type,
.defense-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.enemy-icon,
.defense-icon {
  font-size: 48px;
}

.enemy-name,
.defense-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.enemy-stats .stat,
.defense-stats .stat {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  margin-bottom: 5px;
  background: white;
  border-radius: 4px;
}

.stat-label {
  color: #666;
  font-size: 13px;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.success {
  color: #67c23a;
}

.vs-divider {
  font-size: 32px;
  font-weight: bold;
  color: #999;
  padding: 0 20px;
}

.night-progress {
  margin-bottom: 20px;
}

.progress-label {
  text-align: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.battle-result-phase h3.victory {
  color: #67c23a;
}

.battle-result-phase h3.defeat {
  color: #f56c6c;
}

.result-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.result-item {
  text-align: center;
}

.result-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.result-section {
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
}

.result-section.danger {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.result-section.warning {
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
}

.result-section.info {
  background: #ecf5ff;
  border-left: 4px solid #409eff;
}

.result-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.injured-list,
.damage-list,
.supplies-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.injured-item,
.damage-item,
.supply-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.injured-item .status,
.damage-item .damage {
  color: #f56c6c;
  font-weight: bold;
}

.supply-item .amount {
  color: #f56c6c;
  font-weight: bold;
}

.plan-modifier {
  padding: 15px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #67c23a;
}

.plan-modifier h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #67c23a;
}

.modifier-text {
  margin: 0;
  color: #333;
  font-size: 14px;
}

.next-day-plan {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 2px dashed #e0e0e0;
}

.plan-modified {
  display: inline-block;
  padding: 5px 15px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 15px;
  font-size: 13px;
  margin-bottom: 15px;
}

.plan-actions,
.plan-resources,
.plan-assignments {
  margin-bottom: 15px;
}

.plan-actions h4,
.plan-resources h4,
.plan-assignments h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.action-index {
  font-weight: bold;
  color: #667eea;
}

.action-name {
  color: #333;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resource-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.resource-amount {
  font-weight: bold;
  font-size: 18px;
  color: #333;
}

.assignments-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.assignment-item .survivor-name {
  font-weight: bold;
  color: #333;
}

.assignment-item .task {
  color: #667eea;
  font-size: 13px;
}

.el-button {
  margin-top: 15px;
}
</style>
