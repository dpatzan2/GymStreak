import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../context/RefreshContext';
import { 
  getStreakStats, 
  useStreakProtector,
  getUserPoints,
  updateUserPoints 
} from '../storage/asyncStorage';

export default function StreakDisplay() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const { refreshKey } = useRefresh();

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [streakStats, userPoints] = await Promise.all([
        getStreakStats(),
        getUserPoints()
      ]);
      setStats(streakStats);
      setPoints(userPoints);
    } catch (error) {
      console.error('Error loading streak data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de la racha');
    } finally {
      setLoading(false);
    }
  };

  const handleUseProtector = async () => {
    if (points < 1000) {
      Alert.alert(
        'Puntos Insuficientes',
        'Necesitas 1000 puntos para usar un protector de racha. Continúa asistiendo al gimnasio para ganar más puntos.'
      );
      return;
    }

    Alert.alert(
      'Usar Protector de Racha',
      '¿Estás seguro de que quieres usar un protector? Esto costará 1000 puntos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Usar',
          style: 'destructive',
          onPress: async () => {
            try {
              const today = new Date().toISOString().split('T')[0];
              await useStreakProtector(today);
              await updateUserPoints(points - 1000);
              await loadData();
              Alert.alert('Éxito', 'Protector de racha aplicado correctamente');
            } catch (error) {
              console.error('Error using streak protector:', error);
              Alert.alert('Error', 'No se pudo aplicar el protector de racha');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Ionicons name="flame" size={32} color="#2196F3" />
          <Text style={styles.streakTitle}>Racha Actual</Text>
        </View>
        
        <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
        <Text style={styles.streakLabel}>
          {stats.currentStreak === 1 ? 'día' : 'días'} consecutivos
        </Text>

        {stats.lastCheckIn && (
          <Text style={styles.lastCheckInText}>
            Último check-in: {' '}
            {formatDistanceToNow(new Date(stats.lastCheckIn), { 
              addSuffix: true,
              locale: es 
            })}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="trophy-outline" size={24} color="#FFC107" />
          <Text style={styles.statNumber}>{stats.bestStreak}</Text>
          <Text style={styles.statLabel}>Mejor Racha</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalDays}</Text>
          <Text style={styles.statLabel}>Total Días</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="star-outline" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{points}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.protectorButton,
          points < 1000 && styles.protectorButtonDisabled
        ]}
        onPress={handleUseProtector}
        disabled={points < 1000}
      >
        <Ionicons 
          name="shield-outline" 
          size={24} 
          color={points < 1000 ? '#999' : 'white'} 
        />
        <Text style={[
          styles.protectorButtonText,
          points < 1000 && styles.protectorButtonTextDisabled
        ]}>
          Usar Protector de Racha (1000 pts)
        </Text>
      </TouchableOpacity>

      {stats.streakHistory && stats.streakHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.historyTitle}>Historial de Rachas</Text>
          </View>
          
          {stats.streakHistory.slice(-3).reverse().map((streak, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyDays}>
                  {streak.days} {streak.days === 1 ? 'día' : 'días'}
                </Text>
                <Text style={styles.historyPoints}>+{streak.days * 100} pts</Text>
              </View>
              <Text style={styles.historyDates}>
                {format(new Date(streak.start), 'dd MMM yyyy', { locale: es })} - {' '}
                {format(new Date(streak.end), 'dd MMM yyyy', { locale: es })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lastCheckInText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  protectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  protectorButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  protectorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  protectorButtonTextDisabled: {
    color: '#999',
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDays: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyPoints: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyDates: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});