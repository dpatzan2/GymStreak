import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRefresh } from '../context/RefreshContext';
import { 
  getAttendanceRecords, 
  getStreakProtectorsUsage,
  getUserData 
} from '../storage/asyncStorage';
import { Ionicons } from '@expo/vector-icons';

export default function AttendanceCalendar() {
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useRefresh();

  useEffect(() => {
    loadAttendanceDates();
  }, [refreshKey]);

  const loadAttendanceDates = async () => {
    try {
      setLoading(true);
      const [records, protectorsUsage, userData] = await Promise.all([
        getAttendanceRecords(),
        getStreakProtectorsUsage(),
        getUserData()
      ]);

      const marked = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const restDays = userData.restDays || [];

      // Marcar días de asistencia
      records.forEach(record => {
        const date = record.timestamp.split('T')[0];
        marked[date] = {
          selected: true,
          selectedColor: '#2196F3',
          customStyles: {
            container: {
              backgroundColor: '#2196F3',
            },
            text: {
              color: 'white',
              fontWeight: 'bold',
            }
          }
        };
      });

      // Marcar días con protector usado
      Object.keys(protectorsUsage).forEach(date => {
        marked[date] = {
          ...marked[date],
          selected: true,
          selectedColor: marked[date] ? '#2196F3' : '#4CAF50',
          marked: true,
          dotColor: '#FFC107',
          customStyles: {
            container: {
              backgroundColor: marked[date] ? '#2196F3' : '#4CAF50',
              borderWidth: 2,
              borderColor: '#FFC107',
            },
            text: {
              color: 'white',
              fontWeight: 'bold',
            },
            dots: [{
              color: '#FFC107'
            }]
          }
        };
      });

      // Marcar días de descanso
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      
      for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
        if (restDays.includes(d.getDay())) {
          const dateStr = format(d, 'yyyy-MM-dd');
          if (!marked[dateStr]) {
            marked[dateStr] = {
              disabled: true,
              disableTouchEvent: false,
              customStyles: {
                container: {
                  backgroundColor: '#f5f5f5',
                  borderRadius: 0,
                },
                text: {
                  color: '#999',
                  fontStyle: 'italic'
                }
              }
            };
          }
        }
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading attendance dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomHeader = (date) => {
    return (
      <View style={styles.customHeader}>
        <Text style={styles.monthText}>
          {format(date, 'MMMM yyyy', { locale: es })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        markedDates={markedDates}
        markingType={'custom'}
        renderHeader={renderCustomHeader}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#666666',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#FFC107',
          selectedDotColor: '#ffffff',
          arrowColor: '#2196F3',
          monthTextColor: '#2d4150',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500'
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendSection}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Asistencia</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { 
              backgroundColor: '#4CAF50',
              borderWidth: 2,
              borderColor: '#FFC107'
            }]} />
            <Text style={styles.legendText}>Protector Usado</Text>
          </View>
        </View>
        <View style={styles.legendSection}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { 
              backgroundColor: '#f5f5f5',
              borderWidth: 1,
              borderColor: '#ddd'
            }]} />
            <Text style={styles.legendText}>Día de Descanso</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { 
              backgroundColor: '#2196F3',
              borderWidth: 2,
              borderColor: '#FFC107'
            }]} />
            <Text style={styles.legendText}>Asistencia + Protector</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Desliza hacia abajo para actualizar el calendario
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    overflow: 'hidden',
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    margin: 16,
    height: 350,
  },
  calendar: {
    borderRadius: 15,
    elevation: 0,
    shadowColor: 'transparent',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    textTransform: 'capitalize',
  },
  legend: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flex: 1,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666666',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
});