import { computed, ref } from 'vue'

export function useTimer() {
   const executionTime = ref<number | null>(null)
   const running = ref(false)
   let timerInterval: number | null = null

   const executionTimeFormatted = computed(() => {
      if (executionTime.value === null) return ''
      return `${(executionTime.value / 1000).toFixed(2)}s`
   })

   function start() {
      executionTime.value = null
      running.value = true
      const startTime = Date.now()

      timerInterval = window.setInterval(() => {
         executionTime.value = Date.now() - startTime
      }, 100)
   }

   function stop() {
      running.value = false
      if (timerInterval) {
         clearInterval(timerInterval)
         timerInterval = null
      }
   }

   return {
      executionTime,
      executionTimeFormatted,
      running,
      startTimer: start,
      stopTimer: stop
   }
}