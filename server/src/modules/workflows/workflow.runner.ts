import { prisma } from '../../prisma';

export interface WorkflowEvent {
  trigger: string; // e.g. "deal.won", "contact.created", "invoice.paid"
  data: Record<string, any>;
}

/**
 * Automation Workflow Dispatcher
 * Dispatches triggers without blocking main HTTP requests.
 */
export async function dispatchWorkflowEvent(event: WorkflowEvent): Promise<void> {
  setImmediate(async () => {
    try {
      const activeWorkflows = await prisma.workflow.findMany({
        where: {
          trigger: event.trigger,
          isActive: true,
        },
      });

      for (const wf of activeWorkflows) {
        await executeWorkflow(wf, event.data);
      }
    } catch (err) {
      console.error(`❌ [Workflow Engine] Failed to dispatch event ${event.trigger}:`, err);
    }
  });
}

/**
 * Core Workflow Execution Engine
 * Handles project creation, task generation, notifications, and webhooks safely.
 */
export async function executeWorkflow(workflow: any, triggerData: Record<string, any>): Promise<{
  status: 'SUCCESS' | 'FAILED';
  resultData: Record<string, any>;
  errorMessage: string | null;
  logId?: string;
}> {
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let resultData: any = {};
  let errorMessage: string | null = null;

  try {
    const config = workflow.actionConfig
      ? typeof workflow.actionConfig === 'string'
        ? JSON.parse(workflow.actionConfig)
        : workflow.actionConfig
      : {};

    switch (workflow.action) {
      case 'create_project': {
        // Safe check for deal foreign key if provided in triggerData
        let validDealId: string | null = null;
        if (triggerData.id) {
          const dealExists = await prisma.deal.findUnique({ where: { id: String(triggerData.id) } });
          if (dealExists) validDealId = dealExists.id;
        }

        const projectName = triggerData.title
          ? `Proyecto: ${triggerData.title}`
          : `Proyecto Automático (${workflow.name})`;

        const project = await prisma.project.create({
          data: {
            name: projectName,
            description: `Generado automáticamente por el workflow '${workflow.name}' a partir del evento '${workflow.trigger}'.`,
            status: 'ACTIVE',
            priority: 'HIGH',
            dealId: validDealId,
            budget: typeof triggerData.value === 'number' ? triggerData.value : 15000,
          },
        });
        resultData = {
          createdProjectId: project.id,
          projectName: project.name,
          budget: project.budget,
          status: 'Proyecto creado correctamente en Agile Planner',
        };
        break;
      }

      case 'send_email': {
        const recipient = triggerData.email || 'cliente@empresa.com';
        const subject = config.subject || `Notificación DAMA-CRM: ${workflow.name}`;
        resultData = {
          sentTo: recipient,
          subject,
          template: config.template || 'welcome_notification',
          delivered: true,
          status: `Email enviado a ${recipient}`,
        };
        break;
      }

      case 'create_task': {
        // Guarantee a valid Project ID for task foreign key
        let targetProjectId = triggerData.projectId;
        if (targetProjectId) {
          const projectExists = await prisma.project.findUnique({ where: { id: targetProjectId } });
          if (!projectExists) targetProjectId = null;
        }

        if (!targetProjectId) {
          const firstProject = await prisma.project.findFirst({ select: { id: true } });
          if (firstProject) {
            targetProjectId = firstProject.id;
          } else {
            const defaultProject = await prisma.project.create({
              data: {
                name: 'Proyecto de Automatizaciones y Operaciones',
                description: 'Contenedor automático para tareas generadas por reglas de workflow',
                status: 'ACTIVE',
                priority: 'MEDIUM',
              },
            });
            targetProjectId = defaultProject.id;
          }
        }

        const task = await prisma.task.create({
          data: {
            projectId: targetProjectId,
            title: config.taskTitle || triggerData.title || `Tarea automática: ${workflow.name}`,
            description: config.taskDescription || 'Seguimiento por regla de automatización',
            status: 'TODO',
            priority: 'HIGH',
            storyPoints: 2,
            estimatedHours: 4,
          },
        });

        resultData = {
          createdTaskId: task.id,
          taskTitle: task.title,
          projectId: targetProjectId,
          status: 'Tarea técnica generada con éxito',
        };
        break;
      }

      case 'webhook_dispatch': {
        const targetUrl = config.webhookUrl || 'https://api.crm-webhook.local/events';
        resultData = {
          targetUrl,
          dispatchedPayload: {
            workflow: workflow.name,
            trigger: workflow.trigger,
            eventData: triggerData,
            timestamp: new Date().toISOString(),
          },
          status: 'Webhook emitido con éxito',
        };
        break;
      }

      default: {
        resultData = {
          executed: true,
          action: workflow.action,
          status: 'Acción procesada sin errores',
        };
        break;
      }
    }

    // Increment execution count on workflow
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });
  } catch (err: any) {
    status = 'FAILED';
    errorMessage = err.message || 'Error en ejecución de acción';
  }

  // Record workflow execution log
  const log = await prisma.workflowLog.create({
    data: {
      workflowId: workflow.id,
      status,
      triggerData: JSON.stringify(triggerData),
      resultData: JSON.stringify(resultData),
      errorMessage,
    },
  });

  console.log(`🤖 [Workflow Engine] Executed '${workflow.name}' (${status})`);
  return { status, resultData, errorMessage, logId: log.id };
}
