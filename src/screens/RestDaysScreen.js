
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ScrollView 
} from 'react-native';
import { getUserData, updateRestDays } from '../storage/asyncStorage';
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

export default function RestDaysScreen() {
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestDays();
  }, []);

  const loadRestDays = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      setSelectedDays(userData.restDays || []);
    } catch (error) {
      console.error('Error loading rest days:', error);
      Alert.alert('Error', 'No se pudieron cargar los días de descanso');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScrollView style={styles.container}>
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

      {selectedDays.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Días de descanso seleccionados:</Text>
          <Text style={styles.summaryText}>
            {selectedDays
              .sort((a, b) => a - b)
              .map(dayId => DAYS.find(d => d.id === dayId).name)
              .join(', ')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  daysContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
  summaryCard: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});