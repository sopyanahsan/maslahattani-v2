import { ref, watch, onMounted } from 'vue';

const isDark = ref(false);

export function useDarkMode() {
  const toggle = () => {
    isDark.value = !isDark.value;
  };

  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  };

  const init = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      isDark.value = true;
    } else if (stored === 'light') {
      isDark.value = false;
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  };

  watch(isDark, applyTheme);

  onMounted(init);

  return { isDark, toggle };
}
