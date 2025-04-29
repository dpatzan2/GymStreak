import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Vibration,
  RefreshControl
} from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { 
  getLocations, 
  registerAttendance,
  getAttendanceRecords 
} from '../storage/asyncStorage';
import { calculateDistance } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../context/RefreshContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CheckInScreen({ navigation }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [checkInAnimation] = useState(new Animated.Value(1));
  const { location, errorMsg } = useLocation();
  const { refresh } = useRefresh();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location) {
      findNearbyGym();
    }
  }, [location, locations]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
      refresh(); // Actualizar otros componentes
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [savedLocations, attendanceRecords] = await Promise.all([
        getLocations(),
        getAttendanceRecords()
      ]);
      
      setLocations(savedLocations);
      
      // Verificar si ya se hizo check-in hoy
      const today = new Date().toISOString().split('T')[0];
      const checkedIn = attendanceRecords.some(record => 
        record.timestamp.startsWith(today)
      );
      setCheckedInToday(checkedIn);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const findNearbyGym = () => {
    if (!location || !locations.length) return;

    const nearby = locations.find(gym => {
      const distance = calculateDistance(
        location.coords,
        gym.coordinate
      );
      return distance <= 0.1; // 100 metros
    });

    setNearbyLocation(nearby);
  };

  const handleCheckIn = async () => {
    if (checkedInToday) {
      Alert.alert('Ya registrado', 'Ya has registrado tu asistencia hoy');
      return;
    }

    if (!nearbyLocation) {
      Alert.alert(
        'Fuera de rango',
        'Debes estar dentro del rango de un gimnasio registrado para hacer check-in'
      );
      return;
    }

    try {
      setLoading(true);
      const success = await registerAttendance(nearbyLocation.id);
      
      if (success) {
        // Animación de éxito
        Animated.sequence([
          Animated.timing(checkInAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(checkInAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();

        // Vibración de éxito
        Vibration.vibrate([0, 80, 80, 80]);

        setCheckedInToday(true);
        refresh(); // Actualizar otros componentes
        
        Alert.alert(
          '¡Check-in exitoso!',
          'Has ganado 100 puntos por tu asistencia de hoy'
        );
      } else {
        throw new Error('Failed to register attendance');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!location) {
      return {
        text: 'Obteniendo tu ubicación...',
        icon: 'location-outline',
        color: '#666'
      };
    }
    if (!locations.length) {
      return {
        text: 'No hay sedes registradas',
        icon: 'alert-circle-outline',
        color: '#ff6b6b'
      };
    }
    if (!nearbyLocation) {
      return {
        text: 'No estás cerca de ningún gimnasio registrado',
        icon: 'walk-outline',
        color: '#ff9800'
      };
    }
    if (checkedInToday) {
      return {
        text: 'Ya registraste tu asistencia hoy',
        icon: 'checkmark-circle-outline',
        color: '#4caf50'
      };
    }
    return {
      text: '¡Listo para hacer check-in!',
      icon: 'fitness-outline',
      color: '#2196F3'
    };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const status = getStatusMessage();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
    >
      <View style={styles.statusCard}>
        <Animated.View style={[
          styles.iconContainer,
          { transform: [{ scale: checkInAnimation }] }
        ]}>
          <Ionicons name={status.icon} size={64} color={status.color} />
        </Animated.View>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.text}
        </Text>
        {errorMsg && (
          <Text style={styles.errorText}>
            Error de ubicación: {errorMsg}
          </Text>
        )}
      </View>

      {nearbyLocation && (
        <View style={styles.gymCard}>
          <Text style={styles.gymTitle}>Gimnasio detectado:</Text>
          <Text style={styles.gymName}>{nearbyLocation.name}</Text>
          <Text style={styles.gymDate}>
            Registrado el {format(new Date(nearbyLocation.timestamp), 'dd MMMM yyyy', { locale: es })}
          </Text>
          <View style={styles.distanceContainer}>
            <Ionicons name="navigate" size={20} color="#666" />
            <Text style={styles.distanceText}>
              {location ? `A ${Math.round(calculateDistance(
                location.coords,
                nearbyLocation.coordinate
              ) * 1000)} metros` : 'Calculando distancia...'}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.checkInButton,
          (!nearbyLocation || checkedInToday) && styles.checkInButtonDisabled
        ]}
        onPress={handleCheckIn}
        disabled={!nearbyLocation || checkedInToday}
      >
        <Ionicons 
          name={checkedInToday ? "checkmark-circle" : "fitness"} 
          size={24} 
          color="white" 
        />
        <Text style={styles.checkInButtonText}>
          {checkedInToday ? 'Asistencia Registrada' : 'Registrar Asistencia'}
        </Text>
      </TouchableOpacity>

      {!locations.length && (
        <TouchableOpacity
          style={styles.addLocationButton}
          onPress={() => navigation.navigate('Locations')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.addLocationText}>
            Agregar Nueva Sede
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#666" />
        <Text style={styles.infoText}>
          Para registrar tu asistencia, debes estar dentro del rango de un gimnasio registrado (100 metros).
          Cada check-in te otorga 100 puntos que puedes usar para proteger tu racha.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  statusCard: {
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
  iconContainer: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  gymCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gymTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  gymName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gymDate: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  distanceText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  checkInButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addLocationText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});