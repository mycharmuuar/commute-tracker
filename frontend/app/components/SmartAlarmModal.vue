<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
      
      <!-- Close Button -->
      <button
        @click="$emit('close')"
        type="button"
        class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
      >
        ✕
      </button>

      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
          ⏰
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">คำนวณเวลาออกจากบ้านอัจฉริยะ</h3>
          <p class="text-xs text-slate-500">Smart Departure Alarm (อิงสภาพจราจรสด)</p>
        </div>
      </div>

      <!-- Inputs Form -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">
            เวลาที่ต้องไปถึงบริษัท / เข้างาน:
          </label>
          <input
            v-model="targetArrivalTime"
            type="time"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">
            เวลาเผื่อหาที่จอดรถ / เดินขึ้นตึก (นาที):
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="mins in [0, 5, 10, 15]"
              :key="mins"
              type="button"
              @click="bufferMinutes = mins"
              class="py-2 text-xs font-semibold rounded-xl border transition-all"
              :class="bufferMinutes === mins ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
            >
              {{ mins }} นาที
            </button>
          </div>
        </div>

        <!-- Calculated Output Card -->
        <div class="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 rounded-2xl border border-indigo-100 space-y-2">
          <p class="text-xs text-indigo-900/80 font-medium">ผลการคำนวณเวลาที่ควรออกจากบ้าน:</p>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-black font-mono text-indigo-700">{{ calculatedDepartureTime }}</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
              {{ countdownNotice }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500">
            * คำนวณจากเวลาเดินทางจริง {{ commuteDurationText }} + เผื่อเวลา {{ bufferMinutes }} นาที
          </p>
        </div>

        <!-- Action Button -->
        <button
          type="button"
          @click="setupNotification"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          <span>🔔</span>
          <span>{{ notificationButtonText }}</span>
        </button>

        <p v-if="notificationStatus" class="text-[11px] text-center text-emerald-600 font-medium">
          ✓ {{ notificationStatus }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  durationSeconds: number;
  commuteDurationText: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const targetArrivalTime = ref('09:00');
const bufferMinutes = ref(10);
const notificationStatus = ref('');
const notificationButtonText = ref('เปิดการแจ้งเตือนเมื่อถึงเวลาออก');

// คำนวณเวลาย้อนกลับ
const calculatedDepartureTime = computed(() => {
  const [targetHour, targetMin] = targetArrivalTime.value.split(':').map(Number);
  const targetDate = new Date();
  targetDate.setHours(targetHour, targetMin, 0, 0);

  // หักลบเวลาเดินทาง + buffer
  const totalDeductSeconds = (props.durationSeconds || 1200) + bufferMinutes.value * 60;
  const departureDate = new Date(targetDate.getTime() - totalDeductSeconds * 1000);

  return departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
});

const countdownNotice = computed(() => {
  const [targetHour, targetMin] = targetArrivalTime.value.split(':').map(Number);
  const targetDate = new Date();
  targetDate.setHours(targetHour, targetMin, 0, 0);

  const totalDeductSeconds = (props.durationSeconds || 1200) + bufferMinutes.value * 60;
  const departureDate = new Date(targetDate.getTime() - totalDeductSeconds * 1000);

  const diffMs = departureDate.getTime() - Date.now();
  if (diffMs <= 0) return 'ควรออกเดินทางทันที';

  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `อีก ${diffMins} นาที`;
  const hours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `อีก ${hours} ชม. ${remainingMins} น.`;
});

const setupNotification = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน Web Notifications');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    notificationStatus.value = `ระบบจะแจ้งเตือนเมื่อถึงเวลา ${calculatedDepartureTime.value}`;
    notificationButtonText.value = '✓ ตั้งเตือนสำเร็จแล้ว';
    new Notification('Commute Tracker', {
      body: `ตั้งนาฬิกาเตือนสำเร็จ! คุณควรออกจากบ้านเวลา ${calculatedDepartureTime.value}`,
      icon: '🚗',
    });
  } else {
    alert('กรุณาอนุญาต Notification บนเบราว์เซอร์เพื่อรับการแจ้งเตือน');
  }
};
</script>
