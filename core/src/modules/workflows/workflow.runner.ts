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
  // Run asynchronously in background
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

async function executeWorkflow(workflow: any, triggerData: Record<string, any>): Promise<void> {
  let status = 'SUCCESS';
  let resultData: any = {};
  let errorMessage: string | null = null;

  try {
    const config = workflow.actionConfig ? JSON.parse(workflow.actionConfig) : {};

    switch (workflow.action) {
      case 'create_project': {
        // Automatic project creation from Deal
        const projectName = triggerData.title ? `Proyecto: ${triggerData.title}` : `Nuevo Proyecto de Deal`;
        const project = await prisma.project.create({
          data: {
            name: projectName,
            description: `Generado automáticamente por el workflow '${workflow.name}' a partir del cierre comercial del Deal.`,
            status: 'ACTIVE',
            priority: 'HIGH',
            dealId: triggerData.id || null,
            budget: triggerData.value || null,
          },
        });
        resultData = { createdProjectId: project.id, projectName: project.name };
        break;
      }

      case 'send_email': {
        resultData = {
          sentTo: triggerData.email || 'cliente@ejemplo.com',
          subject: config.subject || 'Notificación DAMA-CRM',
          delivered: true,
        };
        break;
      }

      case 'create_task': {
        if (triggerData.projectId) {
          const task = await prisma.task.create({
            data: {
              projectId: triggerData.projectId,
              title: config.taskTitle || 'Tarea generada automáticamente',
              description: config.taskDescription || 'Seguimiento por regla de automatización',
              status: 'TODO',
              priority: 'MEDIUM',
            },
          });
          resultData = { createdTaskId: task.id };
        }
        break;
      }

      default: {
        resultData = { executed: true, action: workflow.action };
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

  // Record workflow log
  await prisma.workflowLog.create({
    data: {
      workflowId: workflow.id,
      status,
      triggerData: JSON.stringify(triggerData),
      resultData: JSON.stringify(resultData),
      errorMessage,
    },
  });

  console.log(`🤖 [Workflow Engine] Executed '${workflow.name}' (${status})`);
}
