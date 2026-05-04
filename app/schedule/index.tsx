/**
 * MuscleMemory — Schedule & Calendar Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository } from '../../src/database/repositories';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user' };
import { WorkoutSession } from '../../src/models';

type CalendarSession = WorkoutSession & { planName?: string, dayName?: string };

export default function ScheduleScreen() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Base date for calendar rendering (start of current month)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadSchedule = useCallback(async () => {
    if (!db || !currentUser) {
      setLoading(false);
      return;
    }
    try {
      const repo = new WorkoutRepository(db);
      
      // Load from 1 month ago to 2 months in the future
      const start = new Date(currentMonth);
      start.setMonth(start.getMonth() - 1);
      
      const end = new Date(currentMonth);
      end.setMonth(end.getMonth() + 2);

      const data = await repo.getUpcomingSchedule(
        currentUser.id,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, currentUser, currentMonth]);

  useEffect(() => {
    if (isReady) loadSchedule();
  }, [isReady, loadSchedule]);

  const changeMonth = (offset: number) => {
    Haptics.selectionAsync();
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayPress = (dateStr: string) => {
    Haptics.selectionAsync();
    const daySessions = sessions.filter(s => s.date === dateStr);
    
    if (daySessions.length > 0) {
      // Find the first planned session, or just the first session
      const planned = daySessions.find(s => s.status === 'planned');
      if (planned) {
        Alert.alert(
          'Workout Scheduled',
          `${planned.planName || 'Workout'}: ${planned.dayName || 'Custom'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Workout', 
              onPress: () => router.push({ pathname: '/workout/active', params: { sessionId: planned.id } }) 
            }
          ]
        );
      } else {
        Alert.alert('Workout Completed', 'You already completed a workout on this day.');
      }
    } else {
      Alert.alert(
        'Rest Day',
        'No workout scheduled for this day.',
        [
          { text: 'Close', style: 'cancel' },
          { 
            text: 'Start Ad-hoc Workout', 
            onPress: () => router.push('/workout/active')
          }
        ]
      );
    }
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Render calendar grid
  const renderCalendar = () => {
    const cells = [];
    // Blank cells before start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<View key={`blank-${i}`} style={styles.calendarCell} />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      // Ensure local time mapping doesn't shift the day
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const daySessions = sessions.filter(s => s.date === dateStr);
      const isToday = dateStr === todayStr;
      
      const hasCompleted = daySessions.some(s => s.status === 'completed');
      const hasPlanned = daySessions.some(s => s.status === 'planned');

      cells.push(
        <TouchableOpacity 
          key={`day-${d}`} 
          style={[
            styles.calendarCell, 
            isToday && styles.todayCell
          ]}
          onPress={() => handleDayPress(dateStr)}
        >
          <Text style={[styles.cellText, isToday && styles.todayText]}>{d}</Text>
          <View style={styles.dotsContainer}>
            {hasCompleted && <View style={[styles.dot, styles.completedDot]} />}
            {hasPlanned && !hasCompleted && <View style={[styles.dot, styles.plannedDot]} />}
          </View>
        </TouchableOpacity>
      );
    }
    
    return cells;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Weekly Agenda (upcoming 7 days)
  const agendaStart = new Date();
  const agendaDates = Array.from({length: 7}).map((_, i) => {
    const d = new Date(agendaStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Button variant="ghost" icon="arrow-back" onPress={() => router.back()} />
        <Text style={styles.headerTitle} numberOfLines={1}>Schedule</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Calendar View */}
        <Card variant="default" style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={`wd-${i}`} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.completedDot, { width: 8, height: 8 }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.plannedDot, { width: 8, height: 8 }]} />
              <Text style={styles.legendText}>Planned</Text>
            </View>
          </View>
        </Card>

        {/* Weekly Agenda */}
        <Text style={styles.sectionTitle}>Upcoming 7 Days</Text>
        <View style={styles.agendaContainer}>
          {agendaDates.map(dateStr => {
            const daySessions = sessions.filter(s => s.date === dateStr);
            const planned = daySessions.find(s => s.status === 'planned');
            const completed = daySessions.find(s => s.status === 'completed');
            
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = dateStr === todayStr;

            return (
              <Card 
                key={dateStr} 
                variant={isToday ? 'highlighted' : 'default'}
                glowColor={isToday ? Colors.primary : undefined}
                style={styles.agendaCard}
                onPress={() => handleDayPress(dateStr)}
              >
                <View style={styles.agendaRow}>
                  <View style={styles.agendaDateCol}>
                    <Text style={[styles.agendaDayName, isToday && { color: Colors.primary }]}>
                      {isToday ? 'Today' : dayName}
                    </Text>
                    <Text style={styles.agendaDayNum}>{dateObj.getDate()}</Text>
                  </View>
                  
                  <View style={styles.agendaContent}>
                    {completed ? (
                      <View style={styles.agendaStatus}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                        <Text style={[styles.agendaTitle, { color: Colors.success }]}>
                          {completed.planName ? `${completed.planName} (Done)` : 'Workout Completed'}
                        </Text>
                      </View>
                    ) : planned ? (
                      <>
                        <Text style={styles.agendaTitle}>{planned.dayName || 'Planned Workout'}</Text>
                        <Text style={styles.agendaSub}>{planned.planName}</Text>
                      </>
                    ) : (
                      <Text style={styles.agendaRestText}>Rest Day</Text>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </View>
              </Card>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: Spacing.xxl },
  
  calendarCard: { padding: Spacing.md, marginBottom: Spacing.xl },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  monthButton: { padding: Spacing.sm },
  monthText: { ...Typography.h2, color: Colors.textPrimary },
  
  weekDaysRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekDayText: { flex: 1, textAlign: 'center', ...Typography.labelSmall, color: Colors.textTertiary },
  
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  todayCell: { backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.full },
  cellText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  todayText: { color: Colors.primary, fontWeight: '700' },
  
  dotsContainer: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  completedDot: { backgroundColor: Colors.success },
  plannedDot: { backgroundColor: Colors.primary },
  
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendText: { ...Typography.caption, color: Colors.textSecondary },
  
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  agendaContainer: { gap: Spacing.sm },
  agendaCard: { padding: Spacing.md },
  agendaRow: { flexDirection: 'row', alignItems: 'center' },
  agendaDateCol: { width: 50, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.border, paddingRight: Spacing.sm, marginRight: Spacing.sm },
  agendaDayName: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  agendaDayNum: { ...Typography.h2, color: Colors.textPrimary },
  agendaContent: { flex: 1 },
  agendaTitle: { ...Typography.labelMedium, color: Colors.textPrimary },
  agendaSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  agendaStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  agendaRestText: { ...Typography.bodyMedium, color: Colors.textTertiary, fontStyle: 'italic' },
});
