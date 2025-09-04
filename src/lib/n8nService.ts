interface N8nPayload {
  action: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface BatchWorkflowAction {
  workflowId: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
}

interface N8nResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface AutomationConfig {
  workflowId: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
}

class N8nService {
  private async fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  private async generateSignature(payload: N8nPayload, timeoutMs = 5000): Promise<string> {
    const resp = await this.fetchWithTimeout('/api/generate-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, timeoutMs);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Signature service failed: ${resp.status} ${text}`);
    }

    const json = await resp.json().catch(() => null);
    if (!json || !json.signature) throw new Error('Invalid response from signature service');
    return json.signature;
  }

  private nowTs = (): number => Math.floor(Date.now() / 1000);

  async triggerWorkflow(workflowId: string, data: Record<string, unknown> = {}, opts = { timeoutMs: 15000 }): Promise<N8nResponse | null> {
    const payload: N8nPayload = {
      action: 'trigger_workflow',
      data: { workflowId, ...data },
      timestamp: this.nowTs()
    };

    const signature = await this.generateSignature(payload, 8000);

    const resp = await this.fetchWithTimeout('/api/webhook-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, signature })
    }, opts.timeoutMs);

    if (!resp.ok) {
      const contentType = resp.headers.get('content-type') || '';
      const errText = contentType.includes('application/json') 
        ? JSON.stringify(await resp.json().catch(() => ({}))) 
        : await resp.text().catch(() => '');
      throw new Error(`n8n trigger failed: ${resp.status} ${errText}`);
    }

    return await resp.json().catch(() => null);
  }

  async batchTriggerWorkflows(actions: BatchWorkflowAction[], opts = { timeoutMs: 30000 }): Promise<N8nResponse | null> {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Aucune action fournie pour batchTriggerWorkflows');
    }

    const payload: N8nPayload = {
      action: 'batch_trigger',
      data: { items: actions },
      timestamp: this.nowTs()
    };

    const signature = await this.generateSignature(payload, 8000);

    const resp = await this.fetchWithTimeout('/api/webhook-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, signature })
    }, opts.timeoutMs);

    if (!resp.ok) {
      const ct = resp.headers.get('content-type') || '';
      const errText = ct.includes('application/json') 
        ? JSON.stringify(await resp.json().catch(() => ({}))) 
        : await resp.text().catch(() => '');
      throw new Error(`Batch trigger failed: ${resp.status} ${errText}`);
    }

    return await resp.json().catch(() => null);
  }

  async toggleAutomation(isActive: boolean, config: AutomationConfig): Promise<N8nResponse | null> {
    const action = isActive ? 'start_automation' : 'stop_automation';
    const payload: N8nPayload = {
      action,
      data: { config },
      timestamp: this.nowTs()
    };

    const signature = await this.generateSignature(payload, 8000);

    const resp = await this.fetchWithTimeout('/api/webhook-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, signature })
    }, 12000);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`n8n API error: ${resp.status} ${text}`);
    }

    return await resp.json().catch(() => null);
  }

  async syncAutomationStatus(config: AutomationConfig): Promise<N8nResponse | null> {
    const payload: N8nPayload = {
      action: 'sync_automation_status',
      data: { config },
      timestamp: this.nowTs()
    };

    const signature = await this.generateSignature(payload, 8000);
    
    const resp = await this.fetchWithTimeout('/api/webhook-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, signature })
    }, 15000);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Sync failed: ${resp.status} ${text}`);
    }

    return await resp.json().catch(() => null);
  }

  async fetchStats(): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithTimeout('/api/automation/stats', {}, 12000);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Stats fetch failed: ${resp.status} ${text}`);
    }
    return await resp.json();
  }
}

export const n8nService = new N8nService();