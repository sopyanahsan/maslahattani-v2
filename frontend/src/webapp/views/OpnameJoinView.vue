<template>
  <div class="min-h-screen bg-gradient-to-br from-white to-violet-50/80 flex flex-col items-center justify-center p-4 font-sans">
    <div class="w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-violet-200">
          <svg class="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Stock Opname</h1>
        <p class="text-slate-500 mt-1 text-sm">Masukkan kode dari admin untuk mulai hitung stok.</p>
      </div>

      <!-- Card -->
      <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <!-- Step 1: Passcode Input -->
        <div v-if="step === 'passcode'" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700">Kode Opname</label>
            <input
              ref="passcodeInput"
              v-model="passcode"
              type="text"
              maxlength="6"
              autocomplete="off"
              spellcheck="false"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4
                     text-center text-2xl font-mono font-bold tracking-[0.3em] text-slate-800
                     placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal placeholder:font-normal
                     focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all uppercase"
              placeholder="Masukkan kode"
              @input="handlePasscodeInput"
              @keydown.enter="lookupPasscode"
            />
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 rounded-md p-3">
            <p class="text-xs text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- Session Preview (after lookup) -->
          <div v-if="sessionInfo" class="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Sesi Ditemukan</span>
              <span class="text-[10px] font-semibold text-violet-500">{{ sessionInfo.sessionNumber }}</span>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-slate-800">{{ sessionInfo.shopName }}</p>
              <p class="text-xs text-slate-500">{{ sessionInfo.shopAddress }}</p>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-violet-100">
              <span class="text-xs text-slate-600">{{ sessionInfo.totalProducts }} produk</span>
              <span class="text-xs text-slate-500">{{ sessionInfo.participantCount }} petugas</span>
            </div>
          </div>

          <button
            v-if="!sessionInfo"
            type="button"
            :disabled="passcode.length < 6 || lookingUp"
            class="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold
                   py-3 rounded-xl transition-all flex justify-center items-center shadow-sm shadow-violet-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
            @click="lookupPasscode"
          >
            <svg v-if="lookingUp" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            <span v-else>Cari Sesi</span>
          </button>

          <button
            v-if="sessionInfo"
            type="button"
            class="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold
                   py-3 rounded-xl transition-all flex justify-center items-center shadow-sm shadow-violet-200"
            @click="step = 'name'"
          >
            Lanjut
          </button>
        </div>

        <!-- Step 2: Name Input -->
        <div v-else-if="step === 'name'" class="space-y-5">
          <button
            type="button"
            class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            @click="step = 'passcode'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>

          <div class="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <span class="text-xs text-violet-700 font-medium">{{ sessionInfo?.shopName }}</span>
            <span class="text-xs font-mono font-bold text-violet-600">{{ passcode }}</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700">Nama Petugas</label>
            <input
              ref="nameInput"
              v-model="participantName"
              type="text"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800
                     placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1
                     focus:ring-violet-500 transition-all"
              placeholder="Masukkan nama Anda"
              @keydown.enter="joinSession"
            />
            <p class="text-[10px] text-slate-400">Nama akan terlihat di laporan opname.</p>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 rounded-md p-3">
            <p class="text-xs text-red-800">{{ errorMessage }}</p>
          </div>

          <button
            type="button"
            :disabled="!participantName.trim() || joining"
            class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold
                   py-3 rounded-xl transition-all flex justify-center items-center shadow-sm shadow-emerald-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
            @click="joinSession"
          >
            <svg v-if="joining" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            <span v-else>Mulai Hitung Stok</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-[10px] text-slate-400 mt-6">
        Maslahat Tani — Stock Opname v2
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import opnameService, {
  type PasscodeLookupResponse,
} from '@/shared/services/opname.service';

const router = useRouter();

// ============================================
// State
// ============================================
const step = ref<'passcode' | 'name'>('passcode');
const passcode = ref('');
const participantName = ref('');
const sessionInfo = ref<PasscodeLookupResponse | null>(null);
const errorMessage = ref<string | null>(null);
const lookingUp = ref(false);
const joining = ref(false);

const passcodeInput = ref<HTMLInputElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);

// ============================================
// Methods
// ============================================

function handlePasscodeInput() {
  // Auto-uppercase and strip non-alphanumeric
  passcode.value = passcode.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Reset session info on change
  sessionInfo.value = null;
  errorMessage.value = null;

  // Auto-lookup when 6 chars entered
  if (passcode.value.length === 6) {
    lookupPasscode();
  }
}

async function lookupPasscode() {
  if (passcode.value.length < 6) return;
  lookingUp.value = true;
  errorMessage.value = null;
  sessionInfo.value = null;

  try {
    const result = await opnameService.lookupByPasscode(passcode.value);
    sessionInfo.value = result;

    if (result.status === 'COMPLETED') {
      errorMessage.value = 'Sesi opname ini sudah selesai.';
      sessionInfo.value = null;
    } else if (result.status === 'CANCELLED') {
      errorMessage.value = 'Sesi opname ini sudah dibatalkan.';
      sessionInfo.value = null;
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Kode tidak ditemukan.';
    errorMessage.value = msg;
  } finally {
    lookingUp.value = false;
  }
}

async function joinSession() {
  if (!participantName.value.trim() || !sessionInfo.value) return;

  joining.value = true;
  errorMessage.value = null;

  try {
    const result = await opnameService.joinSession({
      passcode: passcode.value,
      name: participantName.value.trim(),
      deviceId: getDeviceId(),
    });

    // Store participant info in sessionStorage for the counting page
    sessionStorage.setItem('opname_participant_id', result.participant.id);
    sessionStorage.setItem('opname_participant_name', result.participant.name);
    sessionStorage.setItem('opname_session_id', result.session.id);
    sessionStorage.setItem('opname_passcode', passcode.value);

    // Navigate to counting page
    router.push({
      name: 'webapp-opname-count',
      params: { sessionId: result.session.id },
    });
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Gagal bergabung ke sesi.';
    errorMessage.value = msg;
  } finally {
    joining.value = false;
  }
}

/**
 * Generate or retrieve a persistent device ID for this browser.
 */
function getDeviceId(): string {
  let id = localStorage.getItem('opname_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('opname_device_id', id);
  }
  return id;
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  nextTick(() => {
    passcodeInput.value?.focus();
  });
});
</script>
