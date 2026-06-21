<template>
  <div class="night-watch">
    <h3>🌙 守夜排班</h3>
    <div class="alertness-info">
      <span class="label">总警觉度:</span>
      <span class="value">{{ defenseStore.alertnessLevel }}</span>
      <span class="hint" v-if="defenseStore.alertnessLevel < 30">⚠️ 警觉度过低，夜袭可能被偷袭！</span>
    </div>
    <div class="shifts-container">
      <div v-for="shift in shifts" :key="shift.key" class="shift-card">
        <div class="shift-header">
          <span class="shift-name">{{ shift.name }}</span>
          <span class="shift-time">{{ shift.time }}</span>
        </div>
        <div class="shift-assignment">
          <div v-if="getWatchForShift(shift.key)" class="assigned">
            <div class="survivor-info">
              <span class="survivor-name">{{ getSurvivorName(getWatchForShift(shift.key).survivorId) }}</span>
              <span class="survivor-stats">
                👁️{{ getSurvivorPerception(getWatchForShift(shift.key).survivorId) }}
                ⚡{{ getWatchForShift(shift.key).alertness }}
              </span>
            </div>
            <el-button size="small" type="danger" @click="removeWatch(shift.key)"
                       :disabled="defenseStore.isNight">
              撤换
            </el-button>
          </div>
          <div v-else class="unassigned">
            <el-select v-model="selectedSurvivors[shift.key]" placeholder="选择守夜人" size="small"
                       @change="(id) => assignWatch(id, shift.key)"
                       :disabled="defenseStore.isNight">
              <el-option v-for="survivor in availableSurvivors" :key="survivor.id"
                         :label="`${survivor.name} (👁️${survivor.perception})`"
                         :value="survivor.id" />
            </el-select>
          </div>
        </div>
      </div>
    </div>
    <div class="survivors-status">
      <h4>👥 幸存者状态</h4>
      <div class="survivors-grid">
        <div v-for="survivor in defenseStore.survivors" :key="survivor.id" 
             :class="'survivor-card ' + survivor.status">
          <div class="survivor-header">
            <span class="name">{{ survivor.name }}</span>
            <el-tag :type="getStatusTagType(survivor.status)" size="small">
              {{ getStatusText(survivor.status) }}
            </el-tag>
          </div>
          <div class="survivor-stats-bar">
            <div class="stat-bar">
              <span class="stat-label">❤️</span>
              <div class="bar-container">
                <div class="bar health" :style="{ width: (survivor.health / survivor.maxHealth * 100) + '%' }"></div>
              </div>
              <span class="stat-value">{{ survivor.health }}/{{ survivor.maxHealth }}</span>
            </div>
            <div class="stat-bar">
              <span class="stat-label">⚡</span>
              <div class="bar-container">
                <div class="bar stamina" :style="{ width: (survivor.stamina / survivor.maxStamina * 100) + '%' }"></div>
              </div>
              <span class="stat-value">{{ survivor.stamina }}/{{ survivor.maxStamina }}</span>
            </div>
          </div>
          <div class="survivor-skills">
            <span class="skill">⚔️ {{ survivor.combat }}</span>
            <span class="skill">👁️ {{ survivor.perception }}</span>
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

const defenseStore = useDefenseStore();
const selectedSurvivors = ref({});

const shifts = [
  { key: 'first', name: '第一班', time: '20:00 - 24:00' },
  { key: 'second', name: '第二班', time: '00:00 - 04:00' },
  { key: 'third', name: '第三班', time: '04:00 - 08:00' }
];

const availableSurvivors = computed(() => {
  return defenseStore.survivors.filter(s => 
    s.status === 'idle' && s.health > 30
  );
});

const getWatchForShift = (shift) => {
  return defenseStore.nightWatches.find(w => w.shift === shift);
};

const getSurvivorName = (id) => {
  const survivor = defenseStore.survivors.find(s => s.id === id);
  return survivor ? survivor.name : '未知';
};

const getSurvivorPerception = (id) => {
  const survivor = defenseStore.survivors.find(s => s.id === id);
  return survivor ? survivor.perception : 0;
};

const getStatusText = (status) => {
  const map = {
    idle: '空闲',
    resting: '休息',
    guarding: '值守',
    working: '工作',
    injured: '受伤'
  };
  return map[status] || status;
};

const getStatusTagType = (status) => {
  const map = {
    idle: 'success',
    resting: 'info',
    guarding: 'warning',
    working: 'primary',
    injured: 'danger'
  };
  return map[status] || 'info';
};

const assignWatch = (survivorId, shift) => {
  if (defenseStore.assignNightWatch(survivorId, shift)) {
    ElMessage.success('守夜人分配成功');
    selectedSurvivors.value[shift] = null;
  } else {
    ElMessage.error('守夜人分配失败');
  }
};

const removeWatch = (shift) => {
  const watch = getWatchForShift(shift);
  if (watch && defenseStore.removeNightWatch(watch.survivorId)) {
    ElMessage.success('守夜人已撤换');
  }
};
</script>

<style scoped>
.night-watch {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.night-watch h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.alertness-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.alertness-info .label {
  font-size: 14px;
  color: #666;
}

.alertness-info .value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.alertness-info .hint {
  color: #f56c6c;
  font-size: 13px;
  margin-left: 10px;
}

.shifts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.shift-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e0e0e0;
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.shift-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.shift-time {
  font-size: 12px;
  color: #999;
}

.shift-assignment {
  min-height: 40px;
}

.assigned {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #ecf5ff;
  border-radius: 6px;
  border: 1px solid #b3d8ff;
}

.survivor-info {
  display: flex;
  flex-direction: column;
}

.survivor-name {
  font-weight: bold;
  color: #409eff;
}

.survivor-stats {
  font-size: 12px;
  color: #666;
}

.unassigned .el-select {
  width: 100%;
}

.survivors-status h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.survivors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.survivor-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.survivor-card.guarding {
  background: #fdf6ec;
  border-color: #e6a23c;
}

.survivor-card.injured {
  background: #fef0f0;
  border-color: #f56c6c;
}

.survivor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.survivor-header .name {
  font-weight: bold;
  color: #333;
}

.survivor-stats-bar {
  margin-bottom: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  width: 20px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar.health {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.bar.stamina {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.stat-value {
  font-size: 11px;
  color: #666;
  min-width: 50px;
  text-align: right;
}

.survivor-skills {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #666;
}

.skill {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
