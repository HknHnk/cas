// RevisionCalendar.tsx
import React, { useState, useEffect } from 'react';
import { getSubjects, createSubject, getEvents, getEventsForDate, getEventsForWeek, 
         createEvent, toggleEventCompletion as toggleEvent, deleteEvent as removeEvent, 
         getExams, getNextExam as fetchNextExam, getExamsForDay as fetchExamsForDay } from './api';
import { Subject, RevisionEvent, Exam } from './supabase';

// Type for grouped events
type GroupedEvents = {
  morning: RevisionEvent[];
  afternoon: RevisionEvent[];
  night: RevisionEvent[];
};

const RevisionCalendar: React.FC = () => {
  // Get days in a specific week
  const getWeekDays = (date: Date): Date[] => {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = date.getDate() - day;
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(date);
      newDate.setDate(diff + i);
      weekDays.push(newDate);
    }
    
    return weekDays;
  };

  // State for subjects and events
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<RevisionEvent[]>([]);
  const [newSubject, setNewSubject] = useState<string>('');
  const [newSubjectColor, setNewSubjectColor] = useState<string>('bg-gray-500');
  
  // State for exams
  const [exams, setExams] = useState<Exam[]>([]);
  
  // State for the calendar
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date[]>(getWeekDays(new Date()));
  
  // State for the new event form
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [newEventSubject, setNewEventSubject] = useState<string>('');
  const [newEventTime, setNewEventTime] = useState<string>('09:00');
  const [newEventDuration, setNewEventDuration] = useState<number>(60);
  const [newEventNotes, setNewEventNotes] = useState<string>('');
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  
  // Colors for subjects
  const colorOptions = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
    'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
  ];

  // Load initial data (subjects and exams)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get subjects
        const subjectsData = await getSubjects();
        setSubjects(subjectsData);
        
        // Get exams
        const examsData = await getExams();
        setExams(examsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Load events when week changes
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const startDate = currentWeek[0].toISOString().split('T')[0];
        const endDate = currentWeek[6].toISOString().split('T')[0];
        const eventsData = await getEventsForWeek(startDate, endDate);
        setEvents(eventsData);
        setEventsLoading(false);
      } catch (error) {
        console.error('Error loading events for week:', error);
        setEventsLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentWeek]);

  // Handle week navigation
  const prevWeek = () => {
    const prevWeekDate = new Date(currentWeek[0]);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    setCurrentWeek(getWeekDays(prevWeekDate));
  };
  
  const nextWeek = () => {
    const nextWeekDate = new Date(currentWeek[0]);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    setCurrentWeek(getWeekDays(nextWeekDate));
  };

  // Format week range for display
  const getWeekRangeText = (weekDays: Date[]): string => {
    const startDate = weekDays[0];
    const endDate = weekDays[6];
    
    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const endMonth = endDate.toLocaleString('default', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
    } else {
      return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
  };

  // Handle subject creation
  const handleAddSubject = async () => {
    if (newSubject.trim() === '') return;
    
    try {
      const subjectData = {
        name: newSubject,
        color: newSubjectColor
      };
      
      const newSubjectObj = await createSubject(subjectData);
      setSubjects([...subjects, newSubjectObj]);
      setNewSubject('');
      setNewSubjectColor('bg-gray-500');
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  // Handle event creation
  const handleAddEvent = async () => {
    if (newEventSubject === '') return;
    
    try {
      const eventData = {
        subject_id: newEventSubject,
        date: selectedDate.toISOString().split('T')[0],
        time: newEventTime,
        duration: newEventDuration,
        completed: false,
        notes: newEventNotes || null
      };
      
      const newEvent = await createEvent(eventData);
      setEvents([...events, newEvent]);
      setShowEventForm(false);
      setNewEventSubject('');
      setNewEventTime('09:00');
      setNewEventDuration(60);
      setNewEventNotes('');
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Handle event completion toggle
  const handleToggleEventCompletion = async (eventId: string, isCompleted: boolean) => {
    try {
      const updatedEvent = await toggleEvent(eventId, isCompleted);
      
      setEvents(
        events.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
    } catch (error) {
      console.error('Error toggling event completion:', error);
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await removeEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Filter events for the selected date
  const getEventsForSelectedDate = (): RevisionEvent[] => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    return events.filter(event => event.date === selectedDateStr);
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date): RevisionEvent[] => {
    if (!day) return [];
    
    const dayStr = day.toISOString().split('T')[0];
    return events.filter(event => event.date === dayStr);
  };

  // Format time from minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${mins} min`;
    }
  };

  // Get time of day category
  const getTimeOfDay = (time: string): 'morning' | 'afternoon' | 'night' => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'night';
  };

  // Get color for time of day
  const getTimeOfDayColor = (time: string): string => {
    const timeOfDay = getTimeOfDay(time);
    switch (timeOfDay) {
      case 'morning': return 'border-yellow-300';
      case 'afternoon': return 'border-orange-300';
      case 'night': return 'border-indigo-300';
      default: return '';
    }
  };

  // Get time of day label
  const getTimeOfDayLabel = (time: string): string => {
    const timeOfDay = getTimeOfDay(time);
    switch (timeOfDay) {
      case 'morning': return '🌄 Morning';
      case 'afternoon': return '☀️ Afternoon';
      case 'night': return '🌙 Night';
      default: return '';
    }
  };

  // Get the name of the month
  const getMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Check if a day has events
  const hasEvents = (day: Date): boolean => {
    if (!day) return false;
    return getEventsForDay(day).length > 0;
  };

  // Get subject color by subject ID
  const getSubjectColor = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.color : 'bg-gray-500';
  };

  // Get subject name by subject ID
  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };
  
  // Get events for selected date grouped by time of day
  const getEventsGroupedByTimeOfDay = (): GroupedEvents => {
    const selectedEvents = getEventsForSelectedDate();
    const grouped: GroupedEvents = {
      morning: selectedEvents.filter(event => getTimeOfDay(event.time) === 'morning'),
      afternoon: selectedEvents.filter(event => getTimeOfDay(event.time) === 'afternoon'),
      night: selectedEvents.filter(event => getTimeOfDay(event.time) === 'night')
    };
    return grouped;
  };
  
  // Get exams for a specific day
  const getExamsForDay = (day: Date): Exam[] => {
    if (!day) return [];
    
    const dayStr = day.toISOString().split('T')[0];
    return exams.filter(exam => exam.date === dayStr);
  };

  // Calculate days until exam
  const getDaysUntilExam = (examDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(examDate);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get the next upcoming exam
  const getNextExam = (): Exam | null => {
    const today = new Date().toISOString().split('T')[0];
    
    const upcomingExams = exams
      .filter(exam => exam.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcomingExams.length > 0 ? upcomingExams[0] : null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">AS Level Revision Calendar</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading calendar data...</div>
      ) : (
        <>
          {/* Calendar navigation */}
          <div className="flex justify-between items-center mb-4">
            <button 
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              onClick={prevWeek}
            >
              &lt; Prev Week
            </button>
            
            <h2 className="text-xl font-semibold">
              Week of {getWeekRangeText(currentWeek)}
            </h2>
            
            <button 
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              onClick={nextWeek}
            >
              Next Week &gt;
            </button>
          </div>
          
          {/* Weekly calendar grid */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {currentWeek.map((day, dayIndex) => (
                <div 
                  key={dayIndex}
                  className={`border rounded p-2 min-h-48 ${
                    day.getDate() === new Date().getDate() && 
                    day.getMonth() === new Date().getMonth() && 
                    day.getFullYear() === new Date().getFullYear() 
                      ? 'bg-blue-100' 
                      : ''
                  } ${
                    day.getDate() === selectedDate.getDate() && 
                    day.getMonth() === selectedDate.getMonth() && 
                    day.getFullYear() === selectedDate.getFullYear() 
                      ? 'ring-2 ring-blue-500' 
                      : ''
                  }`}
                  onClick={() => setSelectedDate(new Date(day))}
                >
                  <div>
                    <div className="text-right font-semibold mb-2">
                      {day.getDate()} {day.toLocaleString('default', { month: 'short' })}
                    </div>
                    
                    {eventsLoading ? (
                      <div className="text-center text-xs text-gray-500">Loading...</div>
                    ) : (
                      <>
                        {/* Exams for this day */}
                        {getExamsForDay(day).length > 0 && (
                          <div className="mb-2 mt-1">
                            <div className="text-xs font-bold bg-red-100 text-red-700 p-1 rounded mb-1">
                              📝 EXAM DAY
                            </div>
                            {getExamsForDay(day).map(exam => (
                              <div 
                                key={exam.id} 
                                className="bg-red-500 border-l-4 border-red-700 text-white text-xs p-1 rounded mb-1"
                              >
                                {exam.time} - {exam.name}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Morning section */}
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-yellow-600 border-b border-yellow-200 mb-1">
                            🌄 Morning
                          </div>
                          {getEventsForDay(day)
                            .filter(event => getTimeOfDay(event.time) === 'morning')
                            .map(event => (
                              <div 
                                key={event.id} 
                                className={`${getSubjectColor(event.subject_id)} ${event.completed ? 'opacity-50' : ''} 
                                border-l-4 ${getTimeOfDayColor(event.time)} text-white text-xs p-1 rounded mb-1`}
                              >
                                {event.time} - {getSubjectName(event.subject_id)}
                              </div>
                            ))}
                        </div>
                        
                        {/* Afternoon section */}
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-orange-600 border-b border-orange-200 mb-1">
                            ☀️ Afternoon
                          </div>
                          {getEventsForDay(day)
                            .filter(event => getTimeOfDay(event.time) === 'afternoon')
                            .map(event => (
                              <div 
                                key={event.id} 
                                className={`${getSubjectColor(event.subject_id)} ${event.completed ? 'opacity-50' : ''} 
                                border-l-4 ${getTimeOfDayColor(event.time)} text-white text-xs p-1 rounded mb-1`}
                              >
                                {event.time} - {getSubjectName(event.subject_id)}
                              </div>
                            ))}
                        </div>
                        
                        {/* Night section */}
                        <div className="mb-1">
                          <div className="text-xs font-semibold text-indigo-600 border-b border-indigo-200 mb-1">
                            🌙 Night
                          </div>
                          {getEventsForDay(day)
                            .filter(event => getTimeOfDay(event.time) === 'night')
                            .map(event => (
                              <div 
                                key={event.id} 
                                className={`${getSubjectColor(event.subject_id)} ${event.completed ? 'opacity-50' : ''} 
                                border-l-4 ${getTimeOfDayColor(event.time)} text-white text-xs p-1 rounded mb-1`}
                              >
                                {event.time} - {getSubjectName(event.subject_id)}
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* D-Day countdown - smaller, more compact version */}
          {getNextExam() && (
            <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-4">
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">Next:</span>
                <span className="font-medium">{getNextExam()?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">{new Date(getNextExam()!.date).toLocaleDateString()}</span>
                <span className="font-bold text-red-600">D-{getDaysUntilExam(getNextExam()!.date)}</span>
              </div>
            </div>
          )}
          
          {/* Subject management */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Subjects</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {subjects.map(subject => (
                <div 
                  key={subject.id} 
                  className={`${subject.color} text-white px-3 py-1 rounded-full text-sm`}
                >
                  {subject.name}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Add new subject"
                className="border rounded px-3 py-1 flex-grow"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              
              <div className="flex gap-1">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`${color} w-6 h-6 rounded-full ${newSubjectColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    onClick={() => setNewSubjectColor(color)}
                  />
                ))}
              </div>
              
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={handleAddSubject}
              >
                Add
              </button>
            </div>
          </div>
          
          {/* Selected date events */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                Events for {selectedDate.toLocaleDateString()}
              </h2>
              
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => setShowEventForm(true)}
              >
                Add Event
              </button>
            </div>
            
            {getEventsForSelectedDate().length === 0 ? (
              <p className="text-gray-500 italic">No events scheduled for this day.</p>
            ) : (
              <div className="space-y-4">
                {/* Morning events */}
                {getEventsGroupedByTimeOfDay().morning.length > 0 && (
                  <div className="border-l-4 border-yellow-300 pl-3">
                    <h3 className="font-semibold mb-2">🌄 Morning</h3>
                    <div className="space-y-2">
                      {getEventsGroupedByTimeOfDay().morning.map(event => (
                        <div 
                          key={event.id} 
                          className={`border rounded p-3 ${event.completed ? 'bg-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`${getSubjectColor(event.subject_id)} w-3 h-3 rounded-full`}></span>
                                <span className="font-semibold">{getSubjectName(event.subject_id)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Time: {event.time} • Duration: {formatDuration(event.duration)}
                              </div>
                              {event.notes && (
                                <div className="mt-2 text-sm">
                                  {event.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                className={`${event.completed ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-2 py-1 rounded text-sm`}
                                onClick={() => handleToggleEventCompletion(event.id, event.completed)}
                              >
                                {event.completed ? 'Completed' : 'Mark Complete'}
                              </button>
                              
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Afternoon events */}
                {getEventsGroupedByTimeOfDay().afternoon.length > 0 && (
                  <div className="border-l-4 border-orange-300 pl-3">
                    <h3 className="font-semibold mb-2">☀️ Afternoon</h3>
                    <div className="space-y-2">
                      {getEventsGroupedByTimeOfDay().afternoon.map(event => (
                        <div 
                          key={event.id} 
                          className={`border rounded p-3 ${event.completed ? 'bg-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`${getSubjectColor(event.subject_id)} w-3 h-3 rounded-full`}></span>
                                <span className="font-semibold">{getSubjectName(event.subject_id)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Time: {event.time} • Duration: {formatDuration(event.duration)}
                              </div>
                              {event.notes && (
                                <div className="mt-2 text-sm">
                                  {event.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                className={`${event.completed ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-2 py-1 rounded text-sm`}
                                onClick={() => handleToggleEventCompletion(event.id, event.completed)}
                              >
                                {event.completed ? 'Completed' : 'Mark Complete'}
                              </button>
                              
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Night events */}
                {getEventsGroupedByTimeOfDay().night.length > 0 && (
                  <div className="border-l-4 border-indigo-300 pl-3">
                    <h3 className="font-semibold mb-2">🌙 Night</h3>
                    <div className="space-y-2">
                      {getEventsGroupedByTimeOfDay().night.map(event => (
                        <div 
                          key={event.id} 
                          className={`border rounded p-3 ${event.completed ? 'bg-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`${getSubjectColor(event.subject_id)} w-3 h-3 rounded-full`}></span>
                                <span className="font-semibold">{getSubjectName(event.subject_id)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Time: {event.time} • Duration: {formatDuration(event.duration)}
                              </div>
                              {event.notes && (
                                <div className="mt-2 text-sm">
                                  {event.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                className={`${event.completed ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-2 py-1 rounded text-sm`}
                                onClick={() => handleToggleEventCompletion(event.id, event.completed)}
                              >
                                {event.completed ? 'Completed' : 'Mark Complete'}
                              </button>
                              
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Exams list */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Upcoming Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exams
                .filter(exam => getDaysUntilExam(exam.date) >= 0)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(exam => {
                  const daysUntil = getDaysUntilExam(exam.date);
                  const examSubject = subjects.find(s => s.id === exam.subject_id);
                  const bgColor = examSubject?.color.replace('bg-', 'border-');
                  
                  return (
                    <div 
                      key={exam.id} 
                      className={`border-l-4 ${bgColor} p-3 rounded shadow-sm`}
                    >
                      <div className="font-semibold">{exam.name}</div>
                      <div className="text-sm">
                        Date: {new Date(exam.date).toLocaleDateString()} at {exam.time}
                      </div>
                      <div className="text-sm">
                        Duration: {formatDuration(exam.duration)}
                      </div>
                      <div className="mt-1 font-medium text-red-600">
                        {daysUntil === 0 ? 'TODAY!' : `${daysUntil} days remaining`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* New event form */}
          {showEventForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Revision Session</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select 
                    className="w-full border rounded px-3 py-2"
                    value={newEventSubject}
                    onChange={(e) => setNewEventSubject(e.target.value)}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full border rounded px-3 py-2"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input 
                    type="number" 
                    min="15"
                    step="15"
                    className="w-full border rounded px-3 py-2"
                    value={newEventDuration}
                    onChange={(e) => setNewEventDuration(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <button 
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={handleAddEvent}
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RevisionCalendar;