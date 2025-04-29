import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import StreakDisplay from '../components/StreakDisplay';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { useRefresh } from '../context/RefreshContext';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { refresh } = useRefresh();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

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
      <StreakDisplay />
      <AttendanceCalendar />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});