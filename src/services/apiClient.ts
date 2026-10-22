import type { User, Student, Assessment, GenerateFeedbackRequest, FeedbackContent } from '../types/index';

const TOKEN_KEY = 'synapse_session_token';
const USER_KEY = 'synapse_user';

class ApiClient {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      try {
        this.currentUser = JSON.parse(cached);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Auth
  public async register(payload: {
    name: string;
    email: string;
    password: string;
    role: 'teacher' | 'student';
    studentId?: string;
    gradeLevel?: string;
    schoolName?: string;
    teacherRegistrationCode?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setSession(res.token, res.user);
    return res;
  }

  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(res.token, res.user);
    return res;
  }

  public async demoSwitch(role: 'teacher' | 'student', email?: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
    this.setSession(res.token, res.user);
    return res;
  }

  public async getMe(): Promise<User> {
    const res = await this.request<{ user: User }>('/api/auth/me');
    this.currentUser = res.user;
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res.user;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.clearSession();
    }
  }

  // Students (Teacher only)
  public async getStudents(): Promise<Student[]> {
    const res = await this.request<{ students: Student[] }>('/api/students');
    return res.students;
  }

  public async addStudent(student: {
    studentId: string;
    name: string;
    email: string;
    gradeLevel: string;
    schoolName?: string;
  }): Promise<Student> {
    const res = await this.request<{ student: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    return res.student;
  }

  // Assessments
  public async getAssessments(): Promise<Assessment[]> {
    const res = await this.request<{ assessments: Assessment[] }>('/api/assessments');
    return res.assessments;
  }

  public async getAssessment(id: string): Promise<Assessment> {
    const res = await this.request<{ assessment: Assessment }>(`/api/assessments/${id}`);
    return res.assessment;
  }

  public async createAssessment(data: Partial<Assessment>): Promise<Assessment> {
    const res = await this.request<{ assessment: Assessment }>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.assessment;
  }

  public async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    const res = await this.request<{ assessment: Assessment }>(`/api/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.assessment;
  }

  public async publishAssessment(id: string): Promise<Assessment> {
    const res = await this.request<{ assessment: Assessment; message: string }>(`/api/assessments/${id}/publish`, {
      method: 'POST',
    });
    return res.assessment;
  }

  public async acknowledgeAssessment(id: string, reflectionNote?: string): Promise<Assessment> {
    const res = await this.request<{ assessment: Assessment }>(`/api/assessments/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ reflectionNote }),
    });
    return res.assessment;
  }

  public async deleteAssessment(id: string): Promise<void> {
    await this.request(`/api/assessments/${id}`, { method: 'DELETE' });
  }

  // AI Feedback Generation
  public async generateFeedback(payload: GenerateFeedbackRequest): Promise<FeedbackContent> {
    const res = await this.request<{ feedback: FeedbackContent }>('/api/feedback/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.feedback;
  }
}

export const api = new ApiClient();
