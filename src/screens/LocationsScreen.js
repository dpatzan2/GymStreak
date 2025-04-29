import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  Keyboard,
  Platform
} from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { 
  getLocations, 
  saveLocation, 
  deleteLocation 
} from '../storage/asyncStorage';
import { calculateDistance } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../context/RefreshContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LocationsScreen() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const { location: userLocation, errorMsg } = useLocation();
  const { refresh } = useRefresh();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const savedLocations = await getLocations();
      setLocations(savedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'No se pudieron cargar las ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    refresh(); // Actualizar otros componentes
    setRefreshing(false);
  };

  const handleAddLocation = async () => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    if (!locationName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la ubicación');
      return;
    }

    // Verificar si ya existe una ubicación cercana
    const nearbyLocation = locations.find(loc => {
      const distance = calculateDistance(
        userLocation.coords,
        loc.coordinate
      );
      return distance <= 0.1; // 100 metros
    });

    if (nearbyLocation) {
      Alert.alert(
        'Ubicación cercana detectada',
        'Ya existe un gimnasio registrado cerca de esta ubicación'
      );
      return;
    }

    try {
      const newLocation = {
        id: Date.now().toString(),
        name: locationName.trim(),
        coordinate: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        timestamp: new Date().toISOString()
      };

      await saveLocation(newLocation);
      setLocations([...locations, newLocation]);
      setLocationName('');
      setAddingLocation(false);
      Keyboard.dismiss();
      
      Alert.alert(
        'Éxito',
        'Nueva ubicación registrada correctamente'
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'No se pudo guardar la ubicación');
    }
  };

  const handleDeleteLocation = (location) => {
    Alert.alert(
      'Eliminar ubicación',
      `¿Estás seguro de que quieres eliminar "${location.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(location.id);
              setLocations(locations.filter(loc => loc.id !== location.id));
              Alert.alert('Éxito', 'Ubicación eliminada correctamente');
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', 'No se pudo eliminar la ubicación');
            }
          }
        }
      ]
    );
  };

  const getDistanceText = (locationCoordinate) => {
    if (!userLocation) return 'Calculando distancia...';

    const distance = calculateDistance(
      userLocation.coords,
      locationCoordinate
    );

    if (distance < 0.1) {
      return '¡Estás aquí!';
    } else if (distance < 1) {
      return `A ${Math.round(distance * 1000)} metros`;
    } else {
      return `A ${distance.toFixed(1)} km`;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando ubicaciones...</Text>
      </View>
    );
  }

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
      {!addingLocation ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddingLocation(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addButtonText}>Agregar Nueva Sede</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addLocationForm}>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la sede"
            value={locationName}
            onChangeText={setLocationName}
            autoFocus
            maxLength={50}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setAddingLocation(false);
                setLocationName('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddLocation}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color="#999" />
          <Text style={styles.emptyStateText}>
            No hay sedes registradas
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Agrega tu primera sede para comenzar a registrar tu asistencia
          </Text>
        </View>
      ) : (
        locations.map(loc => (
          <View key={loc.id} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteLocation(loc)}
              >
                <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.locationInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Registrado el {format(new Date(loc.timestamp), 'dd MMMM yyyy', { locale: es })}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons 
                  name="navigate-outline" 
                  size={20} 
                  color="#666" 
                />
                <Text style={styles.infoText}>
                  {getDistanceText(loc.coordinate)}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#666" />
        <Text style={styles.infoText}>
          Las sedes registradas deben estar a más de 100 metros de distancia entre sí.
          Asegúrate de estar en el lugar correcto al registrar una nueva sede.
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addLocationForm: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  locationCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  locationInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});