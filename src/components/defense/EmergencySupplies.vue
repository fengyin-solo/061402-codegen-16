<template>
  <div class="emergency-supplies">
    <h3>🎒 应急物资</h3>
    <div class="supplies-hint">
      <span class="hint-icon">💡</span>
      <span>分配应急物资可以提升防御效果，战斗中会自动消耗已分配的物资</span>
    </div>
    <div class="supplies-grid">
      <div v-for="supply in defenseStore.emergencySupplies" :key="supply.type"
           :class="'supply-card ' + supply.type">
        <div class="supply-icon">{{ getSupplyIcon(supply.type) }}</div>
        <div class="supply-info">
          <div class="supply-name">{{ supply.name }}</div>
          <div class="supply-type">{{ getSupplyTypeName(supply.type) }}</div>
          <div class="supply-effectiveness">效果: +{{ supply.effectiveness }}</div>
        </div>
        <div class="supply-stock">
          <div class="stock-row">
            <span class="stock-label">库存:</span>
            <span class="stock-value">{{ supply.quantity }}</span>
          </div>
          <div class="stock-row">
            <span class="stock-label">已分配:</span>
            <span class="stock-value allocated">{{ supply.allocated }}</span>
          </div>
          <div class="stock-row">
            <span class="stock-label">可用:</span>
            <span class="stock-value available">{{ supply.quantity - supply.allocated }}</span>
          </div>
        </div>
        <div class="supply-actions" v-if="supply.type === 'weapon' || supply.type === 'medicine'">
          <div class="action-row">
            <el-button size="small" type="primary" 
                       @click="allocateSupply(supply.type, 1)"
                       :disabled="supply.quantity - supply.allocated < 1 || defenseStore.isNight">
              +1
            </el-button>
            <el-button size="small" type="primary" 
                       @click="allocateSupply(supply.type, 3)"
                       :disabled="supply.quantity - supply.allocated < 3 || defenseStore.isNight">
              +3
            </el-button>
            <el-button size="small" type="danger" 
                       @click="deallocateSupply(supply.type, 1)"
                       :disabled="supply.allocated < 1 || defenseStore.isNight">
              -1
            </el-button>
            <el-button size="small" type="danger" 
                       @click="deallocateSupply(supply.type, supply.allocated)"
                       :disabled="supply.allocated < 1 || defenseStore.isNight">
              全部
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="buildings-section">
      <h4>🏗️ 防御建筑</h4>
      <div class="buildings-grid">
        <div v-for="building in defenseStore.buildings" :key="building.id"
             :class="'building-card ' + (building.built ? 'built' : 'unbuilt')">
          <div class="building-icon">{{ getBuildingIcon(building.type) }}</div>
          <div class="building-info">
            <div class="building-name">{{ building.name }}</div>
            <div class="building-type">{{ getBuildingTypeName(building.type) }}</div>
            <div class="building-defense">防御加成: +{{ building.defenseBonus }}</div>
          </div>
          <div class="building-status" v-if="building.built">
            <el-tag type="success" size="small">已建造</el-tag>
            <div class="durability-bar">
              <div class="durability-label">耐久度: {{ building.durability }}/{{ building.maxDurability }}</div>
              <div class="bar-container">
                <div class="bar" :style="{ width: (building.durability / building.maxDurability * 100) + '%' }"
                     :class="{ low: building.durability / building.maxDurability < 0.3 }"></div>
              </div>
            </div>
            <el-button size="small" type="primary" 
                       @click="repairBuilding(building.id)"
                       :disabled="building.durability >= building.maxDurability">
              修复 ({{ Math.ceil((building.maxDurability - building.durability) * 0.5) }}木, {{ Math.ceil((building.maxDurability - building.durability) * 0.3) }}石)
            </el-button>
          </div>
          <div class="building-build" v-else>
            <el-tag type="info" size="small">未建造</el-tag>
            <div class="build-cost">
              <span v-if="getBuildCost(building.type).wood">🪵 {{ getBuildCost(building.type).wood }}</span>
              <span v-if="getBuildCost(building.type).stone">⛏️ {{ getBuildCost(building.type).stone }}</span>
            </div>
            <el-button size="small" type="success" 
                       @click="buildBuilding(building.id)">
              建造
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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

const getSupplyIcon = (type) => {
  const icons = {
    weapon: '⚔️',
    medicine: '💊',
    food: '🍖',
    water: '💧',
    tool: '🔧'
  };
  return icons[type] || '📦';
};

const getSupplyTypeName = (type) => {
  const names = {
    weapon: '武器',
    medicine: '药品',
    food: '食物',
    water: '饮水',
    tool: '工具'
  };
  return names[type] || type;
};

const getBuildingIcon = (type) => {
  const icons = {
    shelter: '🏠',
    watchtower: '🗼',
    wall: '🧱',
    storage: '🏪',
    workshop: '🔨'
  };
  return icons[type] || '🏗️';
};

const getBuildingTypeName = (type) => {
  const names = {
    shelter: '庇护所',
    watchtower: '瞭望塔',
    wall: '围墙',
    storage: '仓库',
    workshop: '工坊'
  };
  return names[type] || type;
};

const getBuildCost = (type) => {
  const costs = {
    watchtower: { wood: 80, stone: 40 },
    wall: { wood: 100, stone: 80 },
    storage: { wood: 60, stone: 20 },
    workshop: { wood: 70, stone: 30 }
  };
  return costs[type] || {};
};

const allocateSupply = (type, amount) => {
  if (defenseStore.allocateEmergencySupply(type, amount)) {
    ElMessage.success(`已分配 ${amount} 单位物资`);
  } else {
    ElMessage.error('分配失败，库存不足');
  }
};

const deallocateSupply = (type, amount) => {
  if (defenseStore.deallocateEmergencySupply(type, amount)) {
    ElMessage.success(`已收回 ${amount} 单位物资`);
  } else {
    ElMessage.error('收回失败');
  }
};

const buildBuilding = (buildingId) => {
  if (defenseStore.buildBuilding(buildingId, props.resources)) {
    emit('resources-updated');
    ElMessage.success('建筑建造成功！防御能力提升');
  } else {
    ElMessage.error('资源不足，无法建造');
  }
};

const repairBuilding = (buildingId) => {
  if (defenseStore.repairBuilding(buildingId, props.resources)) {
    emit('resources-updated');
    ElMessage.success('建筑修复成功！');
  } else {
    ElMessage.error('资源不足，无法修复');
  }
};
</script>

<style scoped>
.emergency-supplies {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.emergency-supplies h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #333;
}

.supplies-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fdf6ec;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #e6a23c;
}

.hint-icon {
  font-size: 18px;
}

.supplies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.supply-card {
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e0e0e0;
}

.supply-card.weapon {
  border-color: #f56c6c;
  background: #fef0f0;
}

.supply-card.medicine {
  border-color: #67c23a;
  background: #f0f9eb;
}

.supply-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.supply-info {
  margin-bottom: 12px;
}

.supply-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.supply-type {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.supply-effectiveness {
  font-size: 13px;
  color: #67c23a;
}

.supply-stock {
  background: white;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.stock-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}

.stock-label {
  color: #666;
}

.stock-value {
  font-weight: bold;
  color: #333;
}

.stock-value.allocated {
  color: #409eff;
}

.stock-value.available {
  color: #67c23a;
}

.supply-actions {
  margin-top: auto;
}

.action-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.buildings-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.building-card {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e0e0e0;
}

.building-card.built {
  border-color: #67c23a;
  background: #f0f9eb;
}

.building-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.building-info {
  flex: 1;
  min-width: 0;
}

.building-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.building-type {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.building-defense {
  font-size: 13px;
  color: #67c23a;
}

.building-status,
.building-build {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 120px;
}

.durability-bar {
  width: 100%;
}

.durability-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.bar-container {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #85ce61);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar.low {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.build-cost {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: #666;
}
</style>
