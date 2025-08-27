import type { User, Project, Appointment, TeacherSchedule, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'student' | 'teacher';
    student_id?: string;
    teacher_id?: string;
    department?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Project endpoints
  async getProjects(): Promise<{ projects: Project[] }> {
    return this.request<{ projects: Project[] }>('/projects');
  }

  async getProject(id: number): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/projects/${id}`);
  }

  async createProject(data: { title: string; description?: string }): Promise<{ message: string; project: Project }> {
    return this.request<{ message: string; project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: number, data: Partial<Project>): Promise<{ message: string; project: Project }> {
    return this.request<{ message: string; project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addProjectMember(projectId: number, studentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    });
  }

  async removeProjectMember(projectId: number, studentId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${projectId}/members/${studentId}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(params?: {
    status?: string;
    project_id?: number;
    date?: string;
  }): Promise<{ appointments: Appointment[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.project_id) searchParams.append('project_id', params.project_id.toString());
    if (params?.date) searchParams.append('date', params.date);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
    
    return this.request<{ appointments: Appointment[] }>(endpoint);
  }

  async getAppointment(id: number): Promise<{ appointment: Appointment }> {
    return this.request<{ appointment: Appointment }>(`/appointments/${id}`);
  }

  async createAppointment(data: {
    project_id: number;
    teacher_id: number;
    title: string;
    description?: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    location?: string;
  }): Promise<{ message: string; appointment: Appointment }> {
    return this.request<{ message: string; appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: number, status: string): Promise<{ message: string; appointment: Appointment }> {
    return this.request<{ message: string; appointment: Appointment }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async addAppointmentNote(id: number, note: string): Promise<{ message: string; note: any }> {
    return this.request<{ message: string; note: any }>(`/appointments/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  // Schedule endpoints
  async getTeacherSchedule(teacherId: number, date?: string): Promise<{ schedule: TeacherSchedule[] }> {
    const endpoint = date 
      ? `/appointments/teacher/${teacherId}/schedule?date=${date}`
      : `/appointments/teacher/${teacherId}/schedule`;
    
    return this.request<{ schedule: TeacherSchedule[] }>(endpoint);
  }

  async updateTeacherSchedule(schedules: TeacherSchedule[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/appointments/teacher/schedule', {
      method: 'PUT',
      body: JSON.stringify({ schedules }),
    });
  }
}

export const apiService = new ApiService();
