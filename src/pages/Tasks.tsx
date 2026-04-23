import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Circle, Trash2, Plus, Calendar as CalendarIcon, Bell, Search, ArrowUp, ArrowDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Tasks({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskReminderDate, setNewTaskReminderDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const remindedTaskIds = useRef<Set<string>>(new Set());
  const [activeReminders, setActiveReminders] = useState<any[]>([]);

  useEffect(() => {
    // Remove completed or deleted tasks from active reminders
    setActiveReminders(prev => {
      const pendingTaskIds = new Set(tasks.filter(t => t.status === 'pending').map(t => t.id));
      return prev.filter(r => pendingTaskIds.has(r.id));
    });
  }, [tasks]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newReminders: any[] = [];
      
      tasks.forEach(task => {
        if (task.status === 'pending' && task.reminderDate) {
          const reminderTime = new Date(task.reminderDate);
          
          if (now >= reminderTime && !remindedTaskIds.current.has(task.id)) {
            newReminders.push(task);
            remindedTaskIds.current.add(task.id);
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: task.title,
              });
            }
          }
        }
      });
      
      if (newReminders.length > 0) {
        setActiveReminders(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNew = newReminders.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniqueNew];
        });
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('authorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newTaskTitle.trim()) return;

    try {
      const taskData: any = {
        authorId: user.uid,
        title: newTaskTitle.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (newTaskDueDate) {
        const dateObj = new Date(newTaskDueDate);
        taskData.dueDate = dateObj.toISOString();
      }

      if (newTaskReminderDate) {
        const reminderObj = new Date(newTaskReminderDate);
        taskData.reminderDate = reminderObj.toISOString();
      }

      await addDoc(collection(db, 'tasks'), taskData);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskReminderDate('');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: currentStatus === 'pending' ? 'completed' : 'pending'
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDate: string) => {
    try {
      if (!newDate) {
        await updateDoc(doc(db, 'tasks', taskId), {
          dueDate: deleteField()
        });
        return;
      }
      const dateObj = new Date(newDate);
      const isoDateString = dateObj.toISOString();
      await updateDoc(doc(db, 'tasks', taskId), {
        dueDate: isoDateString
      });
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };

  const handleUpdateReminderDate = async (taskId: string, newDate: string) => {
    try {
      if (!newDate) {
        await updateDoc(doc(db, 'tasks', taskId), {
          reminderDate: deleteField()
        });
        return;
      }
      const dateObj = new Date(newDate);
      const isoDateString = dateObj.toISOString();
      await updateDoc(doc(db, 'tasks', taskId), {
        reminderDate: isoDateString
      });
    } catch (error) {
      console.error('Error updating reminder date:', error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : task.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return sortOrder === 'asc' ? diff : -diff;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Active Reminders Toast */}
      {activeReminders.length > 0 && (
        <div className="fixed bottom-6 inset-e-6 z-50 flex flex-col gap-3">
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="bg-white rounded-2xl p-4 shadow-xl border border-teal-100 flex items-start gap-4 transition-all duration-300 max-w-sm">
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="font-bold text-slate-900">Task Reminder</h4>
                <p className="text-slate-600 text-sm mt-1 truncate">{reminder.title}</p>
              </div>
              <button 
                onClick={() => setActiveReminders(prev => prev.filter(r => r.id !== reminder.id))}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-slate-600">Manage your tasks and due dates.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-8">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
            required
          />
          <div className="relative flex-1 md:max-w-[160px]">
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all text-slate-600"
              title="Due Date"
            />
          </div>
          <div className="relative flex-1 md:max-w-[200px]">
            <input
              type="datetime-local"
              value={newTaskReminderDate}
              onChange={(e) => setNewTaskReminderDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all text-slate-600"
              title="Reminder Date & Time"
            />
          </div>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </form>
      </div>

      {tasks.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-12 ltr:pr-4 rtl:pl-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-sm flex items-center gap-2 text-slate-600"
              title={`Sort by due date (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
              <span className="hidden sm:inline font-medium">Sort</span>
            </button>
          </div>
          
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start">
            {(['all', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-teal-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No tasks yet</h2>
            <p className="text-slate-600">Add a task above to get started.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No matches found</h2>
            <p className="text-slate-600">No tasks match your search query.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isReminderDue = task.reminderDate && new Date(task.reminderDate) <= new Date() && task.status === 'pending';
            
            return (
            <div 
              key={task.id} 
              className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 transition-all ${
                task.status === 'completed' ? 'border-slate-200 opacity-60' : 
                isReminderDue ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              <button 
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className={`shrink-0 transition-colors relative w-6 h-6 ${task.status === 'completed' ? 'text-teal-600' : 'text-slate-300 hover:text-teal-500'}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {task.status === 'completed' ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <CheckCircle className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Circle className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 relative group hover:text-teal-600 transition-colors cursor-pointer px-2 py-1 -ms-2 rounded-md hover:bg-teal-50">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium group-hover:text-teal-600' : ''}>
                      {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'Set due date'}
                    </span>
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateDueDate(task.id, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Change due date"
                    />
                  </div>
                  
                  <div className={`inline-flex items-center gap-1.5 text-xs relative group transition-colors cursor-pointer px-2 py-1 rounded-md ${
                    isReminderDue ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}>
                    <Bell className={`w-3.5 h-3.5 ${isReminderDue ? 'animate-pulse' : ''}`} />
                    <span className={isReminderDue ? 'font-medium' : ''}>
                      {task.reminderDate ? `Reminder: ${formatDateTime(task.reminderDate)}` : 'Set reminder'}
                    </span>
                    <input
                      type="datetime-local"
                      value={task.reminderDate ? task.reminderDate.slice(0, 16) : ''}
                      onChange={(e) => handleUpdateReminderDate(task.id, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Change reminder"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )})
        )}
      </div>
    </div>
  );
}
