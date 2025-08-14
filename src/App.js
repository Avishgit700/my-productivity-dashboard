import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, Play, Pause, List, Timer, Calendar, Coffee, Target, BookOpen, Lightbulb, Palette, Save, Trash2 } from 'lucide-react';

export default function ActivityTracker() {
  // Initialize with empty arrays - no localStorage
  const [activities, setActivities] = useState([]);
  const [todos, setTodos] = useState([]);
  
  const [newActivity, setNewActivity] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [activeTimers, setActiveTimers] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('activities');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentJournalEntry, setCurrentJournalEntry] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  
  // Thoughts state
  const [thoughts, setThoughts] = useState([]);
  const [currentThought, setCurrentThought] = useState('');
  
  // Sketch state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [sketches, setSketches] = useState([]);
  
  // Pomodoro state
  const [pomodoroState, setPomodoroState] = useState({
    isActive: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    isBreak: false,
    session: 1,
    completedSessions: 0
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update active timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id].isActive) {
            updated[id].elapsed += 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pomodoro timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPomodoroState(prev => {
        if (!prev.isActive) return prev;
        
        if (prev.timeLeft <= 1) {
          // Timer completed
          const newState = { ...prev };
          if (!prev.isBreak) {
            // Work session completed
            newState.completedSessions += 1;
            if (newState.completedSessions % 4 === 0) {
              // Long break after 4 sessions
              newState.timeLeft = 15 * 60; // 15 minutes
            } else {
              // Short break
              newState.timeLeft = 5 * 60; // 5 minutes
            }
            newState.isBreak = true;
          } else {
            // Break completed
            newState.timeLeft = 25 * 60; // 25 minutes work
            newState.isBreak = false;
            newState.session += 1;
          }
          newState.isActive = false;
          return newState;
        }
        
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const addActivity = () => {
    if (newActivity.trim()) {
      const activity = {
        id: Date.now(),
        text: newActivity.trim(),
        completed: false,
        createdAt: new Date(),
        completedAt: null,
        totalTime: 0
      };
      setActivities(prevActivities => [activity, ...prevActivities]);
      setNewActivity('');
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date(),
        completedAt: null,
        priority: 'medium'
      };
      setTodos(prevTodos => [todo, ...prevTodos]);
      setNewTodo('');
    }
  };

  const toggleComplete = (id) => {
    setActivities(prevActivities => prevActivities.map(activity => 
      activity.id === id 
        ? { 
            ...activity, 
            completed: !activity.completed,
            completedAt: !activity.completed ? new Date() : null
          }
        : activity
    ));
    
    // Stop timer if activity is being completed
    if (activeTimers[id]?.isActive) {
      stopTimer(id);
    }
  };

  const toggleTodoComplete = (id) => {
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : null
          }
        : todo
    ));
  };

  const deleteActivity = (id) => {
    setActivities(prevActivities => prevActivities.filter(activity => activity.id !== id));
    if (activeTimers[id]) {
      const { [id]: removed, ...rest } = activeTimers;
      setActiveTimers(rest);
    }
  };

  const deleteTodo = (id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const startTimer = (id) => {
    setActiveTimers(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isActive: true,
        startTime: Date.now(),
        elapsed: prev[id]?.elapsed || 0
      }
    }));
  };

  const stopTimer = (id) => {
    setActiveTimers(prev => {
      if (!prev[id]) return prev;
      
      const updatedTimer = {
        ...prev[id],
        isActive: false
      };
      
      // Update total time in activity
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === id 
            ? { ...activity, totalTime: activity.totalTime + (prev[id]?.elapsed || 0) }
            : activity
        )
      );
      
      return {
        ...prev,
        [id]: { ...updatedTimer, elapsed: 0 }
      };
    });
  };

  // Pomodoro functions
  const startPomodoro = () => {
    setPomodoroState(prev => ({ ...prev, isActive: true }));
  };

  const pausePomodoro = () => {
    setPomodoroState(prev => ({ ...prev, isActive: false }));
  };

  const resetPomodoro = () => {
    setPomodoroState({
      isActive: false,
      timeLeft: 25 * 60,
      isBreak: false,
      session: 1,
      completedSessions: 0
    });
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(activity => {
      return activity.createdAt.toDateString() === date.toDateString();
    });
  };

  const getTodosForDate = (date) => {
    return todos.filter(todo => {
      return todo.createdAt.toDateString() === date.toDateString();
    });
  };

  // Journal functions
  const saveJournalEntry = () => {
    if (currentJournalEntry.trim() || journalTitle.trim()) {
      const entry = {
        id: Date.now(),
        title: journalTitle.trim() || 'Untitled Entry',
        content: currentJournalEntry.trim(),
        date: selectedDate,
        createdAt: new Date()
      };
      setJournalEntries(prevEntries => [entry, ...prevEntries]);
      setCurrentJournalEntry('');
      setJournalTitle('');
    }
  };

  const deleteJournalEntry = (id) => {
    setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };

  const getJournalForDate = (date) => {
    return journalEntries.filter(entry => {
      return entry.date.toDateString() === date.toDateString();
    });
  };

  // Thoughts functions
  const addThought = () => {
    if (currentThought.trim()) {
      const thought = {
        id: Date.now(),
        content: currentThought.trim(),
        createdAt: new Date(),
        color: ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100'][Math.floor(Math.random() * 5)]
      };
      setThoughts(prevThoughts => [thought, ...prevThoughts]);
      setCurrentThought('');
    }
  };

  const deleteThought = (id) => {
    setThoughts(prevThoughts => prevThoughts.filter(thought => thought.id !== id));
  };

  // Sketch functions
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSketch = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    const sketch = {
      id: Date.now(),
      dataURL,
      createdAt: new Date(),
      title: `Sketch ${sketches.length + 1}`
    };
    setSketches(prevSketches => [sketch, ...prevSketches]);
  };

  const deleteSketch = (id) => {
    setSketches(prevSketches => prevSketches.filter(sketch => sketch.id !== id));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPomodoroTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const selectedDateActivities = activities.filter(activity => {
    return activity.createdAt.toDateString() === selectedDate.toDateString();
  });

  const selectedDateTodos = todos.filter(todo => {
    return todo.createdAt.toDateString() === selectedDate.toDateString();
  });

  const completedActivities = selectedDateActivities.filter(activity => activity.completed).length;
  const completedTodos = selectedDateTodos.filter(todo => todo.completed).length;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Productivity Dashboard</h1>
          <p className="text-gray-600 text-lg">{currentTime.toLocaleDateString()} • {formatDateTime(currentTime)}</p>
          <p className="text-sm text-orange-600 mt-2">⚠️ Note: Data is stored in memory and will reset when you refresh the page</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1 overflow-x-auto">
            {[
              { id: 'activities', label: 'Activities', icon: Timer },
              { id: 'todos', label: 'To-Do List', icon: List },
              { id: 'journal', label: 'Journal', icon: BookOpen },
              { id: 'thoughts', label: 'Thoughts', icon: Lightbulb },
              { id: 'sketch', label: 'Sketch', icon: Palette },
              { id: 'pomodoro', label: 'Pomodoro', icon: Target },
              { id: 'calendar', label: 'Calendar', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            <div className="mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-4">
              <p className="text-xl font-semibold">
                {isToday(selectedDate) ? "Today's" : selectedDate.toLocaleDateString()} Activities: {completedActivities}/{selectedDateActivities.length} completed
              </p>
              <p className="text-sm opacity-90 mt-1">Total activities: {activities.length}</p>
            </div>

            <div className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                  placeholder="Add a new activity with time tracking..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                />
                <button
                  onClick={addActivity}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-semibold"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {selectedDateActivities.map((activity) => {
                const timer = activeTimers[activity.id];
                const isTimerActive = timer?.isActive || false;
                const currentElapsed = timer?.elapsed || 0;
                
                return (
                  <div
                    key={activity.id}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      activity.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleComplete(activity.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            activity.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {activity.completed && <Check size={16} />}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-lg font-medium ${
                            activity.completed ? 'text-green-700 line-through' : 'text-gray-800'
                          }`}>
                            {activity.text}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Created: {formatDateTime(activity.createdAt)}</span>
                            {activity.completedAt && (
                              <span>Completed: {formatDateTime(activity.completedAt)}</span>
                            )}
                            {activity.totalTime > 0 && (
                              <span className="text-blue-600 font-semibold">
                                Total time: {formatTime(activity.totalTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {(isTimerActive || currentElapsed > 0) && (
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-mono text-lg">
                            {formatTime(currentElapsed)}
                          </div>
                        )}
                        
                        {!activity.completed && (
                          <button
                            onClick={() => isTimerActive ? stopTimer(activity.id) : startTimer(activity.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTimerActive
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            {isTimerActive ? <Pause size={20} /> : <Play size={20} />}
                          </button>
                        )}

                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {selectedDateActivities.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Timer size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No activities yet for this date</p>
                  <p>Add your first activity above to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* To-Do List Tab */}
        {activeTab === 'todos' && (
          <div>
            <div className="mb-6 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg p-4">
              <p className="text-xl font-semibold">
                {isToday(selectedDate) ? "Today's" : selectedDate.toLocaleDateString()} To-Do List: {completedTodos}/{selectedDateTodos.length} completed
              </p>
              <p className="text-sm opacity-90 mt-1">Total to-dos: {todos.length}</p>
            </div>

            <div className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a new to-do item..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                />
                <button
                  onClick={addTodo}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-semibold"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {selectedDateTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    todo.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleTodoComplete(todo.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {todo.completed && <Check size={16} />}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`text-lg font-medium ${
                          todo.completed ? 'text-green-700 line-through' : 'text-gray-800'
                        }`}>
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Created: {formatDateTime(todo.createdAt)}</span>
                          {todo.completedAt && (
                            <span>Completed: {formatDateTime(todo.completedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
              
              {selectedDateTodos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <List size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No to-dos yet for this date</p>
                  <p>Add your first to-do above to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div>
            <div className="mb-6 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white rounded-lg p-4">
              <p className="text-xl font-semibold">
                Journal Entry for {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString()}
              </p>
            </div>

            <div className="mb-8 space-y-4">
              <input
                type="text"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                placeholder="Entry title (optional)..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-medium"
              />
              
              <textarea
                value={currentJournalEntry}
                onChange={(e) => setCurrentJournalEntry(e.target.value)}
                placeholder="Write your thoughts, experiences, and reflections here..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-lg resize-none"
              />
              
              <button
                onClick={saveJournalEntry}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-semibold"
              >
                <Save size={20} />
                Save Entry
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Previous Entries</h3>
              {getJournalForDate(selectedDate).map((entry) => (
                <div key={entry.id} className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">{entry.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{formatDateTime(entry.createdAt)}</span>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                </div>
              ))}
              
              {getJournalForDate(selectedDate).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No journal entries for this date</p>
                  <p>Start writing your first entry above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thoughts Tab */}
        {activeTab === 'thoughts' && (
          <div>
            <div className="mb-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg p-4">
              <p className="text-xl font-semibold">Quick Thoughts & Ideas</p>
            </div>

            <div className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentThought}
                  onChange={(e) => setCurrentThought(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addThought()}
                  placeholder="Capture a quick thought or idea..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-lg"
                />
                <button
                  onClick={addThought}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-semibold"
                >
                  <Lightbulb size={20} />
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {thoughts.map((thought) => (
                <div key={thought.id} className={`p-4 rounded-xl border-2 border-gray-200 ${thought.color} relative group`}>
                  <button
                    onClick={() => deleteThought(thought.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-gray-800 pr-6">{thought.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDateTime(thought.createdAt)}</p>
                </div>
              ))}
              
              {thoughts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No thoughts captured yet</p>
                  <p>Add your first thought above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sketch Tab */}
        {activeTab === 'sketch' && (
          <div>
            <div className="mb-6 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-lg p-4">
              <p className="text-xl font-semibold">Digital Sketch Pad</p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Brush Size:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm">{brushSize}px</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Color:</label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-10 h-8 rounded border"
                />
              </div>
              
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear
              </button>
              
              <button
                onClick={saveSketch}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
            </div>

            <div className="mb-8">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  startDrawing(mouseEvent);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  draw(mouseEvent);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
                className="border-2 border-gray-300 rounded-xl cursor-crosshair w-full max-w-full bg-white block"
                style={{ 
                  touchAction: 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>

            {sketches.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Saved Sketches</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sketches.map((sketch) => (
                    <div key={sketch.id} className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                      <img
                        src={sketch.dataURL}
                        alt={sketch.title}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{sketch.title}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(sketch.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => deleteSketch(sketch.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pomodoro Tab */}
        {activeTab === 'pomodoro' && (
          <div className="text-center">
            <div className="mb-8">
              <div className={`inline-block p-8 rounded-full ${
                pomodoroState.isBreak ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className={`text-6xl font-mono font-bold ${
                  pomodoroState.isBreak ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPomodoroTime(pomodoroState.timeLeft)}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {pomodoroState.isBreak ? (
                  <>
                    <Coffee className="inline mr-2" size={24} />
                    {pomodoroState.completedSessions % 4 === 0 ? 'Long Break' : 'Short Break'}
                  </>
                ) : (
                  <>
                    <Target className="inline mr-2" size={24} />
                    Work Session {pomodoroState.session}
                  </>
                )}
              </h2>
              <p className="text-gray-600">
                Completed Sessions: {pomodoroState.completedSessions}
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={pomodoroState.isActive ? pausePomodoro : startPomodoro}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors ${
                  pomodoroState.isActive
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {pomodoroState.isActive ? (
                  <>
                    <Pause className="inline mr-2" size={20} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="inline mr-2" size={20} />
                    Start
                  </>
                )}
              </button>
              
              <button
                onClick={resetPomodoro}
                className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Pomodoro Technique</h3>
              <div className="text-left space-y-2 text-gray-600">
                <p>• Work for 25 minutes with full focus</p>
                <p>• Take a 5-minute break</p>
                <p>• After 4 sessions, take a 15-minute long break</p>
                <p>• Repeat the cycle throughout your day</p>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(selectedDate).map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-2"></div>;
                }
                
                const dayActivities = getActivitiesForDate(date);
                const dayTodos = getTodosForDate(date);
                const hasItems = dayActivities.length > 0 || dayTodos.length > 0;
                const isSelected = isSelectedDate(date);
                const isCurrentDay = isToday(date);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : isCurrentDay
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : hasItems
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{date.getDate()}</div>
                    {hasItems && (
                      <div className="flex justify-center gap-1 mt-1">
                        {dayActivities.length > 0 && (
                          <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        )}
                        {dayTodos.length > 0 && (
                          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {(selectedDateActivities.length > 0 || selectedDateTodos.length > 0) && (
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">
                  {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString()}
                </h3>
                
                {selectedDateActivities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-600 mb-2">Activities ({selectedDateActivities.length})</h4>
                    <div className="space-y-1">
                      {selectedDateActivities.map(activity => (
                        <div key={activity.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${activity.completed ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className={activity.completed ? 'line-through text-gray-500' : ''}>
                            {activity.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDateTodos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-600 mb-2">To-Dos ({selectedDateTodos.length})</h4>
                    <div className="space-y-1">
                      {selectedDateTodos.map(todo => (
                        <div key={todo.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${todo.completed ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                            {todo.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {(((activeTab === 'activities' || activeTab === 'todos') && (selectedDateActivities.length > 0 || selectedDateTodos.length > 0)) ||
         (activeTab === 'journal' && getJournalForDate(selectedDate).length > 0) ||
         (activeTab === 'thoughts' && thoughts.length > 0) ||
         (activeTab === 'sketch' && sketches.length > 0)) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'activities' && (
              <>
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedDateActivities.length}</p>
                  <p className="text-blue-800">Today's Activities</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{completedActivities}</p>
                  <p className="text-green-800">Completed</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-600">{activities.length}</p>
                  <p className="text-orange-800">Total Ever</p>
                </div>
              </>
            )}
            {activeTab === 'todos' && (
              <>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedDateTodos.length}</p>
                  <p className="text-purple-800">Today's To-Dos</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{completedTodos}</p>
                  <p className="text-green-800">Completed</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-600">{todos.length}</p>
                  <p className="text-orange-800">Total Ever</p>
                </div>
              </>
            )}
            {activeTab === 'journal' && (
              <>
                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">{journalEntries.length}</p>
                  <p className="text-emerald-800">Total Entries</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-cyan-600">{getJournalForDate(selectedDate).length}</p>
                  <p className="text-cyan-800">Today's Entries</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {Math.ceil(journalEntries.reduce((total, entry) => total + entry.content.length, 0) / 100)}
                  </p>
                  <p className="text-teal-800">Words (×100)</p>
                </div>
              </>
            )}
            {activeTab === 'thoughts' && (
              <>
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600">{thoughts.length}</p>
                  <p className="text-amber-800">Total Thoughts</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {thoughts.filter(t => t.createdAt.toDateString() === new Date().toDateString()).length}
                  </p>
                  <p className="text-yellow-800">Today's Ideas</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.ceil(thoughts.reduce((total, thought) => total + thought.content.length, 0) / 50)}
                  </p>
                  <p className="text-orange-800">Words (×50)</p>
                </div>
              </>
            )}
            {activeTab === 'sketch' && (
              <>
                <div className="bg-pink-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-pink-600">{sketches.length}</p>
                  <p className="text-pink-800">Total Sketches</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {sketches.filter(s => s.createdAt.toDateString() === new Date().toDateString()).length}
                  </p>
                  <p className="text-purple-800">Today's Art</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-rose-600">
                    {Math.ceil(sketches.length / 7) || 1}
                  </p>
                  <p className="text-rose-800">Weekly Avg</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}