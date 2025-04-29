import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData, getUserData, updateRestDays } from '../storage/asyncStorage';
import { formatDate } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

const DAYS = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' }
];

export default function ProfileScreen() {
  const [streakData, setStreakData] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getStreakData();
    const userData = await getUserData();
    setStreakData(data);
    setSelectedDays(userData.restDays || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const toggleDay = async (dayId) => {
    try {
      const newSelectedDays = selectedDays.includes(dayId)
        ? selectedDays.filter(d => d !== dayId)
        : [...selectedDays, dayId];
      
      setSelectedDays(newSelectedDays);
      await updateRestDays(newSelectedDays);
    } catch (error) {
      console.error('Error updating rest days:', error);
      Alert.alert('Error', 'No se pudo actualizar los días de descanso');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Resetear Datos',
      '¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Éxito', 'Todos los datos han sido borrados');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudieron borrar los datos');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        {streakData && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakData.totalDays}</Text>
              <Text style={styles.statLabel}>Total de Días</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakData.bestStreak}</Text>
              <Text style={styles.statLabel}>Mejor Racha</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Días de Descanso</Text>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Selecciona los días en los que normalmente no entrenas. 
            Tu racha no se perderá en estos días.
          </Text>
        </View>
        <View style={styles.daysContainer}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={styles.dayRow}
              onPress={() => toggleDay(day.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayText}>{day.name}</Text>
              <Switch
                value={selectedDays.includes(day.id)}
                onValueChange={() => toggleDay(day.id)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={selectedDays.includes(day.id) ? '#2196F3' : '#f4f3f4'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Rachas</Text>
        {streakData?.streakHistory.map((streak, index) => (
          <View key={index} style={styles.streakHistoryItem}>
            <Text style={styles.streakHistoryDays}>
              {streak.days} {streak.days === 1 ? 'día' : 'días'}
            </Text>
            <Text style={styles.streakHistoryDates}>
              {formatDate(streak.start)} - {formatDate(streak.end)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetData}
        >
          <Text style={styles.resetButtonText}>Resetear Datos</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  daysContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  streakHistoryItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  streakHistoryDays: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  streakHistoryDates: {
    color: '#666',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});