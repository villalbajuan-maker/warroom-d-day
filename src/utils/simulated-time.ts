/**
 * Utilidades para manejo de tiempo simulado
 *
 * PRINCIPIO FUNDAMENTAL:
 * - NO existe tiempo real en este demo
 * - El ÚNICO reloj del sistema es demo_current_minute (INTEGER 0-572)
 * - Los minutos representan offset desde las 08:00 (inicio de jornada)
 * - La hora mostrada es DERIVADA del minuto, solo para presentación
 * - NUNCA se usan timestamps, Date, Date.now() o new Date() en lógica
 */

/**
 * CONSTANTES DEL DEMO
 */
const DEMO_START_HOUR = 8;
const DEMO_START_MINUTE = 0;
const DEMO_END_MINUTE = 572;

/**
 * Convierte minutos desde inicio (0-572) a formato de hora para display (HH:MM)
 * Ejemplo: 0 -> "08:00", 60 -> "09:00", 572 -> "17:32"
 */
export function formatMinuteAsTime(minute: number): string {
  const totalMinutes = DEMO_START_HOUR * 60 + DEMO_START_MINUTE + minute;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcula el porcentaje de progresión del demo
 * @param currentMinute Minuto actual (0-572)
 * @returns Porcentaje de 0 a 100
 */
export function calculateMinuteProgressPercentage(currentMinute: number): number {
  if (DEMO_END_MINUTE === 0) return 0;
  const percentage = (currentMinute / DEMO_END_MINUTE) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Calcula el minuto desde un porcentaje (0-100)
 */
export function calculateMinuteFromPercentage(percentage: number): number {
  const minute = Math.round((DEMO_END_MINUTE * percentage) / 100);
  return Math.max(0, Math.min(DEMO_END_MINUTE, minute));
}

/**
 * Retorna los minutos de puntos clave del demo para display
 */
export function getDemoKeyMinutes() {
  return {
    start: 0,
    midpoint: Math.floor(DEMO_END_MINUTE / 2),
    end: DEMO_END_MINUTE
  };
}
