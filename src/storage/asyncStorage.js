import AsyncStorage from '@react-native-async-storage/async-storage';

// Constantes para las keys de almacenamiento
const KEYS = {
  ATTENDANCE: 'attendance_records',
  LOCATIONS: 'gym_locations',
  STREAK_PROTECTORS: 'streak_protectors',
  USER_DATA: 'user_data',
  POINTS: 'user_points'
};

// Funciones para manejar ubicaciones
export const saveLocation = async (location) => {
  try {
    const locations = await getLocations();
    locations.push(location);
    await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));
    return true;
  } catch (error) {
    console.error('Error saving location:', error);
    return false;
  }
};

export const getLocations = async () => {
  try {
    const locations = await AsyncStorage.getItem(KEYS.LOCATIONS);
    return locations ? JSON.parse(locations) : [];
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

export const deleteLocation = async (locationId) => {
  try {
    const locations = await getLocations();
    const updatedLocations = locations.filter(loc => loc.id !== locationId);
    await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(updatedLocations));
    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    return false;
  }
};

// Funciones para manejar asistencias
export const registerAttendance = async (locationId) => {
  try {
    const records = await getAttendanceRecords();
    const newRecord = {
      id: Date.now().toString(),
      locationId,
      timestamp: new Date().toISOString()
    };
    
    records.push(newRecord);
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
    
    // Añadir 100 puntos por la asistencia
    await addPoints(100);
    
    return true;
  } catch (error) {
    console.error('Error registering attendance:', error);
    return false;
  }
};

export const getAttendanceRecords = async () => {
  try {
    const records = await AsyncStorage.getItem(KEYS.ATTENDANCE);
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error('Error getting attendance records:', error);
    return [];
  }
};

// Funciones para manejar puntos
export const getUserPoints = async () => {
  try {
    const points = await AsyncStorage.getItem(KEYS.POINTS);
    return points ? parseInt(points) : 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
};

export const updateUserPoints = async (newPoints) => {
  try {
    await AsyncStorage.setItem(KEYS.POINTS, newPoints.toString());
    return true;
  } catch (error) {
    console.error('Error updating user points:', error);
    return false;
  }
};

export const addPoints = async (pointsToAdd) => {
  try {
    const currentPoints = await getUserPoints();
    const newPoints = currentPoints + pointsToAdd;
    await updateUserPoints(newPoints);
    return newPoints;
  } catch (error) {
    console.error('Error adding points:', error);
    return null;
  }
};

// Funciones para manejar protectores de racha
export const useStreakProtector = async (date) => {
  try {
    const points = await getUserPoints();
    if (points < 1000) {
      throw new Error('Insufficient points');
    }

    const protectors = await AsyncStorage.getItem(KEYS.STREAK_PROTECTORS) || '{}';
    const protectorsObj = JSON.parse(protectors);
    
    // Registrar el uso del protector
    protectorsObj[date] = true;
    
    // Actualizar protectores y puntos
    await Promise.all([
      AsyncStorage.setItem(KEYS.STREAK_PROTECTORS, JSON.stringify(protectorsObj)),
      updateUserPoints(points - 1000)
    ]);
    
    return true;
  } catch (error) {
    console.error('Error using streak protector:', error);
    return false;
  }
};

export const getStreakProtectorsUsage = async () => {
  try {
    const protectors = await AsyncStorage.getItem(KEYS.STREAK_PROTECTORS);
    return protectors ? JSON.parse(protectors) : {};
  } catch (error) {
    console.error('Error getting streak protectors:', error);
    return {};
  }
};

// Funciones para manejar datos de usuario
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : { restDays: [] };
  } catch (error) {
    console.error('Error getting user data:', error);
    return { restDays: [] };
  }
};

export const updateRestDays = async (restDays) => {
  try {
    const userData = await getUserData();
    userData.restDays = restDays;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error updating rest days:', error);
    return false;
  }
};

// Función para obtener estadísticas de racha
export const getStreakStats = async () => {
  try {
    const [records, protectors, userData] = await Promise.all([
      getAttendanceRecords(),
      getStreakProtectorsUsage(),
      getUserData()
    ]);

    const restDays = userData?.restDays || [];

    if (records.length === 0) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalDays: 0,
        lastCheckIn: null,
        streakHistory: []
      };
    }

    // Ordenar registros por fecha
    records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let currentStreak = 0;
    let bestStreak = 0;
    let streakHistory = [];
    let lastCheckIn = records[records.length - 1].timestamp;
    let currentStreakStart = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let previousDate = null;
    
    for (const record of records) {
      const currentDate = new Date(record.timestamp);
      currentDate.setHours(0, 0, 0, 0);

      if (!previousDate) {
        currentStreakStart = currentDate;
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));

        if (dayDiff <= 1) {
          currentStreak++;
        } else {
          // Verificar días intermedios
          let streakBroken = false;
          const datesBetween = getDatesInRange(previousDate, currentDate);

          for (let date of datesBetween.slice(1, -1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();

            if (!protectors[dateStr] && !restDays.includes(dayOfWeek)) {
              streakBroken = true;
              break;
            }
          }

          if (streakBroken) {
            // Guardar la racha anterior en el historial si es relevante
            if (currentStreak > 2) {
              streakHistory.push({
                start: currentStreakStart.toISOString(),
                end: previousDate.toISOString(),
                days: currentStreak
              });
            }
            currentStreakStart = currentDate;
            currentStreak = 1;
          } else {
            currentStreak += dayDiff;
          }
        }
      }

      previousDate = currentDate;
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    // Verificar si la racha continúa hasta hoy
    if (previousDate) {
      const daysSinceLastRecord = Math.floor((today - previousDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastRecord > 1) {
        let streakBroken = false;
        const datesBetween = getDatesInRange(previousDate, today);

        for (let date of datesBetween.slice(1)) {
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();

          if (!protectors[dateStr] && !restDays.includes(dayOfWeek)) {
            streakBroken = true;
            break;
          }
        }

        if (streakBroken) {
          // Guardar la última racha en el historial
          if (currentStreak > 2) {
            streakHistory.push({
              start: currentStreakStart.toISOString(),
              end: previousDate.toISOString(),
              days: currentStreak
            });
          }
          currentStreak = 0;
        }
      }
    }

    return {
      currentStreak,
      bestStreak,
      totalDays: records.length,
      lastCheckIn,
      streakHistory: streakHistory.slice(-5) // Mantener solo las últimas 5 rachas
    };
  } catch (error) {
    console.error('Error calculating streak stats:', error);
    return null;
  }
};

// Función auxiliar para obtener fechas en un rango
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const endDateTime = new Date(endDate);
  endDateTime.setHours(0, 0, 0, 0);

  while (currentDate <= endDateTime) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Función para resetear todos los datos (útil para testing o reset completo)
export const resetAllData = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.ATTENDANCE),
      AsyncStorage.removeItem(KEYS.LOCATIONS),
      AsyncStorage.removeItem(KEYS.STREAK_PROTECTORS),
      AsyncStorage.removeItem(KEYS.USER_DATA),
      AsyncStorage.removeItem(KEYS.POINTS)
    ]);
    return true;
  } catch (error) {
    console.error('Error resetting data:', error);
    return false;
  }
};