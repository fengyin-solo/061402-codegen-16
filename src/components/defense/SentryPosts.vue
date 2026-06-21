<template>
  <div class="sentry-posts">
    <h3>🛡️ 哨位布防</h3>
    <div class="defense-overview">
      <div class="defense-stat">
        <span class="label">总防御力</span>
        <span class="value">{{ defenseStore.overallDefense }}</span>
      </div>
      <div class="defense-stat">
        <span class="label">警戒等级</span>
        <span class="value" :class="'level-' + defenseStore.alertLevel">
          {{ alertLevelText }}
        </span>
      </div>
    </div>
    <div class="sentry-grid">
      <div v-for="post in defenseStore.sentryPosts" :key="post.id" 
           :class="'sentry-card ' + post.status">
        <div class="sentry-header">
          <span class="sentry-name">{{ post.name }}</span>
          <el-tag :type="getStatusTagType(post.status)" size="small">
            {{ getStatusText(post.status) }}
          </el-tag>
        </div>
        <div class="sentry-info">
          <div class="info-row">
            <span>📍 {{ post.location }}</span>
          </div>
          <div class="info-row">
            <span>⚔️ 防御值: {{ post.defenseValue }}</span>
          </div>
          <div class="info-row">
            <span>👁️ 警戒: {{ post.alertLevel }}</span>
          </div>
          <div class="info-row" v-if="post.buildingId">
            <span>🏗️ 附属建筑: {{ getBuildingName(post.buildingId) }}</span>
          </div>
        </div>
        <div class="guard-assignment">
          <div class="current-guard" v-if="post.guardId">
            <span class="guard-label">守卫:</span>
            <span class="guard-name">{{ getSurvivorName(post.guardId) }}</span>
            <span class="guard-combat">(⚔️{{ getSurvivorCombat(post.guardId) }})</span>
            <el-button size="small" type="danger" @click="removeGuard(post.id)"
                       :disabled="defenseStore.isNight">
              撤换
            </el-button>
          </div>
          <div class="assign-guard" v-else-if="post.status === 'active'">
            <el-select v-model="selectedGuards[post.id]" placeholder="分配守卫" size="small"
                       @change="(id) => assignGuard(post.id, id)"
                       :disabled="defenseStore.isNight">
              <el-option v-for="survivor in availableSurvivors" :key="survivor.id"
                         :label="`${survivor.name} (⚔️${survivor.combat})`"
                         :value="survivor.id" />
            </el-select>
          </div>
        </div>
        <div class="sentry-actions">
          <el-button size="small" v-if="post.status === 'inactive'" type="success"
                     @click="activateSentry(post.id)" :disabled="defenseStore.isNight">
            激活
          </el-button>
          <el-button size="small" v-else-if="post.status === 'active'" type="warning"
                     @click="deactivateSentry(post.id)" :disabled="defenseStore.isNight">
            停用
          </el-button>
          <el-button size="small" v-if="post.status === 'damaged'" type="primary"
                     @click="repairSentry(post.id)">
            修复 (10木,5石)
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDefenseStore } from '../../store';
import { ElMessage } from 'element-plus';

const props = defineProps({
  resources: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['resources-updated']);

const defenseStore = useDefenseStore();
const selectedGuards = ref({});

const alertLevelText = computed(() => {
  const map = {
    green: '安全',
    yellow: '警惕',
    orange: '危险',
    red: '紧急'
  };
  return map[defenseStore.alertLevel] || '未知';
});

const availableSurvivors = computed(() => {
  return defenseStore.survivors.filter(s => 
    s.status === 'idle' && s.health > 30
  );
});

const getSurvivorName = (id) => {
  const survivor = defenseStore.survivors.find(s => s.id === id);
  return survivor ? survivor.name : '未知';
};

const getSurvivorCombat = (id) => {
  const survivor = defenseStore.survivors.find(s => s.id === id);
  return survivor ? survivor.combat : 0;
};

const getBuildingName = (id) => {
  const building = defenseStore.buildings.find(b => b.id === id);
  return building ? building.name : '未知';
};

const getStatusText = (status) => {
  const map = {
    active: '激活',
    inactive: '未激活',
    damaged: '损坏'
  };
  return map[status] || status;
};

const getStatusTagType = (status) => {
  const map = {
    active: 'success',
    inactive: 'info',
    damaged: 'danger'
  };
  return map[status] || 'info';
};

const assignGuard = (sentryId, survivorId) => {
  if (defenseStore.assignGuardToSentry(sentryId, survivorId)) {
    ElMessage.success('守卫分配成功');
    selectedGuards.value[sentryId] = null;
  } else {
    ElMessage.error('守卫分配失败');
  }
};

const removeGuard = (sentryId) => {
  if (defenseStore.removeGuardFromSentry(sentryId)) {
    ElMessage.success('守卫已撤换');
  }
};

const activateSentry = (sentryId) => {
  if (defenseStore.activateSentryPost(sentryId)) {
    ElMessage.success('哨位已激活');
  }
};

const deactivateSentry = (sentryId) => {
  if (defenseStore.deactivateSentryPost(sentryId)) {
    ElMessage.success('哨位已停用');
  }
};

const repairSentry = (sentryId) => {
  if (defenseStore.repairSentryPost(sentryId, props.resources)) {
    emit('resources-updated');
    ElMessage.success('哨位修复成功');
  } else {
    ElMessage.error('资源不足，无法修复');
  }
};
</script>

<style scoped>
.sentry-posts {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sentry-posts h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.defense-overview {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.defense-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.defense-stat .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.defense-stat .value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.defense-stat .value.level-green {
  color: #67c23a;
}

.defense-stat .value.level-yellow {
  color: #e6a23c;
}

.defense-stat .value.level-orange {
  color: #f56c6c;
}

.defense-stat .value.level-red {
  color: #f5222d;
}

.sentry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.sentry-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.sentry-card.active {
  border-color: #67c23a;
  background: #f0f9eb;
}

.sentry-card.damaged {
  border-color: #f56c6c;
  background: #fef0f0;
}

.sentry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sentry-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.sentry-info {
  margin-bottom: 12px;
}

.info-row {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.guard-assignment {
  margin-bottom: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.current-guard {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.guard-label {
  font-size: 13px;
  color: #666;
}

.guard-name {
  font-weight: bold;
  color: #333;
}

.guard-combat {
  font-size: 12px;
  color: #999;
}

.assign-guard {
  width: 100%;
}

.assign-guard .el-select {
  width: 100%;
}

.sentry-actions {
  display: flex;
  gap: 8px;
}
</style>
