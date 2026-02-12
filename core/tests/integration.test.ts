import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DAMA-CRM Integration & Automation Tests', () => {
  describe('UnoPIM Inventory Webhook Parser', () => {
    const parseUnoPimWebhook = (payload: any) => {
      if (!payload || !payload.event || !payload.data) {
        throw new Error('Payload webhook UnoPIM inválido');
      }

      const { sku, stock, price, name } = payload.data;
      if (!sku) throw new Error('El campo SKU es obligatorio');

      return {
        event: payload.event,
        sku: String(sku).trim().toUpperCase(),
        stock: parseInt(stock, 10) || 0,
        price: parseFloat(price) || 0.0,
        name: name ? String(name).trim() : undefined,
        syncedAt: new Date().toISOString(),
      };
    };

    it('should correctly parse valid product.updated webhook event', () => {
      const webhookPayload = {
        event: 'product.updated',
        timestamp: 1770000000,
        data: {
          sku: 'SRV-RACK-01',
          name: 'Servidor Rack 1U Xeon',
          stock: 45,
          price: '2499.50',
        },
      };

      const result = parseUnoPimWebhook(webhookPayload);
      assert.strictEqual(result.event, 'product.updated');
      assert.strictEqual(result.sku, 'SRV-RACK-01');
      assert.strictEqual(result.stock, 45);
      assert.strictEqual(result.price, 2499.5);
    });

    it('should reject malformed webhook without SKU', () => {
      assert.throws(() => {
        parseUnoPimWebhook({
          event: 'product.created',
          data: { name: 'No SKU Item' },
        });
      }, /El campo SKU es obligatorio/);
    });
  });

  describe('Meta WhatsApp Cloud Webhook Verification & Normalization', () => {
    const verifyMetaWebhook = (mode: string, token: string, challenge: string, expectedToken: string) => {
      if (mode === 'subscribe' && token === expectedToken) {
        return challenge;
      }
      return null;
    };

    const normalizeInboundWhatsAppMessage = (entry: any) => {
      const message = entry?.changes?.[0]?.value?.messages?.[0];
      const contact = entry?.changes?.[0]?.value?.contacts?.[0];

      if (!message) return null;

      return {
        from: message.from,
        contactName: contact?.profile?.name || 'Desconocido',
        text: message.text?.body || (message.type === 'interactive' ? message.interactive?.button_reply?.title : ''),
        type: message.type,
        timestamp: new Date(parseInt(message.timestamp, 10) * 1000).toISOString(),
      };
    };

    it('should verify Meta webhook handshake challenge', () => {
      const challenge = '1158201444';
      const verifyToken = 'dama_crm_meta_token_secret';

      const validResponse = verifyMetaWebhook('subscribe', verifyToken, challenge, verifyToken);
      assert.strictEqual(validResponse, challenge);

      const invalidResponse = verifyMetaWebhook('subscribe', 'wrong_token', challenge, verifyToken);
      assert.strictEqual(invalidResponse, null);
    });

    it('should normalize inbound Meta WhatsApp text message', () => {
      const inboundPayload = {
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              contacts: [{ profile: { name: 'Carlos Mendoza' }, wa_id: '34600112233' }],
              messages: [
                {
                  from: '34600112233',
                  id: 'wamid.HBgLMzQ2MDAxMTIyMzM...',
                  timestamp: '1770001200',
                  text: { body: 'Hola, me gustaría agendar una demo técnica' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      };

      const normalized = normalizeInboundWhatsAppMessage(inboundPayload);
      assert.notStrictEqual(normalized, null);
      assert.strictEqual(normalized?.from, '34600112233');
      assert.strictEqual(normalized?.contactName, 'Carlos Mendoza');
      assert.strictEqual(normalized?.text, 'Hola, me gustaría agendar una demo técnica');
    });
  });

  describe('Workflow Engine Trigger Evaluator', () => {
    type TriggerType = 'DEAL_STAGE_CHANGED' | 'CONTACT_CREATED' | 'INVOICE_PAID';

    interface WorkflowRule {
      id: string;
      name: string;
      trigger: TriggerType;
      filterStage?: string;
      action: 'SEND_WHATSAPP' | 'CREATE_TASK' | 'NOTIFY_ADMIN';
    }

    const evaluateWorkflowRules = (trigger: TriggerType, context: { stage?: string; contactEmail?: string }, rules: WorkflowRule[]) => {
      return rules.filter((rule) => {
        if (rule.trigger !== trigger) return false;
        if (rule.filterStage && rule.filterStage !== context.stage) return false;
        return true;
      });
    };

    it('should trigger actions when deal moves to Won stage', () => {
      const rules: WorkflowRule[] = [
        {
          id: 'wf-1',
          name: 'Celebrar Negocio Ganado',
          trigger: 'DEAL_STAGE_CHANGED',
          filterStage: 'Cerrada Ganada',
          action: 'NOTIFY_ADMIN',
        },
        {
          id: 'wf-2',
          name: 'Bienvenida Contacto',
          trigger: 'CONTACT_CREATED',
          action: 'SEND_WHATSAPP',
        },
      ];

      const triggered = evaluateWorkflowRules('DEAL_STAGE_CHANGED', { stage: 'Cerrada Ganada' }, rules);
      assert.strictEqual(triggered.length, 1);
      assert.strictEqual(triggered[0].id, 'wf-1');
      assert.strictEqual(triggered[0].action, 'NOTIFY_ADMIN');
    });
  });
});
